global.window = global;
const fs=require('fs');
/* on charge tous les paquets presents plutot qu un intervalle fixe :
   ajouter un fichier de cartes ne doit pas demander de toucher au test */
const paquets = fs.readdirSync('js/data').filter(n => n.indexOf('cards-') === 0 && n.slice(-3) === '.js').sort();
paquets.forEach(n=>eval(fs.readFileSync('js/data/'+n,'utf8')));
console.log('Paquets charges :', paquets.length);
const C = global.KWA.CARDS;
console.log('Cartes totales :', C.length);
let errs=[], themes={};
C.forEach((c,i)=>{
  if(!c.t||!c.c) errs.push('carte '+i+' : titre/categorie manquant');
  if(themes[c.t]) errs.push('theme duplique : '+c.t); themes[c.t]=1;
  if(!c.q||c.q.length!==10) errs.push(c.t+' : '+(c.q?c.q.length:0)+' questions au lieu de 10');
  (c.q||[]).forEach((q,k)=>{
    if(!q.q) errs.push(c.t+' Q'+(k+1)+' : enonce vide');
    if(q.o){
      if(q.o.length<2) errs.push(c.t+' Q'+(k+1)+' : trop peu de choix');
      if(typeof q.a!=='number'||q.a<0||q.a>=q.o.length) errs.push(c.t+' Q'+(k+1)+' : index de reponse invalide');
      if(new Set(q.o).size!==q.o.length) errs.push(c.t+' Q'+(k+1)+' : choix dupliques');
    } else if(typeof q.a!=='string'||!q.a.trim()) errs.push(c.t+' Q'+(k+1)+' : reponse libre vide');
  });
});
const cats={}; C.forEach(c=>cats[c.c]=(cats[c.c]||0)+1);
console.log('Questions totales :', C.reduce((s,c)=>s+c.q.length,0));
console.log('Categories :', JSON.stringify(cats));
console.log(errs.length? 'ECHECS:\n'+errs.join('\n') : 'Aucune erreur de structure.');
process.exit(errs.length ? 1 : 0);
