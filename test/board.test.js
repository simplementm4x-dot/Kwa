/* Plateau : repartition des cases et reconstruction a l identique. */
global.window = global;
global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
global.document = { querySelector: () => null, querySelectorAll: () => [], addEventListener(){}, createElement: () => ({style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){}}) };
const fs=require('fs');
['js/util.js','js/state.js','js/board.js'].forEach(f=>eval(fs.readFileSync(f,'utf8')));
const K=global.KWA;
const fails=[];
const snap=()=>JSON.stringify({t:K.board.typeList(),pos:K.board.tiles().map(t=>[Math.round(t.gx),Math.round(t.gy)]),p:K.board.propList().map(p=>[Math.round(p.gx),Math.round(p.gy),p.kind,p.variant,Math.round(p.h)])});

[['solo',false],['solo',true],['multi',false]].forEach(([device,duelSolo])=>{
  K.state.settings.device=device; K.state.settings.duelSolo=duelSolo;
  for(const len of [20,21,40,63,80]){
    const t=K.board.generate(len);
    if(t.length!==len) fails.push(device+'/'+len+' : '+t.length+' cases');
    if(t[0].type!=='start') fails.push(device+'/'+len+' : depart manquant');
    if(t[len-1].type!=='finish') fails.push(device+'/'+len+' : terminus manquant');
    const c={}; t.forEach(x=>c[x.type]=(c[x.type]||0)+1);
    if(!K.rules.duelAllowed()&&c.duel) fails.push(device+' : case duel interdite presente');
    const seen=new Set();
    t.forEach(x=>{const k=Math.round(x.gx)+':'+Math.round(x.gy); if(seen.has(k)) fails.push('cases superposees'); seen.add(k);});
  }
});

K.state.settings.device='multi';
K.board.generate(40);
const types=K.board.typeList(), ref=snap();
K.board.build(types);
if(snap()!==ref) fails.push('le plateau reconstruit differe de celui de l hote');
K.board.generate(63); K.board.generate(20); K.board.build(types);
if(snap()!==ref) fails.push('le plateau n est pas reproductible');

K.util.resetBags();
const drawn=[]; for(let i=0;i<4;i++) drawn.push(K.util.draw('t',['a','b','c','d']));
if(new Set(drawn).size!==4) fails.push('la pioche repete trop tot');

K.state.players=[{id:'a',pos:3},{id:'b',pos:9},{id:'c',pos:5}];
if(K.ranking().map(p=>p.id).join('')!=='bca') fails.push('classement incorrect');

console.log(fails.length? 'ECHECS:\n'+fails.join('\n') : 'Plateau, reconstruction et classement : OK');
process.exit(fails.length?1:0);
