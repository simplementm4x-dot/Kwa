/* =========================================================
   TU JOUES A KWA ? — serveur du mode multi-telephones
   Serveur HTTP statique + relais WebSocket, sans aucune
   dependance externe (implementation RFC 6455 minimale).

   Lancement :  node server/server.js
   Puis chaque telephone ouvre http://<ip-du-pc>:8080
   ========================================================= */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.resolve(__dirname, '..');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/* Un message ne devrait jamais depasser quelques centaines de Ko (une image
   de joueur). Au-dela on coupe : sans plafond, une trame annoncant une taille
   enorme ferait gonfler la memoire en attendant des octets qui ne viennent pas. */
const MAX_FRAME = 1024 * 1024;

/* Beaucoup de proxys ferment un WebSocket inactif au bout d une minute, et un
   telephone qui perd le reseau ne previent pas. On envoie donc un ping
   regulier et on ferme ce qui ne repond plus. */
const PING_MS = 25000;
const DEAD_MS = 70000;

/* ---------------------------------------------------------
   1. Serveur de fichiers statiques
   --------------------------------------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.join(ROOT, path.normalize(rel).replace(/^([/\\])+/, ''));

  /* on refuse toute sortie du dossier du projet */
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Interdit'); return; }

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buf);
  });
});

/* ---------------------------------------------------------
   2. WebSocket minimal
   --------------------------------------------------------- */
function accept(key) {
  return crypto.createHash('sha1').update(key + GUID).digest('base64');
}

function encodeFrame(str) {
  const payload = Buffer.from(str, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeUInt32BE(Math.floor(len / 4294967296), 2);
    header.writeUInt32BE(len >>> 0, 6);
  }
  header[0] = 0x81;                       /* FIN + opcode texte */
  return Buffer.concat([header, payload]);
}

function encodeCtrl(opcode, payload) {
  const p = payload || Buffer.alloc(0);
  const h = Buffer.alloc(2);
  h[0] = 0x80 | opcode;
  h[1] = p.length;
  return Buffer.concat([h, p]);
}

/** Un client connecte */
let nextId = 1;
class Client {
  constructor(socket) {
    this.socket = socket;
    this.id = 'c' + (nextId++);
    this.room = null;
    this.player = null;
    this.alive = true;
    this.buf = Buffer.alloc(0);
    this.frags = [];
    this.seen = Date.now();
  }
  ping() {
    if (!this.alive) return;
    try { this.socket.write(encodeCtrl(0x9)); } catch (e) { this.close(); }
  }
  send(obj) {
    if (!this.alive) return;
    try { this.socket.write(encodeFrame(JSON.stringify(obj))); }
    catch (e) { this.close(); }
  }
  close() {
    if (!this.alive) return;
    this.alive = false;
    try { this.socket.end(); } catch (e) {}
    leave(this);
  }
}

const clients = new Map();

/* Quand le serveur de salons est ouvert sur internet, KWA_ORIGINS limite les
   sites autorises a s y connecter :
   KWA_ORIGINS="https://monjeu.netlify.app,https://monsite.fr"
   Non renseigne, tout le monde est accepte (pratique sur un reseau local). */
const ORIGINS = (process.env.KWA_ORIGINS || '')
  .split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);

function originAllowed(req) {
  if (!ORIGINS.length) return true;
  const o = (req.headers.origin || '').replace(/\/+$/, '');
  if (!o) return true;                 /* client non-navigateur */
  return ORIGINS.indexOf(o) >= 0;
}

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  if (!originAllowed(req)) {
    log('origine refusee : ' + req.headers.origin);
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept(key) + '\r\n\r\n'
  );
  socket.setNoDelay(true);

  const c = new Client(socket);
  clients.set(c.id, c);

  socket.on('data', chunk => {
    c.buf = Buffer.concat([c.buf, chunk]);
    parse(c);
  });
  socket.on('error', () => c.close());
  socket.on('close', () => { clients.delete(c.id); c.close(); });
});

