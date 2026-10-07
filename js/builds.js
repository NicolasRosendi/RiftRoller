/* =========================================================
   RUNAS Y HECHIZOS
   Árboles como en el cliente (pool de 2026: desde el 26.9 Brujería tiene
   Stormraider's Surge y Deathfire Touch en lugar de Phase Rush).
   Cada campeón arranca con una página recomendada según su arquetipo y su línea.
   La página elegida suma o resta puntos de la composición según qué tan bien encaja
   con el campeón, con la composición propia y, en la simulación, con el rival.
   ========================================================= */
const TREES={
  P:{name:"Precisión",color:"#c8aa6e",
     keys:["Press the Attack","Lethal Tempo","Fleet Footwork","Conqueror"],
     rows:[["Absorb Life","Triumph","Presence of Mind"],["Legend: Alacrity","Legend: Haste","Legend: Bloodline"],["Coup de Grace","Cut Down","Last Stand"]]},
  D:{name:"Dominación",color:"#d44242",
     keys:["Electrocute","Dark Harvest","Hail of Blades"],
     rows:[["Cheap Shot","Taste of Blood","Sudden Impact"],["Sixth Sense","Grisly Mementos","Deep Ward"],["Treasure Hunter","Relentless Hunter","Ultimate Hunter"]]},
  S:{name:"Brujería",color:"#9faafc",
     keys:["Summon Aery","Arcane Comet","Stormraider's Surge","Deathfire Touch"],
     rows:[["Axiom Arcanist","Manaflow Band","Nimbus Cloak"],["Transcendence","Celerity","Absolute Focus"],["Scorch","Waterwalking","Gathering Storm"]]},
  R:{name:"Valor",color:"#a1d586",
     keys:["Grasp of the Undying","Aftershock","Guardian"],
     rows:[["Demolish","Font of Life","Shield Bash"],["Conditioning","Second Wind","Bone Plating"],["Overgrowth","Revitalize","Unflinching"]]},
  I:{name:"Inspiración",color:"#49aab9",
     keys:["Glacial Augment","Unsealed Spellbook","First Strike"],
     rows:[["Hextech Flashtraption","Magical Footwear","Cash Back"],["Triple Tonic","Time Warp Tonic","Biscuit Delivery"],["Cosmic Insight","Approach Velocity","Jack of All Trades"]]}
};
const TREE_ORDER=["P","D","S","R","I"];
const RUNE_DESC={
  "Press the Attack":"Tres ataques seguidos exponen al rival: más daño de todo el equipo sobre él.",
  "Lethal Tempo":"Atacar acumula velocidad de ataque y alcance. Para carries de ataque básico.",
  "Fleet Footwork":"Ataque energizado que cura y da velocidad. Línea segura.",
  "Conqueror":"Pelear acumula fuerza adaptable y cura con el daño. Para peleas largas.",
  "Electrocute":"Tres golpes distintos rápidos: daño extra. Ráfaga.",
  "Dark Harvest":"Daño extra a rivales con poca vida; acumula almas y escala.",
  "Hail of Blades":"Los primeros ataques son muy rápidos. Entradas explosivas.",
  "Summon Aery":"Aery daña rivales o escuda aliados. Poke y encantadores.",
  "Arcane Comet":"Las habilidades que pegan tiran un cometa. Poke.",
  "Stormraider's Surge":"Hacer 25% de la vida del rival en 3 s da velocidad y resistencia a ralentizaciones.",
  "Deathfire Touch":"Las habilidades queman al objetivo con el tiempo. Trades de poke y magos de soporte.",
  "Grasp of the Undying":"Cada tanto, un ataque cura y suma vida permanente. Tanques de línea.",
  "Aftershock":"Al inmovilizar, ganás resistencias y explotás después. Iniciadores.",
  "Guardian":"Escudo a un aliado cercano cuando lo atacan. Protección.",
  "Glacial Augment":"Ralentizar con ataques o ítems deja zonas heladas. Control.",
  "Unsealed Spellbook":"Cambiá hechizos de invocador durante la partida.",
  "First Strike":"Pegar primero da daño extra y oro. Poke y carries de línea.",
  "Absorb Life":"Matar unidades cura.","Triumph":"Las kills curan y dan oro extra.","Presence of Mind":"Golpear campeones devuelve maná; las kills dan maná máximo.",
  "Legend: Alacrity":"Velocidad de ataque con las kills.","Legend: Haste":"Aceleración de habilidades básicas.","Legend: Bloodline":"Robo de vida y vida máxima.",
  "Coup de Grace":"Más daño a rivales con poca vida.","Cut Down":"Más daño a rivales con más vida máxima (tanques).","Last Stand":"Más daño cuanto menos vida tenés.",
  "Cheap Shot":"Daño verdadero a rivales con control.","Taste of Blood":"Curación al dañar campeones.","Sudden Impact":"Penetración después de saltar o volverse invisible.",
  "Sixth Sense":"Revela wards cercanas.","Grisly Mementos":"Rastreo y detección de rivales.","Deep Ward":"Wards más duraderas.",
  "Treasure Hunter":"Oro extra con kills de campeones distintos.","Relentless Hunter":"Velocidad fuera de combate.","Ultimate Hunter":"Menos enfriamiento de la definitiva.",
  "Axiom Arcanist":"La definitiva hace más daño y se recarga con kills.","Manaflow Band":"Maná máximo extra al pegar con habilidades.","Nimbus Cloak":"Velocidad al usar hechizos de invocador.",
  "Transcendence":"Aceleración en niveles 5 y 8; las kills reducen enfriamientos.","Celerity":"Más velocidad de movimiento de todas las fuentes.","Absolute Focus":"Fuerza adaptable con la vida alta.",
  "Scorch":"Las habilidades queman en la fase de líneas.","Waterwalking":"Velocidad y fuerza en el río.","Gathering Storm":"Fuerza adaptable que crece con el tiempo.",
  "Demolish":"Daño extra a torres.","Font of Life":"Controlar marca rivales: aliados que les pegan se curan.","Shield Bash":"Con escudo, el próximo ataque hace daño extra.",
  "Conditioning":"Resistencias extra desde el minuto 12.","Second Wind":"Regeneración tras recibir daño de campeones.","Bone Plating":"Menos daño de los próximos golpes tras recibir daño.",
  "Overgrowth":"Vida máxima creciente con minions muertos cerca.","Revitalize":"Curaciones y escudos más fuertes.","Unflinching":"Tenacidad y resistencia a ralentizaciones.",
  "Hextech Flashtraption":"Destello alternativo cuando el tuyo está en enfriamiento.","Magical Footwear":"Botas gratis.","Cash Back":"Devuelve parte del oro de los ítems legendarios.",
  "Triple Tonic":"Elixires gratis en niveles clave.","Time Warp Tonic":"Pociones que curan al instante y dan velocidad.","Biscuit Delivery":"Galletas que curan y dan maná.",
  "Cosmic Insight":"Aceleración de hechizos e ítems.","Approach Velocity":"Velocidad hacia rivales con control.","Jack of All Trades":"Stats extra por variedad de ítems."
};
const SHARDS=[
  {name:"Ofensiva",opts:["Fuerza adaptable","Velocidad de ataque","Aceleración de habilidad"]},
  {name:"Flexible",opts:["Fuerza adaptable","Velocidad de movimiento","Vida escalable"]},
  {name:"Defensa",opts:["Vida","Tenacidad y resistencia a ralentizaciones","Vida escalable"]}
];
const SPELLS={
  Flash:"Destello",Ignite:"Prender",Teleport:"Teleportación",Smite:"Aplastar",Heal:"Curar",
  Barrier:"Barrera",Exhaust:"Extenuación",Ghost:"Fantasmal",Cleanse:"Limpiar"
};
const treeOf=r=>TREE_ORDER.find(t=>TREES[t].keys.includes(r)||TREES[t].rows.some(row=>row.includes(r)));
const rowOf=(t,r)=>TREES[t].rows.findIndex(row=>row.includes(r));

