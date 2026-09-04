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
/* doit rester d accord avec K.MAX_JOUEURS, cote client */
const MAX_SIEGES = 10;

/* Beaucoup de proxys ferment un WebSocket inactif au bout d une minute, et un
   telephone qui perd le reseau ne previent pas. On envoie donc un ping
   regulier et on ferme ce qui ne repond plus. */
const PING_MS = 25000;
const DEAD_MS = 70000;

/* Une coupure de reseau ne doit pas couter la partie. Le siege d un joueur
   parti reste chaud : il revient avec son pion, sa position et son tour.
   L hote a droit a un delai plus long parce que sans lui plus rien n avance. */
const HOST_GRACE_MS = 180000;   /* hote absent : au-dela, on rend les armes */
const ROOM_TTL_MS = 900000;     /* salon ou plus personne n est branche */
const SWEEP_MS = 15000;

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
  '.woff2': 'font/woff2',
  '.webm': 'audio/webm',
  '.m4a': 'audio/mp4'
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
    this.seat = null;
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
const rooms = new Map();   /* code -> { code, hostId, started, seats:[] } */

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

/* ---------------------------------------------------------
   Les sieges
   Un siege, c est une place a la table : un nom, une couleur,
   une position sur le plateau. La socket n en est que le fil.
   Elle casse, le siege reste, et le jeton permet de s y rasseoir.
   --------------------------------------------------------- */
let nextSeat = 1;

function newSeat(room, c, p) {
  const seat = {
    id: 's' + (nextSeat++),
    token: crypto.randomBytes(9).toString('hex'),
    player: sanitize(p),
    cid: c.id,
    goneAt: 0
  };
  room.seats.push(seat);
  c.room = room.code;
  c.seat = seat.id;
  return seat;
}

function seatOf(room, id) {
  return room.seats.find(s => s.id === id) || null;
}

/** la socket vivante d un siege, ou null s il attend son occupant */
function seatSock(seat) {
  if (!seat || !seat.cid) return null;
  const c = clients.get(seat.cid);
  return c && c.alive ? c : null;
}

function roomPlayers(room) {
  return room.seats.map(s => Object.assign({}, s.player, {
    id: s.id,
    host: s.id === room.hostId,
    off: !seatSock(s)
  }));
}

function broadcast(room, obj, exceptSeat) {
  room.seats.forEach(s => {
    if (s.id === exceptSeat) return;
    const c = seatSock(s);
    if (c) c.send(obj);
  });
}

function sendSeat(room, id, obj) {
  const c = seatSock(seatOf(room, id));
  if (c) c.send(obj);
}

function sendHost(room, obj) {
  sendSeat(room, room.hostId, obj);
}

function pushPlayers(room) {
  broadcast(room, { t: 'players', players: roomPlayers(room), hostId: room.hostId });
}

function closeRoom(room, why) {
  broadcast(room, { t: 'hostgone' });
  room.seats.forEach(s => {
    const c = seatSock(s);
    if (c) { c.room = null; c.seat = null; }
  });
  rooms.delete(room.code);
  log('salon ' + room.code + ' ferme (' + why + ')');
}

function leave(c) {
  const room = rooms.get(c.room);
  const seatId = c.seat;
  c.room = null;
  c.seat = null;
  if (!room) return;
  const seat = seatOf(room, seatId);
  /* une socket plus recente a deja repris ce siege : rien a liberer */
  if (!seat || seat.cid !== c.id) return;
  seat.cid = null;
  seat.goneAt = Date.now();

  /* avant le lancement, une place vide n a pas de sens : on la retire */
  if (!room.started) {
    room.seats = room.seats.filter(s => s !== seat);
    if (seat.id === room.hostId || !room.seats.length) { closeRoom(room, 'hote parti'); return; }
    pushPlayers(room);
    return;
  }

  /* en pleine partie, on garde la place au chaud */
  pushPlayers(room);
  if (seat.id === room.hostId) broadcast(room, { t: 'hostoff' });
  else sendHost(room, { t: 'gone', id: seat.id });
  log('salon ' + room.code + ' : ' + seat.player.name + ' a perdu la ligne');
}