function parse(c) {
  for (;;) {
    const b = c.buf;
    if (b.length < 2) return;
    const fin = (b[0] & 0x80) === 0x80;
    const opcode = b[0] & 0x0f;
    const masked = (b[1] & 0x80) === 0x80;
    let len = b[1] & 0x7f;
    let off = 2;

    if (len === 126) {
      if (b.length < off + 2) return;
      len = b.readUInt16BE(off); off += 2;
    } else if (len === 127) {
      if (b.length < off + 8) return;
      const hi = b.readUInt32BE(off), lo = b.readUInt32BE(off + 4);
      len = hi * 4294967296 + lo; off += 8;
    }
    if (len > MAX_FRAME) { log('trame trop grosse (' + len + ' octets), on ferme'); c.close(); return; }
    let mask = null;
    if (masked) {
      if (b.length < off + 4) return;
      mask = b.slice(off, off + 4); off += 4;
    }
    if (b.length < off + len) return;

    let payload = b.slice(off, off + len);
    if (mask) {
      const out = Buffer.alloc(len);
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
      payload = out;
    }
    c.buf = b.slice(off + len);
    c.seen = Date.now();

    if (opcode === 0x8) { c.close(); return; }
    if (opcode === 0x9) { try { c.socket.write(encodeCtrl(0xA, payload)); } catch (e) {} continue; }
    if (opcode === 0xA) continue;   /* pong : la ligne est vivante */

    if (opcode === 0x0) c.frags.push(payload);
    else c.frags = [payload];

    if (c.frags.reduce((n, f) => n + f.length, 0) > MAX_FRAME) { c.close(); return; }

    if (fin) {
      const full = Buffer.concat(c.frags).toString('utf8');
      c.frags = [];
      let msg = null;
      try { msg = JSON.parse(full); } catch (e) { continue; }
      handle(c, msg);
    }
  }
}

/* ---------------------------------------------------------
   3. Salons
   --------------------------------------------------------- */
const rooms = new Map();   /* code -> { code, hostId, members:[clientId] } */

/* 3 chiffres suffisent entre amis sur le meme Wi-Fi. Sur un site public,
   900 codes se devinent : KWA_CODE_LEN=5 ou 6 rend le salon inatteignable
   au hasard. */
const CODE_LEN = Math.min(8, Math.max(3, parseInt(process.env.KWA_CODE_LEN, 10) || 3));

function newCode() {
  const min = Math.pow(10, CODE_LEN - 1);
  const span = min * 9;
  for (let tries = 0; tries < 2000; tries++) {
    const code = String(min + crypto.randomInt(span));
    if (!rooms.has(code)) return code;
  }
  return null;
}

function roomPlayers(room) {
  return room.members
    .map(id => clients.get(id))
    .filter(c => c && c.alive && c.player)
    .map(c => Object.assign({}, c.player, { id: c.id, host: c.id === room.hostId }));
}

function broadcast(room, obj, exceptId) {
  room.members.forEach(id => {
    if (id === exceptId) return;
    const c = clients.get(id);
    if (c && c.alive) c.send(obj);
  });
}

function pushPlayers(room) {
  broadcast(room, { t: 'players', players: roomPlayers(room), hostId: room.hostId });
}

function leave(c) {
  if (!c.room) return;
  const room = rooms.get(c.room);
  c.room = null;
  if (!room) return;
  room.members = room.members.filter(id => id !== c.id);
  if (!room.members.length) { rooms.delete(room.code); log('salon ' + room.code + ' ferme'); return; }
  if (room.hostId === c.id) {
    broadcast(room, { t: 'hostgone' });
    room.members.forEach(id => { const x = clients.get(id); if (x) x.room = null; });
    rooms.delete(room.code);
    log('salon ' + room.code + ' ferme (hote parti)');
    return;
  }
  pushPlayers(room);
}