/* ---------- Arquetipo de cada campeón en su línea ---------- */
const ROLE_OF_IDX=["T","J","M","B","S"];
function archetype(c,i){
  const L=ROLE_OF_IDX[i], f=x=>c.flags.includes(x);
  if(L==="S"&&(f("H")||(f("P")&&c.tank<2))) return "enchanter";
  if(c.tank>=3||(c.tank>=2&&f("E")&&!f("S"))) return "tank";
  if(f("A")) return c.dmg==="AP"?"assassinAP":"assassinAD";
  if((c.dmg==="AD"||c.dmg==="M")&&(f("D")||f("Y"))&&c.tank===0) return "marksman";
  if(c.dmg==="AP"&&(f("Y")||f("D"))) return "battlemage";
  if(f("S")||((c.dmg==="AD"||c.dmg==="M")&&c.tank>=1)) return "bruiser";
  if(c.dmg==="AP") return f("K")?"poke":"mage";
  if(L==="S") return f("E")?"tank":"enchanter";
  return "bruiser";
}
const ARCH_NAME={enchanter:"encantador",tank:"tanque",assassinAP:"asesino AP",assassinAD:"asesino AD",marksman:"tirador",
  battlemage:"mago de pelea",bruiser:"luchador",poke:"mago de poke",mage:"mago"};