function handle(c, m) {
  switch (m.t) {

    case 'create': {
      const code = newCode();
      if (!code) { c.send({ t: 'error', msg: 'Plus de salon disponible' }); return; }
      const room = { code, hostId: null, started: false, seats: [] };
      rooms.set(code, room);
      const seat = newSeat(room, c, m.p);
      room.hostId = seat.id;
      c.send({
        t: 'room', code, you: seat.id, token: seat.token,
        hostId: room.hostId, players: roomPlayers(room)
      });
      log('salon ' + code + ' cree');
      break;
    }

    case 'join': {
      const room = rooms.get(String(m.code || '').trim());
      if (!room) { c.send({ t: 'error', msg: 'Aucun salon avec ce code' }); return; }
      if (room.seats.length >= MAX_SIEGES) {
        c.send({ t: 'error', msg: 'Salon complet (' + MAX_SIEGES + ' joueurs)' }); return;
      }
      if (room.started) { c.send({ t: 'error', msg: 'La partie a deja commence' }); return; }
      leave(c);
      const seat = newSeat(room, c, m.p);
      c.send({
        t: 'room', code: room.code, you: seat.id, token: seat.token,
        hostId: room.hostId, players: roomPlayers(room)
      });
      pushPlayers(room);
      log('joueur rejoint le salon ' + room.code);
      break;
    }

    /* --- retour apres une coupure : on se rassoit sur son siege --- */
    case 'resume': {
      const room = rooms.get(String(m.code || '').trim());
      if (!room) { c.send({ t: 'error', msg: 'Ce salon n existe plus.', fatal: true }); return; }
      const seat = seatOf(room, m.id);
      if (!seat || !m.token || seat.token !== m.token) {
        c.send({ t: 'error', msg: 'Ta place n est plus reservee.', fatal: true });
        return;
      }
      /* L hote porte la partie dans la memoire de sa page. S il a recharge,
         il n y a plus rien a reprendre : autant le dire tout de suite au
         lieu de laisser les autres devant un plateau qui ne bougera plus. */
      if (seat.id === room.hostId && room.started && !m.live) {
        closeRoom(room, 'la page de l hote a ete rechargee');
        return;
      }
      const old = seatSock(seat);
      if (old && old.id !== c.id) { old.room = null; old.seat = null; old.close(); }
      leave(c);
      seat.cid = c.id;
      seat.goneAt = 0;
      c.room = room.code;
      c.seat = seat.id;
      c.send({
        t: 'room', code: room.code, you: seat.id, token: seat.token,
        hostId: room.hostId, players: roomPlayers(room),
        resumed: true, started: !!room.started
      });
      pushPlayers(room);
      if (seat.id === room.hostId) broadcast(room, { t: 'hostback' }, seat.id);
      else sendHost(room, { t: 'back', id: seat.id });
      log('salon ' + room.code + ' : ' + seat.player.name + ' est revenu');
      break;
    }

    case 'me': {
      const room = rooms.get(c.room);
      const seat = room ? seatOf(room, c.seat) : null;
      if (!seat) return;
      seat.player = sanitize(m.p);
      pushPlayers(room);
      break;
    }

    case 'kick': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      const seat = seatOf(room, m.id);
      if (!seat) return;
      const v = seatSock(seat);
      room.seats = room.seats.filter(x => x !== seat);
      if (v) { v.send({ t: 'kicked' }); v.room = null; v.seat = null; v.close(); }
      pushPlayers(room);
      break;
    }

    /* depart volontaire : contrairement a une coupure, on ne garde pas la place */
    case 'quit': {
      const room = rooms.get(c.room);
      if (!room) return;
      if (room.hostId === c.seat) { closeRoom(room, 'hote a quitte'); return; }
      const seat = seatOf(room, c.seat);
      room.seats = room.seats.filter(x => x !== seat);
      c.room = null; c.seat = null;
      pushPlayers(room);
      break;
    }

    case 'start': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      room.started = true;
      broadcast(room, { t: 'start', settings: m.settings, players: roomPlayers(room) }, c.seat);
      log('partie lancee dans le salon ' + room.code);
      break;
    }

    /* l hote pose une question a un joueur */
    case 'ask': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      sendSeat(room, m.to, { t: 'ask', id: m.id, spec: m.spec });
      break;
    }

    /* l hote annule une question en attente */
    case 'unask': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      sendSeat(room, m.to, { t: 'unask', id: m.id });
      break;
    }

    /* un joueur repond : on renvoie a l hote */
    case 'answer': {
      const room = rooms.get(c.room);
      if (!room) return;
      sendHost(room, { t: 'answer', id: m.id, value: m.value, from: c.seat });
      break;
    }

    /* l hote remet un seul ecran a jour : celui qui revient de coupure */
    case 'to': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      if (m.m && typeof m.m === 'object') sendSeat(room, m.id, m.m);
      break;
    }

    /* l hote diffuse l etat de la partie */
    case 'state': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      broadcast(room, { t: 'state', data: m.data }, c.seat);
      break;
    }

    /* l hote diffuse ce que tous les ecrans doivent afficher */
    case 'ev': {
      const room = rooms.get(c.room);
      if (!room || room.hostId !== c.seat) return;
      broadcast(room, { t: 'ev', ev: m.ev, d: m.d }, c.seat);
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

/* Un salon dont l hote ne revient pas bloquerait ses joueurs indefiniment,
   et un salon que tout le monde a quitte occuperait la memoire pour rien. */
setInterval(() => {
  const now = Date.now();
  rooms.forEach(room => {
    const host = seatOf(room, room.hostId);
    if (room.started && host && !seatSock(host) && now - host.goneAt > HOST_GRACE_MS) {
      closeRoom(room, 'hote absent trop longtemps');
      return;
    }
    if (room.seats.some(x => seatSock(x))) return;
    const last = room.seats.reduce((mx, x) => Math.max(mx, x.goneAt), 0);
    if (now - last > ROOM_TTL_MS) closeRoom(room, 'plus personne');
  });
}, SWEEP_MS).unref();

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