function handle(c, m) {
  switch (m.t) {

    case 'create': {
      const code = newCode();
      if (!code) { c.send({ t: 'error', msg: 'Plus de salon disponible' }); return; }
      const room = { code, hostId: c.id, members: [c.id] };
      rooms.set(code, room);
      c.room = code;
      c.player = sanitize(m.p);
      c.send({ t: 'room', code, you: c.id, hostId: c.id, players: roomPlayers(room) });
      log('salon ' + code + ' cree');
      break;
    }

    case 'join': {
      const room = rooms.get(String(m.code || '').trim());
      if (!room) { c.send({ t: 'error', msg: 'Aucun salon avec ce code' }); return; }
      if (room.members.length >= 8) { c.send({ t: 'error', msg: 'Salon complet (8 joueurs)' }); return; }
      if (room.started) { c.send({ t: 'error', msg: 'La partie a deja commence' }); return; }
      leave(c);
      c.room = room.code;
      c.player = sanitize(m.p);
      room.members.push(c.id);
      c.send({ t: 'room', code: room.code, you: c.id, hostId: room.hostId, players: roomPlayers(room) });
      pushPlayers(room);
      log('joueur rejoint le salon ' + room.code);
      break;
    }

    case 'me': {
      const room = rooms.get(c.room);
      if (!room) return;
      c.player = sanitize(m.p);
      pushPlayers(room);
      break;
    }

    case 'kick': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      const victim = clients.get(m.id);
      if (victim) { victim.send({ t: 'kicked' }); leave(victim); }
      break;
    }

    case 'start': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      room.started = true;
      broadcast(room, { t: 'start', settings: m.settings, players: roomPlayers(room) });
      log('partie lancee dans le salon ' + room.code);
      break;
    }

    /* l hote pose une question a un joueur */
    case 'ask': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      const target = clients.get(m.to);
      if (target && target.alive) target.send({ t: 'ask', id: m.id, spec: m.spec });
      break;
    }

    /* l hote annule une question en attente */
    case 'unask': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      const target = clients.get(m.to);
      if (target && target.alive) target.send({ t: 'unask', id: m.id });
      break;
    }

    /* un joueur repond : on renvoie a l hote */
    case 'answer': {
      const room = rooms.get(c.room);
      if (!room) return;
      const host = clients.get(room.hostId);
      if (host && host.alive) host.send({ t: 'answer', id: m.id, value: m.value, from: c.id });
      break;
    }

    /* l hote diffuse l etat de la partie */
    case 'state': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      broadcast(room, { t: 'state', data: m.data }, c.id);
      break;
    }

    /* l hote diffuse ce que tous les ecrans doivent afficher */
    case 'ev': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.id) return;
      broadcast(room, { t: 'ev', ev: m.ev, d: m.d }, c.id);
      break;
    }

    case 'ping': c.send({ t: 'pong' }); break;
  }
}

function sanitize(p) {
  p = p || {};
  const img = typeof p.img === 'string' && p.img.startsWith('data:image/') && p.img.length < 400000 ? p.img : null;
  return {
    name: String(p.name || 'Joueur').slice(0, 14),
    color: String(p.color || 'rouge').slice(0, 12),
    hex: /^#[0-9a-fA-F]{6}$/.test(p.hex || '') ? p.hex : '#ff4d5e',
    img
  };
}

/* ---------------------------------------------------------
   4. Demarrage
   --------------------------------------------------------- */
function log(s) { console.log('[kwa] ' + s); }

function localIps() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const name in ifs) {
    (ifs[name] || []).forEach(i => {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
    });
  }
  return out;
}

/* battement de coeur : garde les proxys eveilles, ferme les lignes mortes */
setInterval(() => {
  const now = Date.now();
  clients.forEach(c => {
    if (!c.alive) return;
    if (now - c.seen > DEAD_MS) { log('client silencieux, on ferme'); c.close(); return; }
    c.ping();
  });
}, PING_MS).unref();

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ┌───────────────────────────────────────────┐');
  console.log('  │        TU JOUES A KWA ? — serveur         │');
  console.log('  └───────────────────────────────────────────┘');
  console.log('');
  console.log('  Sur ce PC        : http://localhost:' + PORT);
  localIps().forEach(ip => console.log('  Sur les mobiles  : http://' + ip + ':' + PORT));
  console.log('');
  console.log('  Tous les telephones doivent etre sur le meme Wi-Fi.');
  console.log('  Ctrl+C pour arreter.');
  console.log('');
});