// Qué tan bien le queda cada piedra angular a cada arquetipo (1 = la mejor, 0 = no tiene sentido)
const KEY_FIT={
  marksman:{"Lethal Tempo":1,"Press the Attack":.95,"Fleet Footwork":.8,"Hail of Blades":.6,"First Strike":.6,"Conqueror":.6,"Arcane Comet":.25,"Electrocute":.3},
  assassinAD:{"Electrocute":1,"Hail of Blades":.9,"Dark Harvest":.85,"First Strike":.6,"Conqueror":.55,"Press the Attack":.4},
  assassinAP:{"Electrocute":1,"Dark Harvest":.9,"Arcane Comet":.6,"First Strike":.55,"Hail of Blades":.5,"Stormraider's Surge":.5},
  bruiser:{"Conqueror":1,"Grasp of the Undying":.8,"Lethal Tempo":.6,"Fleet Footwork":.55,"Press the Attack":.55,"Hail of Blades":.45,"First Strike":.4,"Aftershock":.45},
  tank:{"Aftershock":1,"Grasp of the Undying":.9,"Glacial Augment":.7,"Guardian":.6,"Hail of Blades":.45,"Conqueror":.45},
  enchanter:{"Summon Aery":1,"Guardian":.9,"Glacial Augment":.55,"Arcane Comet":.6,"First Strike":.4},
  battlemage:{"Conqueror":1,"Stormraider's Surge":.85,"Fleet Footwork":.6,"Arcane Comet":.6,"Electrocute":.55,"Grasp of the Undying":.55,"Dark Harvest":.5},
  poke:{"Arcane Comet":1,"First Strike":.85,"Deathfire Touch":.85,"Summon Aery":.7,"Electrocute":.5,"Dark Harvest":.45},
  mage:{"Electrocute":1,"Arcane Comet":.9,"Deathfire Touch":.8,"Dark Harvest":.65,"First Strike":.6,"Summon Aery":.55,"Stormraider's Surge":.45,"Glacial Augment":.35}
};
// Piedras conocidas por campeón (las que se ven en la mayoría de partidas de alto elo)
const KEY_OVERRIDE={"Karthus":"Dark Harvest","Vladimir":"Stormraider's Surge","Brand":"Deathfire Touch","Zyra":"Deathfire Touch",
  "Yasuo":"Lethal Tempo","Yone":"Lethal Tempo","Kayle":"Lethal Tempo","Ezreal":"Conqueror","Aatrox":"Conqueror","Darius":"Conqueror",
  "Sett":"Conqueror","Garen":"Conqueror","Leona":"Aftershock","Nautilus":"Aftershock","Alistar":"Aftershock","Rell":"Aftershock",
  "Lulu":"Summon Aery","Janna":"Summon Aery","Soraka":"Summon Aery","Nami":"Summon Aery","Sona":"Summon Aery","Lux":"Arcane Comet",
  "Xerath":"Arcane Comet","Vel'Koz":"Arcane Comet","Zed":"Electrocute","Locke":"Electrocute","Nasus":"Grasp of the Undying"};
const SEC_FIT={marksman:["I","D","R"],assassinAD:["P","D","I"],assassinAP:["S","I","P"],bruiser:["R","P","I"],tank:["I","R","P"],
  enchanter:["R","I","S"],battlemage:["R","P","S"],poke:["I","S","D"],mage:["I","S","P"]};
