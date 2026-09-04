global.window = global;
const fs=require('fs');
/* on charge tous les paquets presents plutot qu un intervalle fixe :
   ajouter un fichier de cartes ne doit pas demander de toucher au test */
const paquets = fs.readdirSync('js/data').filter(n => n.indexOf('cards-') === 0 && n.slice(-3) === '.js').sort();
paquets.forEach(n=>eval(fs.readFileSync('js/data/'+n,'utf8')));
/* et les variantes, qui vivent dans leurs propres fichiers et se collent
   sur les cartes par leur theme */
const lots = fs.readdirSync('js/data').filter(n => n.indexOf('variantes-') === 0 && n.slice(-3) === '.js').sort();
lots.forEach(n=>eval(fs.readFileSync('js/data/'+n,'utf8')));
console.log('Paquets charges :', paquets.length, '| lots de variantes :', lots.length);
const C = global.KWA.CARDS;
const V = global.KWA.VARIANTES || [];
console.log('Cartes totales :', C.length);

let errs=[], themes={};

/** une question, quel que soit son format */
function verifie(q, ou) {
  if(!q || !q.q) { errs.push(ou+' : enonce vide'); return; }
  if(q.o){
    if(q.o.length<2) errs.push(ou+' : trop peu de choix');
    if(typeof q.a!=='number'||q.a<0||q.a>=q.o.length) errs.push(ou+' : index de reponse invalide');
    if(new Set(q.o).size!==q.o.length) errs.push(ou+' : choix dupliques');
  } else if(typeof q.a!=='string'||!q.a.trim()) errs.push(ou+' : reponse libre vide');
}

C.forEach((c,i)=>{
  if(!c.t||!c.c) errs.push('carte '+i+' : titre/categorie manquant');
  if(themes[c.t]) errs.push('theme duplique : '+c.t); themes[c.t]=1;
  if(!c.q||c.q.length!==10) errs.push(c.t+' : '+(c.q?c.q.length:0)+' questions au lieu de 10');
  (c.q||[]).forEach((q,k)=>verifie(q, c.t+' Q'+(k+1)));
});

/* --- les variantes --- */
let ajoutees = 0, sansCarte = [];
const parTheme = {};
V.forEach(lot => {
  const carte = C.find(c => c.t === lot.t);
  if (!carte) { sansCarte.push(lot.t); return; }
  if (!lot.v || typeof lot.v !== 'object') { errs.push(lot.t + ' : lot de variantes vide'); return; }
  Object.keys(lot.v).forEach(n => {
    const niveau = +n;
    if (!(niveau >= 1 && niveau <= 10)) errs.push(lot.t + ' : niveau ' + n + ' hors bornes');
    const liste = lot.v[n];
    if (!Array.isArray(liste) || !liste.length) {
      errs.push(lot.t + ' niveau ' + n + ' : liste de variantes vide');
      return;
    }
    liste.forEach((q, k) => {
      verifie(q, lot.t + ' niveau ' + n + ' variante ' + (k + 2));
      /* une variante ne doit pas etre la question d origine recopiee */
      const orig = carte.q[niveau - 1];
      if (orig && orig.q === q.q) errs.push(lot.t + ' niveau ' + n + ' : variante identique a l originale');
      /* le format doit rester celui du niveau : QCM ou reponse libre */
      if (orig && !!orig.o !== !!q.o) {
        errs.push(lot.t + ' niveau ' + n + ' variante ' + (k + 2) +
                  ' : ' + (q.o ? 'a choix' : 'libre') + ' alors que le niveau est ' +
                  (orig.o ? 'a choix' : 'libre'));
      }
      ajoutees++;
    });
    /* et deux variantes du meme niveau ne doivent pas se repeter */
    const vus = liste.map(q => q.q);
    if (new Set(vus).size !== vus.length) errs.push(lot.t + ' niveau ' + n + ' : deux variantes identiques');
  });
  parTheme[lot.t] = Object.keys(lot.v).length;
});
sansCarte.forEach(t => errs.push('variantes pour "' + t + '" : aucune carte de ce theme'));

const complets = Object.keys(parTheme).filter(t => parTheme[t] === 10).length;
const cats={}; C.forEach(c=>cats[c.c]=(cats[c.c]||0)+1);
const base = C.reduce((s,c)=>s+c.q.length,0);
console.log('Questions de base :', base, '| variantes :', ajoutees, '| total :', base + ajoutees);
console.log('Themes varies :', Object.keys(parTheme).length, '(' + complets + ' sur les 10 niveaux) sur ' + C.length);
console.log('Categories :', JSON.stringify(cats));
console.log(errs.length? 'ECHECS:\n'+errs.join('\n') : 'Aucune erreur de structure.');
process.exit(errs.length ? 1 : 0);