const MINOR_FIT={
  marksman:["Presence of Mind","Absorb Life","Legend: Bloodline","Legend: Alacrity","Cut Down","Coup de Grace","Magical Footwear","Cosmic Insight","Taste of Blood","Treasure Hunter","Triumph"],
  assassinAD:["Sudden Impact","Taste of Blood","Grisly Mementos","Ultimate Hunter","Treasure Hunter","Relentless Hunter","Triumph","Legend: Haste","Coup de Grace","Cheap Shot"],
  assassinAP:["Sudden Impact","Taste of Blood","Ultimate Hunter","Treasure Hunter","Manaflow Band","Transcendence","Gathering Storm","Scorch","Absolute Focus"],
  bruiser:["Triumph","Legend: Haste","Legend: Alacrity","Last Stand","Second Wind","Bone Plating","Unflinching","Overgrowth","Conditioning","Demolish"],
  tank:["Demolish","Font of Life","Shield Bash","Second Wind","Bone Plating","Conditioning","Overgrowth","Unflinching","Revitalize","Magical Footwear","Cosmic Insight","Approach Velocity","Biscuit Delivery"],
  enchanter:["Manaflow Band","Transcendence","Scorch","Gathering Storm","Font of Life","Bone Plating","Revitalize","Shield Bash","Cosmic Insight","Biscuit Delivery"],
  battlemage:["Triumph","Legend: Haste","Last Stand","Second Wind","Bone Plating","Overgrowth","Unflinching","Manaflow Band","Transcendence","Gathering Storm"],
  poke:["Manaflow Band","Transcendence","Scorch","Gathering Storm","Cash Back","Biscuit Delivery","Cosmic Insight","Magical Footwear","Absolute Focus"],
  mage:["Manaflow Band","Transcendence","Gathering Storm","Scorch","Taste of Blood","Sudden Impact","Ultimate Hunter","Cosmic Insight","Magical Footwear","Biscuit Delivery"]
};
const SHARD_FIT={
  marksman:[1,0,1],assassinAD:[0,0,0],assassinAP:[0,0,0],bruiser:[1,0,1],tank:[2,2,0],
  enchanter:[2,0,0],battlemage:[2,0,1],poke:[2,0,0],mage:[0,0,0]
};
// Valor de cada hechizo según la línea (Destello va siempre aparte)
const SPELL_FIT={
  T:{Teleport:1,Ignite:.85,Ghost:.7,Exhaust:.4,Barrier:.3,Cleanse:.3,Heal:.2},
  J:{Smite:1},
  M:{Teleport:.9,Ignite:.95,Barrier:.6,Ghost:.55,Cleanse:.55,Exhaust:.5,Heal:.3},
  B:{Heal:1,Barrier:.8,Cleanse:.75,Ghost:.6,Exhaust:.55,Ignite:.5,Teleport:.3},
  S:{Ignite:.95,Exhaust:.95,Heal:.6,Barrier:.4,Ghost:.4,Teleport:.3}
};

/* ---------- Página recomendada (la que arma la IA) ---------- */
function recommended(c,i){
  const a=archetype(c,i), L=ROLE_OF_IDX[i];
  const kf=KEY_FIT[a];
  let key=KEY_OVERRIDE[c.name]||Object.keys(kf).sort((x,y)=>kf[y]-kf[x])[0];
  const prim=treeOf(key);
  const pick=(t,row)=>TREES[t].rows[row].find(r=>MINOR_FIT[a].includes(r))||TREES[t].rows[row][0];
  const minors=[0,1,2].map(row=>pick(prim,row));
  const sec=SEC_FIT[a].find(t=>t!==prim)||TREE_ORDER.find(t=>t!==prim);
  const secRows=[0,1,2].map(row=>({row,r:TREES[sec].rows[row].find(r=>MINOR_FIT[a].includes(r))})).filter(x=>x.r);
  while(secRows.length<2){ const row=[0,1,2].find(k=>!secRows.some(x=>x.row===k)); secRows.push({row,r:TREES[sec].rows[row][0]}); }
  const sf=SPELL_FIT[L], second=L==="J"?"Smite":Object.keys(sf).sort((x,y)=>(sf[y]+(spellBias(c,a,y)))-(sf[x]+spellBias(c,a,x)))[0];
  return {key,prim,minors,sec,secRunes:secRows.slice(0,2).map(x=>x.r),shards:SHARD_FIT[a].slice(),spells:["Flash",second]};
}
// Ajustes finos del hechizo según el tipo de campeón
function spellBias(c,a,sp){
  if(sp==="Ignite"&&(a==="assassinAD"||a==="assassinAP"||c.e>=3)) return .15;
  if(sp==="Teleport"&&(c.l>=3||a==="tank")) return .15;
  if(sp==="Exhaust"&&a==="enchanter") return .1;
  if(sp==="Ignite"&&a==="enchanter") return -.3;
  return 0;
}
const cloneBuild=b=>JSON.parse(JSON.stringify(b));
const defaultBuilds=team=>team.map((c,i)=>({champ:c.name,...recommended(c,i)}));
// Si cambió el campeón de un puesto, su página vuelve a la recomendada
function syncBuilds(team,builds){
  return team.map((c,i)=>builds&&builds[i]&&builds[i].champ===c.name?builds[i]:{champ:c.name,...recommended(c,i)});
}

/* ---------- Evaluación de una página ---------- */
// ctx: necesidades de la composición propia y amenazas del rival (si se conoce)
function buildContext(team,enemy){
  const sumT=(t,k)=>t.reduce((a,c)=>a+c[k],0), cnt=(t,f)=>t.filter(c=>c.flags.includes(f)).length;
  const ctx={noFront:sumT(team,"tank")<4,noEngage:!cnt(team,"E")};
  if(enemy){ ctx.enemyA=cnt(enemy,"A"); ctx.enemyCC=sumT(enemy,"cc"); ctx.enemyTank=sumT(enemy,"tank"); ctx.enemyPoke=cnt(enemy,"K"); }
  return ctx;
}
function rateBuild(c,i,b,ctx){
  const a=archetype(c,i), L=ROLE_OF_IDX[i], notes=[];
  let v=0;
  // Piedra angular (lo que más pesa)
  const kf=(KEY_OVERRIDE[c.name]===b.key?1:KEY_FIT[a][b.key])??0;
  v+=kf*3;
  if(kf<.3) notes.push({bad:true,t:`${b.key} no le sirve a un ${ARCH_NAME[a]} como ${c.name}.`});
  // Runas menores
  const minorsOk=b.minors.filter(r=>MINOR_FIT[a].includes(r)).length+b.secRunes.filter(r=>MINOR_FIT[a].includes(r)).length;
  v+=minorsOk*.12;
  // Árbol secundario
  const si=SEC_FIT[a].indexOf(b.sec); v+=si===0?.5:si>0?.35:0;
  // Fragmentos
  v+=b.shards.reduce((x,s,k)=>x+(s===SHARD_FIT[a][k]?.1:0),0);
  // Hechizos
  const sp=b.spells;
  if(L==="J"&&!sp.includes("Smite")){ v-=3; notes.push({bad:true,t:`${c.name} en jungla sin Aplastar: no puede limpiar campamentos ni pelear objetivos.`}); }
  if(L!=="J"&&sp.includes("Smite")){ v-=1.2; notes.push({bad:true,t:`Aplastar fuera de la jungla no aporta nada a ${c.name}.`}); }
  if(!sp.includes("Flash")){ v-=sp.includes("Ghost")&&(a==="bruiser"||a==="tank")?.3:.8; if(!sp.includes("Ghost")) notes.push({bad:true,t:`${c.name} sin Destello queda muy expuesto.`}); }
  const other=sp.find(x=>x!=="Flash"&&!(L==="J"&&x==="Smite"));
  if(other) v+=(SPELL_FIT[L][other]??0)*.8+spellBias(c,a,other)*.8;
  // Contexto: lo que pide la composición y el rival
  if(ctx){
    const p=b.prim, s=b.sec, key=b.key;
    if(ctx.noFront&&a!=="tank"&&(p==="R"||s==="R")){ v+=.25; notes.push({t:`Valor en ${c.name} compensa la falta de frontline.`}); }
    if(ctx.noEngage&&(L==="S"||L==="J")&&["Aftershock","Glacial Augment","Hail of Blades"].includes(key)){ v+=.3; notes.push({t:`${key} le da a ${c.name} la entrada que le falta al equipo.`}); }
    if(ctx.enemyA>=2&&(sp.includes("Exhaust")||sp.includes("Barrier"))&&(L==="S"||a==="marksman"||a==="mage")){ v+=.35; notes.push({t:`${sp.includes("Exhaust")?"Extenuación":"Barrera"} en ${c.name} contra ${ctx.enemyA} asesinos rivales.`}); }
    if(ctx.enemyCC>=12&&(sp.includes("Cleanse")||b.shards[2]===1)&&(a==="marksman"||a==="battlemage"||a==="bruiser")){ v+=.3; notes.push({t:`${c.name} se protege del control rival (${sp.includes("Cleanse")?"Limpiar":"tenacidad"}).`}); }
    if(ctx.enemyTank>=8&&(key==="Conqueror"||b.minors.includes("Cut Down")||b.secRunes.includes("Cut Down"))&&a!=="tank"){ v+=.3; notes.push({t:`${c.name} arma para derretir la frontline rival.`}); }
    if(ctx.enemyPoke>=2&&(b.minors.includes("Second Wind")||b.secRunes.includes("Second Wind")||key==="Fleet Footwork")){ v+=.2; notes.push({t:`${c.name} aguanta el poke rival.`}); }
  }
  return {v,notes,arch:a};
}
// Puntos que suma o resta la build del equipo frente a las páginas recomendadas
function buildMod(team,builds,enemy){
  if(!builds) return {mod:0,per:[],notes:[]};
  const ctx=buildContext(team,enemy), per=[], notes=[];
  team.forEach((c,i)=>{
    const b=builds[i]&&builds[i].champ===c.name?builds[i]:{champ:c.name,...recommended(c,i)};
    const user=rateBuild(c,i,b,ctx), base=rateBuild(c,i,{champ:c.name,...recommended(c,i)},null);
    const d=user.v-base.v; per.push(d); notes.push(...user.notes);
  });
  const mod=clamp(per.reduce((a,x)=>a+x,0)*1.5,-12,6);
  return {mod:Math.round(mod*10)/10,per,notes};
}
const fitLabel=d=>d>=.3?["Mejor que la recomendada","up"]:d>=-.15?["Recomendada","ok"]:d>=-1?["Mejorable","warn"]:["Mala","down"];

/* ---------- Editor de runas (estilo cliente) ---------- */
let RE=null; // {team,builds,i,readonly,onSave,draft,enemy}
function openRunes(opts){
  RE={...opts,draft:cloneBuild(opts.builds[opts.i])};
  renderRunes();
  document.getElementById("runeModal").hidden=false;
  document.body.classList.add("modal-open");
}
function closeRunes(save){
  if(save&&RE&&!RE.readonly){ RE.builds[RE.i]=RE.draft; RE.onSave&&RE.onSave(); }
  document.getElementById("runeModal").hidden=true;
  document.body.classList.remove("modal-open");
  RE=null;
}
function reSet(kind,val,extra){
  if(!RE||RE.readonly) return;
  const b=RE.draft;
  if(kind==="prim"){ if(val===b.prim) return; b.prim=val; b.key=TREES[val].keys[0]; b.minors=TREES[val].rows.map(r=>r[0]);
    if(b.sec===val){ b.sec=TREE_ORDER.find(t=>t!==val); b.secRunes=[TREES[b.sec].rows[0][0],TREES[b.sec].rows[1][0]]; } }
  if(kind==="key") b.key=val;
  if(kind==="minor") b.minors[extra]=val;
  if(kind==="sec"){ if(val===b.prim||val===b.sec) return; b.sec=val; b.secRunes=[TREES[val].rows[0][0],TREES[val].rows[1][0]]; }
  if(kind==="secRune"){
    // Como en el cliente: una por fila; si ya hay dos filas elegidas, se reemplaza la más vieja
    const row=rowOf(b.sec,val), same=b.secRunes.findIndex(r=>rowOf(b.sec,r)===row);
    if(same>=0) b.secRunes[same]=val; else { b.secRunes.shift(); b.secRunes.push(val); }
  }
  if(kind==="shard") b.shards[extra]=val;
  if(kind==="spell"){
    const k=extra, o=1-k;
    if(b.spells[o]===val) b.spells[o]=b.spells[k];
    b.spells[k]=val;
  }
  if(kind==="reset") RE.draft={champ:b.champ,...recommended(RE.team[RE.i],RE.i)};
  renderRunes();
}
function renderRunes(){
  const m=document.getElementById("runeModal"), b=RE.draft, c=RE.team[RE.i], i=RE.i, ro=RE.readonly;
  const ctx=buildContext(RE.team,RE.enemy);
  const rate=rateBuild(c,i,b,ctx), base=rateBuild(c,i,{champ:c.name,...recommended(c,i)},null), d=rate.v-base.v, [lbl,cls]=fitLabel(d);
  const btn=(sel,label,on,title,extra="")=>`<button class="rn ${sel?"sel":""} ${extra}" ${ro?"disabled":""} title="${(title||"").replace(/"/g,"&quot;")}" onclick="${on}">${label}</button>`;
  const q=s=>s.replace(/'/g,"\\'");
  const treeTabs=(cur,kind,skip)=>TREE_ORDER.map(t=>t===skip?"":`<button class="tree ${cur===t?"sel":""}" style="--tc:${TREES[t].color}" ${ro?"disabled":""} onclick="reSet('${kind}','${t}')" title="${TREES[t].name}"><i></i><span>${TREES[t].name}</span></button>`).join("");
  m.innerHTML=`<div class="rune-card" role="dialog" aria-label="Runas de ${c.name}">
    <div class="rune-head">${faceHTML(c)}<div><b>${c.name}</b><small>${LANE_NAME[LANE_CODE[i]]} · ${ARCH_NAME[rate.arch]}</small></div>
      <span class="fit ${cls}">${lbl} <b>${d>=0?"+":""}${(d*1.5).toFixed(1)}</b></span>
      <button class="rn-x" onclick="closeRunes(false)" aria-label="Cerrar">✕</button></div>
    ${ro?`<p class="rune-lock">${RE.lockMsg||"Las runas están bloqueadas."}</p>`:""}
    <div class="rune-spells"><span>Hechizos</span>${[0,1].map(k=>`<select ${ro?"disabled":""} onchange="reSet('spell',this.value,${k})">${Object.entries(SPELLS).map(([id,n])=>`<option value="${id}" ${b.spells[k]===id?"selected":""}>${n}</option>`).join("")}</select>`).join("")}</div>
    <div class="rune-cols">
      <section style="--tc:${TREES[b.prim].color}">
        <div class="trees">${treeTabs(b.prim,"prim")}</div>
        <div class="keys">${TREES[b.prim].keys.map(k=>btn(b.key===k,k,`reSet('key','${q(k)}')`,RUNE_DESC[k],"key")).join("")}</div>
        ${TREES[b.prim].rows.map((row,ri)=>`<div class="rrow">${row.map(r=>btn(b.minors[ri]===r,r,`reSet('minor','${q(r)}',${ri})`,RUNE_DESC[r])).join("")}</div>`).join("")}
        <p class="rdesc"><b>${b.key}:</b> ${RUNE_DESC[b.key]}</p>
      </section>
      <section style="--tc:${TREES[b.sec].color}">
        <div class="trees">${treeTabs(b.sec,"sec",b.prim)}</div>
        <p class="rhint">Elegí 2 runas de filas distintas.</p>
        ${TREES[b.sec].rows.map(row=>`<div class="rrow">${row.map(r=>btn(b.secRunes.includes(r),r,`reSet('secRune','${q(r)}')`,RUNE_DESC[r])).join("")}</div>`).join("")}
        <div class="shards">${SHARDS.map((row,k)=>`<div class="rrow small"><em>${row.name}</em>${row.opts.map((o,j)=>btn(b.shards[k]===j,o,`reSet('shard',${j},${k})`,o)).join("")}</div>`).join("")}</div>
      </section>
    </div>
    ${rate.notes.length?`<ul class="rune-notes">${rate.notes.map(n=>`<li class="${n.bad?"bad":"good"}">${n.t}</li>`).join("")}</ul>`:""}
    <div class="rune-foot">
      ${ro?`<button class="btn-big primary" onclick="closeRunes(false)">Cerrar</button>`
        :`<button class="btn-big" onclick="reSet('reset')">Usar la recomendada</button>
          <button class="btn-big" onclick="closeRunes(false)">Cancelar</button>
          <button class="btn-big primary" onclick="closeRunes(true)">Guardar runas</button>`}
    </div></div>`;
}
// Resumen compacto de una página (para tarjetas y filas)
function buildChip(c,i,b,ctx){
  const r=rateBuild(c,i,b,ctx), base=rateBuild(c,i,{champ:c.name,...recommended(c,i)},null), [lbl,cls]=fitLabel(r.v-base.v);
  return `<span class="bchip" style="--tc:${TREES[b.prim].color};--tc2:${TREES[b.sec].color}"><i></i><b>${b.key}</b><small>${TREES[b.sec].name} · ${b.spells.map(s=>SPELLS[s]).join(" + ")}</small><em class="fit ${cls}">${lbl}</em></span>`;
}
