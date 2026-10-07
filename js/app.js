/* =========================================================
   DATA
   nombre | daño(AD/AP/M=mixto/U=utilidad) | tanque 0-3 | cc 0-3 |
   early | mid | late (1-3) | flags | WR referencia (aprox.)
   Flags: E iniciador · F teamfight AoE · P protección · K poke
          U knock-up · S split/duelo · Y hipercarry · A asesino/pick
          H encantador · G presencia global · D DPS sostenido
   ========================================================= */
/* RAW está en js/data.js */

const CHAMPS = RAW.split("\n").map(l=>{
  const [name,dmg,tank,cc,e,m,lt,flags,wr]=l.split("|");
  return {name,dmg,tank:+tank,cc:+cc,e:+e,m:+m,l:+lt,flags,wr:+wr};
});
// Aplica los cambios de los últimos parches al WR de referencia y guarda la historia de cada campeón
const PATCH_LOG={};
PATCHES.forEach(p=>[["buff",.4],["nerf",-.4],["adj",0]].forEach(([k,d])=>p[k].forEach(n=>{
  const c=CHAMPS.find(x=>x.name===n); if(!c) return;
  c.wr=Math.round((c.wr+d)*10)/10; (PATCH_LOG[n]=PATCH_LOG[n]||[]).push({v:p.v,k});
})));

const FLAG_LABEL={E:"Iniciador",F:"Teamfight AoE",P:"Protección",K:"Poke",U:"Knock-up",S:"Split/duelo",
  Y:"Hipercarry",A:"Asesino/pick",H:"Encantador",G:"Global",D:"DPS sostenido"};
const DMG_LABEL={AD:"AD",AP:"AP",M:"Mixto",U:"Utilidad"};
const DMG_COLOR={AD:"var(--ad)",AP:"var(--ap)",M:"var(--mix)",U:"var(--util)"};

const ROLES=[
  {id:"top",name:"Top",x:62,y:70},
  {id:"jg",name:"Jungla",x:128,y:240},
  {id:"mid",name:"Mid",x:200,y:200},
  {id:"adc",name:"ADC",x:330,y:338},
  {id:"sup",name:"Soporte",x:290,y:362},
];
const MAX_REROLLS=4;

/* ---------- Data Dragon: íconos de cara de cada campeón ---------- */
/* ---------- Imágenes de campeones ----------
   Algunas redes bloquean o tardan con el CDN de Riot (Data Dragon). Por eso:
   la versión se pide con timeout, cada imagen prueba Data Dragon y si falla pasa a
   CommunityDragon, y si también falla queda la inicial del campeón. */
const DD={base:null,ids:{},blocked:false,failures:0};
const FALLBACK_VER="16.20.1";
const ID_OVERRIDE={"Wukong":"MonkeyKing","Nunu & Willump":"Nunu","Renata Glasc":"Renata","Bel'Veth":"Belveth",
  "Kai'Sa":"Kaisa","Cho'Gath":"Chogath","Kha'Zix":"Khazix","Vel'Koz":"Velkoz","LeBlanc":"Leblanc"};
const normId=n=>n.replace(/[^A-Za-z]/g,"");
const champId=c=>DD.ids[c.name]||ID_OVERRIDE[c.name]||normId(c.name);
function fetchJSON(url,ms){
  const ctl=typeof AbortController!=="undefined"?new AbortController():null;
  const t=setTimeout(()=>ctl&&ctl.abort(),ms);
  return fetch(url,ctl?{signal:ctl.signal}:{}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }).finally(()=>clearTimeout(t));
}
async function initDD(){
  let ver=FALLBACK_VER;
  try{
    ver=(await fetchJSON("https://ddragon.leagueoflegends.com/api/versions.json",3500))[0]||FALLBACK_VER;
    const data=await fetchJSON(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/champion.json`,4000);
    Object.values(data.data).forEach(c=>{ DD.ids[c.name]=c.id; });
  }catch(e){ /* sin versión: se usa la de respaldo y, si las imágenes fallan, CommunityDragon */ }
  DD.base=`https://ddragon.leagueoflegends.com/cdn/${ver}/img/champion/`;
}
// Fuente de imagen según el intento: 0 Data Dragon, 1 CommunityDragon
function faceSrc(c,step){
  if(step===0&&DD.base&&!DD.blocked) return DD.base+champId(c)+".png";
  if(step<=1) return `https://cdn.communitydragon.org/latest/champion/${champId(c)}/square`;
  return "";
}
const faceUrl=c=>faceSrc(c,0)||faceSrc(c,1);
// onerror de <img> y de <image> SVG: si falló Data Dragon prueba CommunityDragon; si falla todo, se oculta y queda la inicial.
// Después de 3 fallos de Data Dragon se deja de usar (red que lo bloquea).
function imgFail(el){
  const src=el.getAttribute("src")||el.getAttribute("href")||"", c=CHAMPS.find(x=>x.name===el.dataset.champ);
  if(c&&src.includes("ddragon")){
    if(++DD.failures>=3) DD.blocked=true;
    const next=faceSrc(c,1);
    if(el.tagName.toLowerCase()==="image") el.setAttribute("href",next); else el.src=next;
    return;
  }
  el.style.display="none";
}
const imgAttrs=c=>`data-champ="${c.name.replace(/"/g,"&quot;")}" onerror="imgFail(this)"`;

/* ---------- State ---------- */
let state, spinning=false;
const reduceMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

function newGame(){
  state={slots:ROLES.map(()=>({champ:null,locked:false})),banned:[],rerolls:MAX_REROLLS};
  document.getElementById("results").className="frame";
  const tSim=document.getElementById("tabSim"); tSim.disabled=true; tSim.title="Fijá las cinco líneas para habilitarla";
  ROLES.forEach((_,i)=>roll(i));
  render(true);
  spin(ROLES.map((_,i)=>i));
}
function pool(exceptIdx,avoid=new Set()){
  const taken=new Set([...state.banned,...avoid]);
  state.slots.forEach((s,i)=>{ if(s.champ && i!==exceptIdx) taken.add(s.champ.name); });
  return CHAMPS.filter(c=>!taken.has(c.name));
}
function roll(i,avoid){
  const p=pool(i,avoid);
  state.slots[i].champ=p[Math.floor(Math.random()*p.length)];
}

// Reservado para el modo competencia: vetar saca al campeón del pool para el resto de la partida.
function banChampion(name){ if(!state.banned.includes(name)) state.banned.push(name); }

/* ---------- Actions ---------- */
const allLocked=()=>state.slots.every(s=>s.locked);

function rerollAll(){
  if(spinning||state.rerolls<=0||allLocked()) return;
  const idx=state.slots.map((s,i)=>s.locked?-1:i).filter(i=>i>=0);
  const prev=new Set(idx.map(i=>state.slots[i].champ.name));
  state.rerolls--;
  idx.forEach(i=>state.slots[i].champ=null);
  idx.forEach(i=>roll(i,prev));
  render(true);
  spin(idx);
}
function act(i){
  const s=state.slots[i];
  if(spinning||s.locked) return;
  s.locked=true;
  render();
  if(allLocked()) evaluate();
}

/* ---------- Spin animation ---------- */
function setFace(i,c){
  const p=document.getElementById(`p-${i}`);
  if(!p) return;
  p.querySelector(".mono").textContent=initials(c.name);
  const img=p.querySelector("img");
  if(img){ img.style.display=""; img.dataset.champ=c.name; img.src=faceUrl(c); }
  document.getElementById(`n-${i}`).textContent=c.name;
}
function land(i){
  const el=document.getElementById(`slot-${i}`);
  el.outerHTML=slotHTML(i,true);
}
function spin(idx){
  if(!idx.length) return;
  if(reduceMotion()){ idx.forEach(i=>land(i)); drawMap(); updateControls(); return; }
  spinning=true; updateControls();
  let done=0;
  idx.forEach((i,k)=>{
    document.getElementById(`slot-${i}`).classList.add("rolling");
    document.getElementById(`p-${i}`).classList.add("spinning");
    const stopAt=950+k*280;          // cada línea frena un poco después que la anterior
    let elapsed=0, delay=50;
    const tick=()=>{
      if(elapsed>=stopAt){
        land(i);
        if(++done===idx.length){ spinning=false; drawMap(); updateControls(); }
        return;
      }
      setFace(i,CHAMPS[Math.floor(Math.random()*CHAMPS.length)]);
      elapsed+=delay;
      delay=Math.min(delay*1.13,230);  // desacelera como una tragamonedas
      setTimeout(tick,delay);
    };
    tick();
  });
}

/* ---------- Render ---------- */
const initials=n=>n.replace(/[^A-Za-z &]/g,"").split(/[ &]+/).filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase()
  || n.slice(0,2).toUpperCase();

function slotHTML(i,landed=false){
  const s=state.slots[i], c=s.champ, r=ROLES[i];
  const curve=["Early","Mid","Late"].map((ph,k)=>{
    const v=[c.e,c.m,c.l][k];
    return `<div>${ph}${[1,2,3].map(n=>`<i class="${n<=v?"on":""}"></i>`).join("")}</div>`;
  }).join("");
  return `<article class="frame slot ${s.locked?"locked":""}" id="slot-${i}">
    <div class="slot-role"><b>${r.name}</b><span class="status">${s.locked?"Fijado":"En duda"}</span></div>
    <div class="portrait ${landed?"landed":""}" id="p-${i}">
      <span class="mono">${initials(c.name)}</span>
      <img src="${faceUrl(c)}" alt="${c.name}" ${imgAttrs(c)}>
      <span class="dmg" style="background:${DMG_COLOR[c.dmg]}">${DMG_LABEL[c.dmg]}</span>
    </div>
    <div class="champ-name" id="n-${i}">${c.name}</div>
    <div class="meta"><span>WR ref. <b>${c.wr.toFixed(1)}%</b></span><span>CC <b>${"◆".repeat(c.cc)||"–"}</b></span></div>
    <div class="affline">${affChip(c,i)}<span>Juega: ${lanesOf(c)}</span></div>
    <div class="curve">${curve}</div>
    <div class="tags">${[...c.flags].map(f=>`<span class="tag">${FLAG_LABEL[f]}</span>`).join("")}</div>
    <div class="actions"><button class="btn pick" onclick="act(${i})">Fijar</button></div>
  </article>`;
}

function updateControls(){
  document.getElementById("gems").innerHTML=Array.from({length:MAX_REROLLS},(_,k)=>
    `<div class="gem ${k>=state.rerolls?"used":""}" title="Reroll ${k+1}"></div>`).join("");
  const btn=document.getElementById("rerollBtn");
  btn.disabled=spinning||state.rerolls<=0||allLocked();
  btn.textContent=spinning?"Rolleando…":state.rerolls>0?`Rerollear (${state.rerolls})`:"Sin rerolls";
  document.getElementById("restart").disabled=spinning;
  document.querySelectorAll(".btn.pick").forEach(b=>b.disabled=spinning);
}

function render(skipMap){
  document.getElementById("slots").innerHTML=state.slots.map((_,i)=>slotHTML(i)).join("");
  if(!skipMap) drawMap();
  updateControls();
}

function drawMap(){
  const pins=ROLES.map((r,i)=>{
    const s=state.slots[i];
    const col=s.locked?"#c8aa6e":"#3b5874";
    const face=s.locked
      ? `<clipPath id="cp${i}"><circle cx="${r.x}" cy="${r.y}" r="14"/></clipPath>
         <image href="${faceUrl(s.champ)}" ${imgAttrs(s.champ)} x="${r.x-16}" y="${r.y-16}" width="32" height="32" clip-path="url(#cp${i})" preserveAspectRatio="xMidYMid slice"/>`
      : `<text x="${r.x}" y="${r.y+4}" text-anchor="middle" style="font:700 12px Cinzel,serif;fill:#8b98a8">?</text>`;
    return `<g>
      <circle cx="${r.x}" cy="${r.y}" r="15" fill="#08121f"/>
      ${face}
      <circle cx="${r.x}" cy="${r.y}" r="15" fill="none" stroke="${col}" stroke-width="2.5"/>
      <text class="pin-label" x="${r.x}" y="${r.y+30}" text-anchor="middle">${s.locked?s.champ.name:r.name}</text>
    </g>`;
  }).join("");
  document.getElementById("map").innerHTML=`
    <defs>
      <linearGradient id="grass" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#10291f"/><stop offset="1" stop-color="#1a1f2e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grass)"/>
    <path d="M0 40 L40 0 L400 360 L360 400 Z" fill="#123a4f" opacity=".75"/>
    <g stroke="#6b5a3a" stroke-width="16" fill="none" stroke-linecap="round" opacity=".85">
      <path d="M40 360 L40 40 L360 40"/>
      <path d="M40 360 L360 360 L360 40"/>
      <path d="M50 350 L350 50"/>
    </g>
    <circle cx="26" cy="374" r="34" fill="#0d3a5c" stroke="#0ac8b9" stroke-width="2"/>
    <circle cx="374" cy="26" r="34" fill="#4a1622" stroke="#e84057" stroke-width="2"/>
    <circle cx="120" cy="120" r="7" fill="#7b5cc7"/><circle cx="280" cy="280" r="7" fill="#d9813b"/>
    ${pins}`;
}


/* =========================================================
   AFINIDAD DE LÍNEA
   T top · J jungla · M mid · B ADC · S soporte
   La primera letra es la línea principal; las demás, secundarias.
   ========================================================= */
/* ROLE_RAW está en js/data.js */

const LANE_CODE=["T","J","M","B","S"];
const LANE_NAME={T:"Top",J:"Jungla",M:"Mid",B:"ADC",S:"Soporte"};
const ROLE_MAP={};
ROLE_RAW.split("\n").forEach(l=>{ const k=l.lastIndexOf(":"); ROLE_MAP[l.slice(0,k)]=l.slice(k+1); });

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const has=(c,f)=>c.flags.includes(f);
const count=(team,f)=>team.filter(c=>has(c,f)).length;
const isCarry=c=>has(c,"D")||has(c,"Y");
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const lanesOf=c=>[...(ROLE_MAP[c.name]||"")].map(l=>LANE_NAME[l]).join(", ")||"Sin datos";

/* Afinidad aprendida: se guarda en el navegador y se actualiza al terminar cada simulación */
const AFF_KEY="riftroll-afinidad-v1";
let AFF_LOG={};
try{ AFF_LOG=JSON.parse(localStorage.getItem(AFF_KEY)||"{}"); }catch(e){ AFF_LOG={}; }
function saveAff(){ try{ localStorage.setItem(AFF_KEY,JSON.stringify(AFF_LOG)); }catch(e){} }

function baseAff(c,ri){ const r=ROLE_MAP[c.name]||""; const k=r.indexOf(LANE_CODE[ri]); return k===0?1:k>0?.6:0; }
function learnedAff(c,ri){
  const rec=AFF_LOG[c.name+"@"+LANE_CODE[ri]]; if(!rec) return 0;
  const g=rec.w+rec.l; if(!g) return 0;
  return (rec.w/g-.5)*.4*Math.min(g,10)/10;   // hasta ±0,2 con 10 partidas
}
function affinity(c,ri,mine=true){ return clamp(baseAff(c,ri)+(mine?learnedAff(c,ri):0),0,1.2); }
function affChip(c,ri,mine=true){
  const v=affinity(c,ri,mine);
  const [cls,txt]=v>=.95?["on","En su línea"]:v>=.5?["sec","Línea secundaria"]:["off","Fuera de línea"];
  return `<span class="chip ${cls}">${txt} ${Math.round(v*100)}%</span>`;
}

/* =========================================================
   EVALUACIÓN
   ========================================================= */
const PAIRS=[
  ["Xayah","Rakan",5,"Xayah y Rakan comparten recall y se potencian entre sí: es la dupla más armada del juego."],
  ["Yasuo","Malphite",4,"El ulti de Malphite le sirve en bandeja el Last Breath a Yasuo."],
  ["Yone","Malphite",4,"El ulti de Malphite deja a todos en el aire para el combo de Yone."],
  ["Lucian","Nami",4,"Los buffs de Nami encajan perfecto con el doble disparo de Lucian."],
  ["Kog'Maw","Lulu",4,"Lulu convierte a Kog'Maw en una torreta imposible de alcanzar."],
  ["Jinx","Lulu",3,"Jinx con Lulu al lado aguanta las zambullidas y se resetea."],
  ["Twitch","Lulu",3,"Lulu acelera las entradas en invisibilidad de Twitch."],
  ["Vayne","Lulu",3,"Lulu le da a Vayne el tiempo que necesita para tumbar frontlines."],
  ["Miss Fortune","Amumu",4,"El ulti de Amumu deja quietos a todos para que la lluvia de balas pegue completa."],
  ["Miss Fortune","Leona",3,"Leona traba y Miss Fortune castiga con el ulti."],
  ["Orianna","Malphite",4,"Bola en Malphite más entrada: wombo clásico."],
  ["Orianna","Jarvan IV",4,"Jarvan encierra y Orianna activa la onda de choque adentro."],
  ["Orianna","Wukong",3,"Wukong entra girando y la bola de Orianna va con él."],
  ["Kalista","Thresh",3,"Kalista lanza a Thresh con el ulti para una entrada imposible de esquivar."],
  ["Senna","Tahm Kench",3,"Tahm Kench protege a Senna, que puede jugar adelantada sin miedo."],
  ["Kai'Sa","Nautilus",3,"El cc de Nautilus llena las marcas de plasma de Kai'Sa al instante."],
  ["Samira","Nautilus",3,"Nautilus pega cc tras cc y Samira sube su estilo sin parar."],
  ["Samira","Rell",3,"Rell junta a todos y Samira entra con el ulti a pleno."],
  ["Master Yi","Taric",4,"Taric hace invulnerable a Yi justo cuando entra a resetear."],
  ["Kayle","Shen",3,"Shen llega desde cualquier lado a proteger a Kayle mientras escala."],
  ["Twisted Fate","Nocturne",3,"Dos ultis globales: jugadas sorpresa en cualquier línea."],
  ["Sona","Taric",3,"Dos encantadores con escudos y curas: muy difícil de matar en peleas largas."],
  ["Ashe","Braum",3,"Braum bloquea los proyectiles y Ashe abre peleas desde lejos con total seguridad."],
  ["Draven","Leona",3,"Leona engancha y Draven convierte cada nivel 2 en una kill."],
  ["Caitlyn","Lux",3,"Caitlyn y Lux asedian la línea desde un rango que el rival no alcanza."],
];

function analyze(team,mine=true){
  const names=new Set(team.map(c=>c.name));
  const good=[],bad=[],parts=[];
  const affs=team.map((c,i)=>affinity(c,i,mine));

  // Winrate (8)
  const avgWR=team.reduce((a,c)=>a+c.wr,0)/5;
  parts.push(["Winrate de los picks",clamp((avgWR-48)/4*8,0,8),8]);
  if(avgWR>=50.8) good.push(`Picks sólidos: el WR de referencia promedio es ${avgWR.toFixed(1)}%.`);
  if(avgWR<49.5) bad.push(`Campeones con WR bajo de referencia (${avgWR.toFixed(1)}% promedio): dependen mucho de la mano.`);

  // Afinidad de línea (14)
  parts.push(["Afinidad de línea",clamp(affs.reduce((a,v)=>a+v,0)/5*14,0,14),14]);
  const off=team.map((c,i)=>affs[i]<.3?`${c.name} en ${LANE_NAME[LANE_CODE[i]]}`:null).filter(Boolean);
  if(!off.length) good.push("Los cinco juegan en una línea que conocen: nadie regala la fase de líneas.");
  else bad.push(`Fuera de su línea: ${off.join(", ")}. Pierden la fase de líneas y no completan la misión de rol.`);

  // Misiones de rol (6)
  let quest=0; const qNotes=[];
  team.forEach((c,i)=>{
    if(affs[i]<.5) return;
    const L=LANE_CODE[i]; let v=.9;
    if(L==="T"&&(c.l>=3||has(c,"S"))){ v=1.2; qNotes.push(`${c.name} saca jugo del nivel 20 y del TP mejorado de top.`); }
    if(L==="J"&&(c.e>=3||has(c,"E"))){ v=1.2; qNotes.push(`${c.name} completa rápido la misión de jungla y presiona desde temprano.`); }
    if(L==="M"&&(has(c,"A")||has(c,"G"))){ v=1.2; qNotes.push(`Con las botas mejoradas de mid, ${c.name} roamea a cualquier línea.`); }
    if(L==="B"){ v=isCarry(c)?1.2:.6; if(isCarry(c)) qNotes.push(`Con el slot extra de botas, ${c.name} llega a seis ítems de daño completos.`); }
    if(L==="S"&&(has(c,"H")||has(c,"P")||has(c,"E"))){ v=1.2; qNotes.push(`${c.name} aprovecha el slot extra de wards para dominar la visión.`); }
    quest+=v;
  });
  parts.push(["Misiones de rol",clamp(quest,0,6),6]);
  good.push(...qNotes.slice(0,2));

  // Balance AD / AP (9)
  let ad=0,ap=0;
  team.forEach(c=>{ if(c.dmg==="AD")ad+=1; else if(c.dmg==="AP")ap+=1; else if(c.dmg==="M"){ad+=.5;ap+=.5;} });
  const total=ad+ap||1, apShare=ap/total;
  let dmg=9;
  if(apShare<.3) dmg=9-(.3-apShare)*27; else if(apShare>.65) dmg=9-(apShare-.65)*27;
  parts.push(["Balance AD / AP",clamp(dmg,0,9),9]);
  if(apShare<.15) bad.push("Exceso de AD: con una armadura temprana el rival les apaga casi todo el daño.");
  else if(apShare>.85) bad.push("Exceso de AP: el rival arma resistencia mágica y la comp se queda sin dientes.");
  else if(apShare>=.3&&apShare<=.65) good.push("Daño bien repartido entre AD y AP: el rival no puede itemizar contra un solo tipo.");

  // Frontline (10)
  const tankSum=team.reduce((a,c)=>a+c.tank,0), front=team.filter(c=>c.tank>=2).length;
  let fr=clamp(tankSum/7*10,0,10); if(!front) fr*=.4;
  parts.push(["Frontline",fr,10]);
  if(!front) bad.push("No hay nadie que aguante golpes: la primera entrada del rival les cae directo a los carries.");
  else if(tankSum>=7) good.push(`Frontline gruesa (${front} campeones que absorben daño).`);
  else if(tankSum<4) bad.push("Frontline finita: van a sufrir peleas largas.");

  // DPS en su rol (10): ADC, si no mid, y como último recurso jungla afín
  const carriesN=team.filter(isCarry).length;
  let dps;
  if(isCarry(team[3])&&affs[3]>=.5){ dps=10; good.push(`${team[3].name} carga el DPS desde el ADC, donde tiene que estar.`); }
  else if(isCarry(team[2])&&affs[2]>=.5){ dps=7; bad.push(`El ADC no carga daño sostenido: el DPS lo pone ${team[2].name} desde mid.`); }
  else if(isCarry(team[1])&&affs[1]>=.5){ dps=5; bad.push(`Último recurso: el daño sostenido depende de ${team[1].name} en jungla.`); }
  else if(isCarry(team[3])){ dps=6; bad.push(`${team[3].name} carga el daño desde el ADC, pero no es su línea natural.`); }
  else if(carriesN){ dps=3; bad.push(`El único DPS (${team.filter(isCarry).map(c=>c.name).join(", ")}) está en una línea donde no rinde.`); }
  else { dps=1; bad.push("No hay un DPS claro: si no ganan con la primera ráfaga, no tienen cómo terminar la pelea."); }
  if(carriesN>=3){ dps-=2; bad.push("Demasiados carries que quieren recursos: alguien va a quedar sin oro."); }
  parts.push(["DPS en su rol",clamp(dps,0,10),10]);

  // Control (7)
  const ccSum=team.reduce((a,c)=>a+c.cc,0);
  parts.push(["Control de masas",clamp(ccSum/11*7,0,7),7]);
  if(ccSum>=11) good.push("Muchísimo control: cualquiera que pise mal queda encadenado.");
  else if(ccSum<6) bad.push("Poco control: les va a costar fijar objetivos y frenar asesinos.");

  // Iniciación (7)
  const E=count(team,"E"),F=count(team,"F"),P=count(team,"P"),H=count(team,"H");
  parts.push(["Iniciación",clamp(E?5+Math.min(F,2):(P>=2?3:1),0,7),7]);
  if(!E) bad.push("Nadie puede abrir peleas: dependen de que el rival entre primero.");
  else if(F>=2) good.push("Tienen entrada y seguimiento en área para convertir una buena iniciación en ace.");

  // Curva de poder (8)
  const pe=team.reduce((a,c)=>a+c.e,0), pm=team.reduce((a,c)=>a+c.m,0), pl=team.reduce((a,c)=>a+c.l,0);
  const mn=Math.min(pe,pm,pl);
  parts.push(["Curva de poder",clamp(clamp((pe+pm+pl-25)/12*5.5,0,5.5)+(mn>=9?2.5:mn>=7?1.2:0),0,8),8]);
  if(pe<=7) bad.push("Early muy débil: van a regalar los primeros dragones y heraldos si el rival presiona.");
  if(pl<=9) bad.push("Se caen en late: si la partida se estira, el rival los supera.");
  if(pe>=12) good.push("Early fuerte: pueden snowballear objetivos desde el minuto 5.");
  if(pl>=13) good.push("Escalan muy bien: en late tienen más techo que casi cualquier rival.");

  // Dúo de botlane (10)
  const adc=team[3], sup=team[4];
  const supType=(sup.tank>=2||has(sup,"H")||has(sup,"P"))?"protector":((has(sup,"K")||has(sup,"F"))&&!has(sup,"A"))?"daño":"frágil";
  let duo=supType==="protector"?7:supType==="daño"?(adc.e>=2?5:4):2;
  if(supType==="protector") good.push(`${sup.name} le da a ${adc.name} el aguante que necesita en línea.`);
  if(supType==="daño") good.push(`${sup.name} le suma presión de daño a ${adc.name}, aunque con poca protección si los divean.`);
  if(supType==="frágil") bad.push(`${adc.name} con ${sup.name}: botlane de cristal, muy fácil de matar en early. Un soporte tanque o de protección la sostendría mejor.`);
  if(sup.cc>=3&&adc.e>=3){ duo+=2; good.push(`${adc.name} y ${sup.name} son una línea de kill: mucho cc y daño temprano.`); }
  if(PAIRS.some(([a,b])=>(a===adc.name&&b===sup.name)||(b===adc.name&&a===sup.name))) duo+=2;
  if(affs[4]<.3){ duo-=2; if(isCarry(sup)) bad.push(`${sup.name} de soporte se queda sin oro por el ítem de soporte: no llega a sus objetos clave.`); }
  parts.push(["Dúo de botlane",clamp(duo,0,10),10]);

  // Sinergia de kits (11)
  let syn=3; const synNotes=[];
  PAIRS.forEach(([a,b,pts,txt])=>{ if(names.has(a)&&names.has(b)){ syn+=pts; synNotes.push(txt); } });
  const windUsers=team.filter(c=>c.name==="Yasuo"||c.name==="Yone");
  if(windUsers.length){
    const ups=team.filter(c=>has(c,"U")&&!windUsers.includes(c)).length;
    if(ups){ syn+=ups>=2?5:3; synNotes.push(`${windUsers.map(c=>c.name).join(" y ")} tiene${windUsers.length>1?"n":""} ${ups} fuente${ups>1?"s":""} de knock-up para el ulti.`); }
    else bad.push(`${windUsers[0].name} no tiene ni un knock-up aliado: su ulti depende solo de él.`);
  }
  const Y=count(team,"Y"),K=count(team,"K"),A=count(team,"A"),G=count(team,"G"),S=count(team,"S");
  if(E>=1&&F>=3){ syn+=4; synNotes.push("Composición wombo: varios ultis en área que se encadenan."); }
  if(Y>=1&&H+P>=2){ syn+=4; synNotes.push("Hay peel de sobra para proteger al hipercarry."); }
  if(Y>=1&&H+P===0){ syn-=3; bad.push("Hipercarry sin nadie que lo cuide: cualquier asesino lo borra."); }
  if(K>=3){ syn+=3; synNotes.push("Mucho poke: pueden ablandar a los rivales antes de cada objetivo."); }
  if(A>=2&&(G>=1||E>=1)){ syn+=3; synNotes.push("Buena capacidad de pick: pueden cazar a quien quede solo."); }
  if(S>=1&&G>=1){ syn+=2; synNotes.push("Split push respaldado por presencia global."); }
  if(A>=3){ syn-=2; bad.push("Tres o más asesinos: si no consiguen ventaja temprano, pierden todas las peleas en grupo."); }
  if(S>=3){ syn-=2; bad.push("Demasiados duelistas: a todos les gusta irse solos y el equipo se desarma."); }
  if(Y>=3){ syn-=3; bad.push("Tres campeones que necesitan escalar: el early va a ser un calvario."); }
  parts.push(["Sinergia de kits",clamp(syn,0,15)*11/15,11]);
  good.push(...synNotes);

  // Identidad, nota y explicación
  const ids=[["Wombo combo",E>=1&&F>=3?E+F:0],["Proteger al carry",Y>=1?(H+P)*1.2:0],["Poke y asedio",K>=3?K*1.1:0],
             ["Pick y caza",A>=2?A+G:0],["Split push 1-3-1",S>=2?S+G:0]].sort((a,b)=>b[1]-a[1]);
  const identity=ids[0][1]>0?ids[0][0]:"Escaramuza";
  const score=Math.round(clamp(parts.reduce((a,p)=>a+p[1],0),1,100));
  const verdict=score>=85?"Comp de Worlds":score>=70?"Muy jugable":score>=55?"Funciona con ejecución":score>=40?"Cuesta arriba":"Rezale al rival";
  const phaseName=[["early",pe],["mid",pm],["late",pl]].sort((a,b)=>b[1]-a[1])[0][0];
  const plan={early:"forzar dragones y heraldo temprano y cerrar antes del minuto 25",
              mid:"agruparse en mid game y pelear cada objetivo neutral",
              late:"farmear tranquilos, ceder lo que haga falta y pelear con ítems completos"}[phaseName];
  const top2=bad.slice(0,2).map(t=>t.charAt(0).toLowerCase()+t.slice(1).replace(/\.$/,""));
  let explain=`La identidad de este equipo es <b>${identity.toLowerCase()}</b> y su mejor momento es el ${phaseName} game, así que el plan es ${plan}. `;
  explain+=score>=70?"Tiene las piezas básicas cubiertas, cada uno está donde rinde y los kits se suman entre sí. "
         :score>=50?"Tiene con qué ganar, pero le faltan piezas y la ejecución va a pesar mucho. "
         :"Le faltan demasiadas piezas para competir de igual a igual. ";
  if(top2.length) explain+=`Lo que más la frena: ${top2.join("; y ")}.`;
  return {score,verdict,identity,explain,parts,ad,ap,pe,pm,pl,good,bad};
}

function faceHTML(c){
  return `<span class="face"><b>${initials(c.name)}</b><img src="${faceUrl(c)}" alt="" ${imgAttrs(c)}></span>`;
}

function evaluate(){
  const team=state.slots.map(s=>s.champ);
  renderResults(analyze(team),team);
  const t=document.getElementById("tabSim"); t.disabled=false; t.title="";
}

function renderResults(r,team){
  const el=document.getElementById("results");
  const total=(r.ad+r.ap)||1, adPct=Math.round(r.ad/total*100), apPct=100-adPct;
  const hex=(cx,cy,rad)=>Array.from({length:6},(_,k)=>{const a=Math.PI/3*k-Math.PI/2;return `${cx+rad*Math.cos(a)},${cy+rad*Math.sin(a)}`}).join(" ");
  el.innerHTML=`
    <div class="res-top">
      <div class="score-hex">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <polygon points="${hex(100,100,94)}" fill="#08121f" stroke="#785a28" stroke-width="2"/>
          <polygon points="${hex(100,100,84)}" fill="none" stroke="#c8aa6e" stroke-width="3" stroke-dasharray="${r.score/100*504} 504"/>
        </svg>
        <div class="score-num"><b>${r.score}</b><small>de 100</small></div>
      </div>
      <div>
        <div class="verdict">${r.verdict}</div>
        <div class="identity">${r.identity}</div>
        <div class="strip">${team.map(faceHTML).join("")}</div>
        <p class="explain">${r.explain}</p>
        <button class="btn-big primary" style="margin-top:16px" onclick="startSim()">Llevar a simulación</button>
      </div>
    </div>
    <div class="res-grid">
      <div>
        <h3 class="section-title">Desglose</h3>
        ${r.parts.map(([n,v,m])=>`<div class="row"><span>${n}</span><div class="bar"><i style="width:${v/m*100}%"></i></div><span class="pts">${v.toFixed(1)}/${m}</span></div>`).join("")}
      </div>
      <div>
        <h3 class="section-title">Tipo de daño</h3>
        <div class="split">
          <div style="width:${adPct}%;background:var(--ad)">${adPct>12?adPct+"%":""}</div>
          <div style="width:${apPct}%;background:var(--ap)">${apPct>12?apPct+"%":""}</div>
        </div>
        <div class="split-legend"><span>AD</span><span>AP</span></div>
        <div class="box">
          <h3 class="section-title">Fuerza por fase</h3>
          <div class="phases">
            ${[["Early",r.pe],["Mid",r.pm],["Late",r.pl]].map(([n,v])=>`<div class="phase"><div class="col" style="height:${v/15*100}%"></div><span>${n}: ${v}</span></div>`).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="lists">
      <div class="good"><h3 class="section-title">Por qué funciona</h3><ul>${(r.good.length?r.good:["Nada destaca demasiado: es una comp sin puntos fuertes claros."]).map(t=>`<li>${t}</li>`).join("")}</ul></div>
      <div class="bad"><h3 class="section-title">Por qué puede fallar</h3><ul>${(r.bad.length?r.bad:["No hay agujeros evidentes: si pierden, es por ejecución."]).map(t=>`<li>${t}</li>`).join("")}</ul></div>
    </div>
    <p class="disclaimer">El WR de referencia es un valor aproximado cargado a mano; para estadísticas reales conectá una fuente de datos por parche.</p>`;
  el.className="frame show";
  el.scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"start"});
}

/* =========================================================
   MODO SIMULACIÓN
   ========================================================= */
const RANGES=[[10,35],[35,65],[65,90]];
let sim=null;
const dist=(s,mn,mx)=>s<mn?mn-s:s>mx?s-mx:0;

// Arma un rival dentro del rango: arranca al azar y lo ajusta cambiando campeones hasta caer cerca de un objetivo
function genEnemy(mn,mx,exclude){
  const target=mn+Math.random()*(mx-mn);
  let best=null,bestD=1e9;
  for(let r=0;r<10;r++){
    const used=new Set(exclude); let team=[];
    const affine=Math.random()<target/100;
    for(let ri=0;ri<5;ri++){
      let c=CHAMPS.filter(x=>!used.has(x.name));
      if(affine){ const a=c.filter(x=>baseAff(x,ri)===1); if(a.length) c=a; }
      const p=rnd(c); used.add(p.name); team.push(p);
    }
    let s=analyze(team,false).score;
    for(let step=0;step<300;step++){
      if(!dist(s,mn,mx)&&Math.abs(s-target)<=5) break;
      const ri=Math.floor(Math.random()*5);
      const u=new Set([...exclude,...team.map(c=>c.name)]);
      let c=CHAMPS.filter(x=>!u.has(x.name));
      if(s<target&&Math.random()<.6){ const a=c.filter(x=>baseAff(x,ri)===1); if(a.length) c=a; }
      if(s>target&&Math.random()<.6){ const o=c.filter(x=>baseAff(x,ri)===0); if(o.length) c=o; }
      const nt=team.slice(); nt[ri]=rnd(c);
      const ns=analyze(nt,false).score;
      if(Math.abs(ns-target)<=Math.abs(s-target)){ team=nt; s=ns; }
    }
    const d=dist(s,mn,mx);
    if(!d) return {team,score:s};
    if(d<bestD){ bestD=d; best={team,score:s}; }
  }
  return best;
}

function startSim(){
  if(!state||!allLocked()) return;
  sim={round:0,my:state.slots.map(s=>s.champ),history:[],done:false};
  setupRound();
  showView("sim");
}
function setupRound(){
  const [mn,mx]=RANGES[sim.round];
  sim.enemy=genEnemy(mn,mx,sim.my.map(c=>c.name));
  sim.used=false; sim.swap=false; sim.fresh=null; sim.enemyFresh=true;
  renderSim();
}
function simSwapMode(){ if(!sim.round||sim.used||sim.playing) return; sim.swap=!sim.swap; renderSim(); }
function simSwap(i){
  if(!sim.swap||sim.playing) return;
  const used=new Set([...sim.my.map(c=>c.name),...sim.enemy.team.map(c=>c.name)]);
  const cands=CHAMPS.filter(x=>!used.has(x.name)&&baseAff(x,i)===1);
  sim.my[i]=rnd(cands); sim.used=true; sim.swap=false; sim.fresh=i; sim.enemyFresh=false;
  renderSim();
}
function simRerollEnemy(){
  if(!sim.round||sim.used||sim.playing) return;
  const [mn,mx]=RANGES[sim.round];
  sim.enemy=genEnemy(mn,mx,sim.my.map(c=>c.name));
  sim.used=true; sim.swap=false; sim.fresh=null; sim.enemyFresh=true;
  renderSim();
}

function teamRows(team,mine){
  return team.map((c,i)=>{
    const tag=mine?"button":"div";
    const fresh=(mine&&sim.fresh===i)||(!mine&&sim.enemyFresh);
    return `<${tag} class="trow ${fresh?"new":""}" ${mine?`onclick="simSwap(${i})" ${sim.swap?"":"tabindex='-1'"}`:""}>
      ${faceHTML(c)}
      <span class="who"><strong>${c.name}</strong><small>${LANE_NAME[LANE_CODE[i]]}</small></span>
      ${affChip(c,i,mine)}
    </${tag}>`;
  }).join("");
}

function renderSim(){
  const v=document.getElementById("simView");
  const pips=RANGES.map(([a,b],k)=>{
    const h=sim.history.find(x=>x.round===k);
    const cls=h?(h.win?"win":"lose"):(k===sim.round&&!sim.done?"current":"");
    const st=h?(h.win?"Victoria":"Derrota"):sim.done?"No jugada":k===sim.round?"En juego":"Pendiente";
    return `<div class="round ${cls}"><b>Ronda ${k+1}</b><span>Rival de ${a} a ${b} puntos</span><span class="rstate">${st}</span></div>`;
  }).join("");

  if(sim.done){
    const wins=sim.history.filter(h=>h.win).length, lost=sim.history.find(h=>!h.win);
    v.innerHTML=`<section class="frame sim">
      <div class="rounds">${pips}</div>
      <div class="final" id="stats"><div class="verdict">${lost?`Caíste en la ronda ${lost.round+1}`:"Ganaste las 3 rondas"}</div>
        <p class="identity">Ganaste ${wins} de ${sim.history.length} ${sim.history.length===1?"partida jugada":"partidas jugadas"}.</p>
        <p class="sim-note">La afinidad de cada campeón con su línea se ajustó según cómo le fue en estas partidas. Se guarda en este navegador y pesa en las próximas evaluaciones.</p></div>
      <h3 class="section-title" style="margin-top:22px">Tabla de afinidad del equipo</h3>
      <div class="tablewrap"><table class="aff">
        <thead><tr><th>Línea</th><th>Campeón</th><th>Esta simulación</th><th>Récord total</th><th>Afinidad</th></tr></thead>
        <tbody>${sim.table.map(e=>{
          const d=Math.round(e.after*100)-Math.round(e.before*100);
          return `<tr><td>${LANE_NAME[LANE_CODE[e.i]]}</td><td><span class="cell-champ">${faceHTML(e.c)}${e.c.name}</span></td>
            <td>${e.w}V ${e.l}D</td><td>${e.total.w}V ${e.total.l}D</td>
            <td>${Math.round(e.before*100)}% a <b>${Math.round(e.after*100)}%</b> <span class="${d>0?"up":d<0?"down":""}">${d>0?"▲ +"+d:d<0?"▼ "+d:"="}</span></td></tr>`;
        }).join("")}</tbody></table></div>
      <div class="sim-actions">
        <button class="btn-big primary" onclick="startSim()">Jugar otra vez con este equipo</button>
        <button class="btn-big" onclick="showView('draft')">Volver al draft</button>
      </div></section>`;
    return;
  }

  const me=analyze(sim.my), en=sim.enemy.score;
  const p=Math.round(100/(1+Math.exp(-(me.score-en)/9)));
  const locked=!sim.round;
  v.innerHTML=`<section class="frame sim ${sim.swap?"swap-mode":""}">
    <div class="rounds">${pips}</div>
    <div class="versus">
      <div class="team mine"><h3><span>Tu equipo</span><big>${me.score}</big></h3>${teamRows(sim.my,true)}</div>
      <div class="vs">VS<small>Chances de ganar: ${p}%</small><small>Decisiones en la partida: ${matchPlan(me.score,en).evMax}</small></div>
      <div class="team enemy"><h3><span>Rival</span><big>${en}</big></h3>${teamRows(sim.enemy.team,false)}</div>
    </div>
    <div class="sim-actions">
      <button class="btn-big" onclick="simSwapMode()" ${locked||sim.used?"disabled":""}>${sim.swap?"Cancelar cambio":"Cambiar un campeón"}</button>
      <button class="btn-big" onclick="simRerollEnemy()" ${locked||sim.used?"disabled":""}>Rerollear al rival</button>
      <button class="btn-big primary" id="playBtn" onclick="playRound()">Jugar ronda ${sim.round+1}</button>
    </div>
    <p class="sim-note">${locked?"En la primera ronda jugás con lo que armaste: no hay cambios."
      :sim.swap?"Elegí qué campeón de tu equipo cambiar: entra uno que tiene esa línea como principal."
      :sim.used?"Ya usaste tu cambio de esta ronda."
      :"Tenés un solo cambio por ronda: reemplazar un campeón tuyo por uno más afín a la línea o rerollear al rival."}</p>
    <div id="matchArea"></div>
  </section>`;
}

/* =========================================================
   PARTIDA EN VIVO
   La partida corre sola minuto a minuto: las líneas empujan,
   hay kills, torres y objetivos. Cada tanto aparece un evento
   que depende de cómo viene la partida, con 2 opciones cuyas
   chances salen del contexto de ese momento.
   ========================================================= */
const sig=x=>1/(1+Math.exp(-x));
const LANES={top:[0],mid:[2],bot:[3,4]};
const LANE_OF=["top",null,"mid","bot","bot"];
const PATHS={top:[[40,340],[40,40],[340,40]],mid:[[62,338],[338,62]],bot:[[60,360],[360,360],[360,60]]};
const JG_SPOTS=[[110,230],[150,300],[225,305],[95,165],[165,250]];
const BASE={mine:[40,360],enemy:[360,40]};
const TICK_MS=650;
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);

function tstats(team,mine){
  const a=analyze(team,mine);
  const s={score:a.score,pe:a.pe,pm:a.pm,pl:a.pl,ap:a.ap,ad:a.ad,
    cc:team.reduce((x,c)=>x+c.cc,0),tank:team.reduce((x,c)=>x+c.tank,0),dps:team.filter(isCarry).length};
  "EFPHASGKYU".split("").forEach(f=>s[f]=count(team,f));
  return s;
}

/* ---------- Accesos al estado ---------- */
const other=s=>s==="mine"?"enemy":"mine";
const champ=(s,i)=>s==="mine"?sim.match.team[i]:sim.enemy.team[i];
// Fuera de la partida: muerto o AFK
const gone=c=>!!(c.dead||c.afk);
const alive=(s,i)=>!gone(sim.match.ch[s][i]);
const aliveCount=s=>sim.match.ch[s].filter(c=>!gone(c)).length;
const aliveIn=(s,L)=>LANES[L].filter(i=>alive(s,i));
const kd=(s,i)=>{ const c=sim.match.ch[s][i]; return `${c.k}/${c.d}`; };
function form(s,i){ const c=sim.match.ch[s][i]; return clamp((c.k-c.d)*.25,-1.5,1.5); }
const phaseVal=(c,t)=>t<14?c.e:t<25?c.m:c.l;
function str(s,i){ const c=champ(s,i), M=sim.match, cr=M.carry&&M.carry.side===s&&M.carry.i===i&&M.carry.until>=M.t?1.5:0;
  return phaseVal(c,M.t)+(s==="mine"?affinity(c,i):baseAff(c,i))*1.2+form(s,i)*.6+cr; }
function laneHp(s,L){ const ids=aliveIn(s,L); return ids.length?ids.reduce((a,i)=>a+sim.match.ch[s][i].hp,0)/ids.length:0; }
function push(L,d){ const ln=sim.match.lanes[L]; ln.p=clamp(ln.p+d,-1,1); }
const hpTxt=v=>v>.7?"con toda la vida":v>.35?"a media vida":"con poca vida";
const laneTxt=p=>p>.5?"dominando la línea":p>.15?"con ventaja":p>-.15?"pareja":p>-.5?"en desventaja":"bajo torre, muy presionada";
const goldTxt=()=>{ const g=sim.match.gold; return Math.abs(g)<400?"parejo":`${g>0?"+":"−"}${(Math.abs(g)/1000).toFixed(1)}k ${g>0?"a favor":"en contra"}`; };
const recent=(t)=>t!=null&&sim.match.t-t<=3;

/* ---------- Efectos ---------- */
function kill(side,victim,killer){
  const M=sim.match, v=M.ch[other(side)][victim];
  if(v.dead) return false;
  if(killer==null||!alive(side,killer)){ const al=[0,1,2,3,4].filter(i=>alive(side,i)); killer=al.length?rnd(al):0; }
  v.dead=2+Math.floor(M.t/12); v.d++; v.hp=1;
  M.ch[side][killer].k++; M.kills[side]++;
  M.gold+=side==="mine"?300:-300;
  return true;
}
function teamKills(side,n){
  let done=0;
  for(let k=0;k<n;k++){ const v=[0,1,2,3,4].filter(i=>alive(other(side),i)); if(!v.length) break; if(kill(side,rnd(v))) done++; }
  return done;
}
/* ---------- Estructuras ----------
   Por línea: 3 torretas (exterior, interior, inhibidor) y 1 inhibidor que reaparece.
   Con el inhibidor de una línea en pie no se puede pasar a las 2 torres del nexo ni al nexo. */
const TOWER_NAME=["torre exterior","torre interior","torre del inhibidor"];
const INHIB_RESPAWN=5;
const inhibDown=(d,L)=>sim.match.inhib[d][L]>0;
const inhibsDown=d=>["top","mid","bot"].filter(L=>inhibDown(d,L)).length;
// Línea donde el atacante tiene más avanzado el asedio (para seguir rompiendo ahí)
function siegeLane(side){
  const M=sim.match, d=other(side), depth=L=>M.tw[d][L]+(inhibDown(d,L)?1:0), sg=side==="mine"?1:-1;
  return ["top","mid","bot"].sort((a,b)=>depth(b)-depth(a)||(M.lanes[b].p-M.lanes[a].p)*sg)[0];
}
// side rompe la próxima estructura de la línea L del otro equipo
function tower(side,L){
  const M=sim.match, d=other(side), tw=M.tw[d], sg=side==="mine"?1:-1;
  if(M.over) return "el nexo";
  if(!L) L=siegeLane(side);
  let txt;
  if(tw[L]<3){ tw[L]++; M.gold+=sg*550; txt=`la ${TOWER_NAME[tw[L]-1]} de ${L}`; }
  else if(!inhibDown(d,L)){ M.inhib[d][L]=M.t+INHIB_RESPAWN; M.gold+=sg*450; txt=`el inhibidor de ${L}`; }
  else if(M.nexusT[d]>0){ M.nexusT[d]--; M.gold+=sg*300; txt=M.nexusT[d]?"una torre del nexo":"la última torre del nexo"; }
  else { drawStructs(); endGame(side==="mine","nexo"); return "el nexo"; }
  M.lanes[L].p*=.5; drawStructs();
  return txt;
}
/* ---------- Dragones y Barón ----------
   Cada equipo puede hacer como mucho 4 dragones elementales (el cuarto da el Alma).
   Cuando alguien tiene el Alma solo sale el Dragón Ancestral. */
const soulTaken=()=>sim.match.dr.mine>=4||sim.match.dr.enemy>=4;
const buffOn=b=>b&&b.until>=sim.match.t;
function drake(side){
  const M=sim.match, sg=side==="mine"?1:-1;
  if(soulTaken()){ M.elder={side,until:M.t+3}; M.gold+=sg*400; M.drakeT=M.t+6; return "el Dragón Ancestral"; }
  M.dr[side]++; M.gold+=sg*200;
  if(M.dr[side]===4){ M.soul=side; M.drakeT=M.t+6; return "el cuarto dragón y el Alma"; }
  M.drakeT=M.t+5; return "el dragón";
}
function baron(side){ const M=sim.match; M.baron={side,until:M.t+3}; M.baronT=M.t+6; M.gold+=side==="mine"?1500:-1500; }
// Después de ganar una pelea grande el ganador convierte: Barón o dragón si están, y estructuras
function aftermath(side,hits){
  const M=sim.match, gains=[];
  const extra=aliveCount(side)-aliveCount(other(side))>=3?1:0;
  if(M.t>=M.baronT&&!buffOn(M.baron)) { baron(side); gains.push("el Barón"); }
  else if(M.t>=M.drakeT-2) gains.push(drake(side));
  const n=hits??(2+extra-(gains.length?1:0));
  for(let k=0;k<n&&!M.over;k++) gains.push(tower(side));
  if(!gains.length) return "";
  return gains.length===1?gains[0]:gains.slice(0,-1).join(", ")+" y "+gains[gains.length-1];
}
// Dónde está la oleada en cada línea (0 = tu base, 1 = base rival). Con p=±.15 ya queda a la altura de la torre exterior.
const frontF=p=>.5+.32*Math.sign(p)*Math.sqrt(Math.abs(p));
const clashPt=L=>along(PATHS[L],frontF(sim.match.lanes[L].p));
function along(path,f){
  const seg=[]; let L=0;
  for(let i=1;i<path.length;i++){ const d=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]); seg.push(d); L+=d; }
  let x=clamp(f,0,1)*L;
  for(let i=0;i<seg.length;i++){
    if(x<=seg[i]||i===seg.length-1){ const r=Math.min(x/seg[i],1); return [path[i][0]+(path[i+1][0]-path[i][0])*r,path[i][1]+(path[i+1][1]-path[i][1])*r]; }
    x-=seg[i];
  }
}

/* ---------- Índices ocultos ---------- */
const sideVal=(s,v)=>s==="mine"?v:s==="enemy"?-v:0;
function buffs(){
  const M=sim.match;
  return (M.carry&&M.carry.until>=M.t?sideVal(M.carry.side,.6):0)+sideVal(M.soul,.5)+(buffOn(M.elder)?sideVal(M.elder.side,1.2):0)+(buffOn(M.baron)?sideVal(M.baron.side,.6):0);
}
// Diferencia de puntaje de los equipos en escala de probabilidad (la misma que muestra "Chances de ganar")
const baseLogit=()=>(sim.match.myScore-sim.enemy.score)/10;
function tfIndex(){
  const M=sim.match, me=tstats(M.team,true), en=tstats(sim.enemy.team,false), ph=M.t<14?"pe":M.t<25?"pm":"pl";
  const formDiff=[0,1,2,3,4].reduce((a,i)=>a+form("mine",i)-form("enemy",i),0);
  return (me.cc-en.cc)*.08+(me.F-en.F)*.25+(me.tank-en.tank)*.08+(me.dps-en.dps)*.25+(me[ph]-en[ph])*.12
        +M.gold/3000+(aliveCount("mine")-aliveCount("enemy"))*.5+formDiff*.12+buffs()+M.edge*.3;
}
function winIndex(){
  const M=sim.match;
  return baseLogit()+M.edge+M.gold/3500+(M.dr.mine-M.dr.enemy)*.12+(sum(M.tw.enemy)-sum(M.tw.mine))*.07
        +(inhibsDown("enemy")-inhibsDown("mine"))*.25+(M.nexusT.mine-M.nexusT.enemy)*.2+buffs();
}

/* ---------- Eventos: cada uno decide si tiene sentido según el momento ---------- */
const EVENTS=[
{ id:"roam",
  w:M=>M.t>=4&&M.t<=20&&alive("mine",2)&&(aliveIn("enemy","top").length||aliveIn("enemy","bot").length)?1.2:0,
  make:M=>{
    const L=rnd(["top","bot"].filter(l=>aliveIn("enemy",l).length));
    const lp=M.lanes[L].p, eh=laneHp("enemy",L), mid=champ("mine",2), fm=form("mine",2), emid=champ("enemy",2);
    return {title:"Ventana de rotación",
      show:()=>{ stageLane("mid"); stageLane(L); hl("mine",2); LANES[L].forEach(i=>alive("enemy",i)&&hl("enemy",i));
        mark(clashPt("mid"),"Mid empujada","mine"); mark(clashPt(L),`${L}: ${laneLabel(lp)}`); arrow(posOf("mine",2),clashPt(L)); },
      ctx:`${mid.name} (${kd("mine",2)}) tiene la oleada de mid empujada. En ${L} tu línea va ${laneTxt(lp)} y el rival está ${hpTxt(eh)}.`,
      opts:[
      {label:`Rotar a ${L}`,desc:`${mid.name} deja mid y cae por el río.`,
       p:sig(-.7+fm*.9+(1-eh)*2+lp+((has(mid,"A")||has(mid,"G"))?.4:0)+affinity(mid,2)*.3),
       at:()=>{ const pt=clashPt(L); moveTo("mine",2,pt); return pt; },
       ok:()=>{ const v=aliveIn("enemy",L); let n=0; v.forEach((i,k)=>{ if((k===0||Math.random()<.4)&&kill("mine",i,2)) n++; }); push(L,.4); push("mid",-.1);
                return `${mid.name} llega justo: ${n>1?"doble kill":"kill"} en ${L} y la línea queda a favor.`; },
       fail:()=>{ kill("enemy",2); const a=aliveIn("mine",L); if(a.length&&Math.random()<.5) kill("enemy",rnd(a)); push(L,-.2); push("mid",-.3);
                return `La rotación sale mal: ${mid.name} muere en ${L} y el rival se queda con mid.`; }},
      {label:"Quedarse en mid",desc:"Farmear la oleada y presionar la torre.",
       p:sig(.2+M.lanes.mid.p*.8+fm*.4-((has(emid,"A")||has(emid,"G"))?.5:0)),
       at:()=>clashPt("mid"),
       ok:()=>{ push("mid",.3); M.gold+=250; return `${mid.name} farmea tranquilo y saca ventaja de oro en mid.`; },
       fail:()=>{ const a=aliveIn("mine",L); if(a.length) kill("enemy",rnd(a),2); push(L,-.3);
                return `${emid.name} roteó a ${L} mientras ${mid.name} farmeaba y consiguió una kill.`; }}]};
  }},
{ id:"gank",
  w:M=>M.t>=3&&M.t<=18&&alive("mine",1)&&["top","mid","bot"].some(l=>aliveIn("enemy",l).length)?1.3:0,
  make:M=>{
    const c=["top","mid","bot"].filter(l=>aliveIn("enemy",l).length).sort((a,b)=>M.lanes[a].p-M.lanes[b].p);
    const L=Math.random()<.6?c[0]:rnd(c), lp=M.lanes[L].p, eh=laneHp("enemy",L), jg=champ("mine",1), ejg=champ("enemy",1);
    const allyCC=LANES[L].reduce((a,i)=>a+champ("mine",i).cc,0);
    return {title:"Oportunidad de gank",
      show:()=>{ stageLane(L); const j=jgNear(L); if(alive("mine",1)) moveTo("mine",1,j); hl("mine",1); LANES[L].forEach(i=>alive("enemy",i)&&hl("enemy",i));
        mark(clashPt(L),lp<-.15?"Rival sobreextendido":lp>.15?"Rival bajo su torre":"Oleada en el medio","enemy"); arrow(j,clashPt(L)); },
      ctx:`${jg.name} (${kd("mine",1)}) está cerca de ${L}. El rival ${lp<-.15?"está sobreextendido empujando":lp>.15?"juega atrás, pegado a su torre":"tiene la oleada en el medio"} y está ${hpTxt(eh)}.`,
      opts:[
      {label:`Gankear ${L}`,desc:"Entrar por el costado y forzar la pelea.",
       p:sig(-.3-lp*1.1+form("mine",1)*.6+(1-eh)*1.2+allyCC*.12+((has(jg,"E")||jg.e>=3)?.3:0)-(alive("enemy",1)?.2:-.3)),
       at:()=>{ const pt=clashPt(L); moveTo("mine",1,pt); return pt; },
       ok:()=>{ const v=aliveIn("enemy",L); kill("mine",v[0],1); if(v[1]!=null&&Math.random()<.35) kill("mine",v[1]); push(L,.35);
                return `El gank de ${jg.name} sale perfecto en ${L}.`; },
       fail:()=>{ if(Math.random()<.5) kill("enemy",1,1); else { const a=aliveIn("mine",L); if(a.length) kill("enemy",rnd(a)); } push(L,-.25);
                return `${ejg.name} estaba cerca: contragank en ${L} y la jugada se da vuelta.`; }},
      {label:"Farmear la jungla",desc:"Limpiar campamentos y llegar fuerte al próximo objetivo.",
       p:sig(.3+jg.l*.12-form("enemy",1)*.4+form("mine",1)*.3),
       at:null,
       ok:()=>{ M.gold+=300; return `${jg.name} limpia la jungla y llega adelantado de nivel.`; },
       fail:()=>{ M.gold-=300; if(Math.random()<.4) kill("enemy",1,1); return `${ejg.name} invadió la jungla y le robó los campamentos a ${jg.name}.`; }}]};
  }},
{ id:"drake",
  w:M=>M.t>=4&&M.t>=M.drakeT-1?2.2:0,
  make:M=>{
    const pb=M.lanes.bot.p, pm=M.lanes.mid.p, ad=aliveCount("mine")-aliveCount("enemy");
    const ccD=sim.my.reduce((a,c)=>a+c.cc,0)-sim.enemy.team.reduce((a,c)=>a+c.cc,0);
    const elder=soulTaken(), soon=!M.dr.mine&&!M.dr.enemy?"":M.dr.mine===3&&M.dr.enemy===3?" Los dos equipos están a un dragón del Alma.":M.dr.mine===3?" Si lo hacen, se llevan el Alma.":M.dr.enemy===3?" Si el rival lo hace, se lleva el Alma.":"";
    return {title:elder?"Se viene el Dragón Ancestral":"Se viene el dragón",
      show:()=>{ stageLane("bot"); stageLane("mid"); mark([280,280],elder?"Ancestral en 1:00":"Dragón en 1:00"); },
      ctx:elder?`El Dragón Ancestral sale en un minuto: quien lo haga ejecuta a los rivales con poca vida y gana casi cualquier pelea. Alma para ${M.soul==="mine"?"tu equipo":"el rival"}${ad>0?"; el rival tiene gente muerta":ad<0?"; a tu equipo le faltan aliados vivos":""}.`
        :`El dragón sale en un minuto. Botlane ${laneTxt(pb)}, mid ${laneTxt(pm)}. Dragones ${M.dr.mine} a ${M.dr.enemy}.${soon}${ad>0?" El rival tiene gente muerta.":ad<0?" A tu equipo le faltan aliados vivos.":""}`,
      opts:[
      {label:"Pelear el dragón",desc:"Agruparse en el foso y forzar.",
       p:sig((pb+pm)*.8+(str("mine",1)-str("enemy",1))*.25+M.gold/4000+ad*.4+ccD*.04),
       at:()=>{ groupTo("mine",[262,292]); groupTo("enemy",[300,262]); return [280,280]; },
       ok:()=>{ const d=drake("mine"); const n=teamKills("mine",1+Math.floor(Math.random()*2)); return `Tu equipo se queda con ${d}${n?` y ${n} kill${n>1?"s":""} en la pelea`:""}.`; },
       fail:()=>{ const d=drake("enemy"); const n=teamKills("enemy",1+Math.floor(Math.random()*2)); const g=n>=2?aftermath("enemy",1):"";
                return `El rival gana la pelea en el foso y se queda con ${d}${g?`; después tira ${g}`:""}.`; }},
      {label:"Cederlo y presionar top",desc:"Cambiar el dragón por una torre del otro lado del mapa.",
       p:sig(.15+M.lanes.top.p*1.2+(aliveIn("mine","top").length?0:-.8)),
       at:()=>clashPt("top"),
       ok:()=>{ const d=drake("enemy"); const t=tower("mine","top"); return `Cambio de objetivos: el rival hace ${d}, pero tu equipo tira ${t}.`; },
       fail:()=>{ const d=drake("enemy"); const a=aliveIn("mine","top"); if(a.length) kill("enemy",a[0]); return `El rival hace ${d} y además defiende top: el cambio no salió.`; }}]};
  }},
{ id:"tf",
  w:M=>M.t>=14&&aliveCount("mine")>=3?1:0,
  make:M=>{
    const me=tstats(M.team,true), en=tstats(sim.enemy.team,false), am=aliveCount("mine"), ae=aliveCount("enemy");
    return {title:"El rival se agrupa",
      show:()=>{ groupTo("enemy",[222,178]); [0,1,2,3,4].forEach(i=>alive("enemy",i)&&hl("enemy",i)); mark([222,178],"Rival agrupado en mid","enemy"); },
      ctx:`El rival se junta en mid buscando pelea. Oro ${goldTxt()}, vivos ${am} contra ${ae}.`,
      opts:[
      {label:"Aceptar la pelea",desc:"Los cinco al centro a pelear de frente.",
       p:sig(tfIndex()), big:true,
       at:()=>{ groupTo("mine",[185,215]); groupTo("enemy",[215,185]); return [200,200]; },
       ok:()=>{ const n=teamKills("mine",3+Math.floor(Math.random()*3)); teamKills("enemy",Math.random()<.4?1:0); M.recentWin=M.t; const g=aftermath("mine");
                return `Teamfight ganada: ${n} kills y, con el rival muerto, tu equipo se lleva ${g}.`; },
       fail:()=>{ const n=teamKills("enemy",3+Math.floor(Math.random()*3)); teamKills("mine",Math.random()<.4?1:0); M.recentLoss=M.t; const g=aftermath("enemy");
                return `Teamfight perdida: ${n} muertos y, sin nadie para defender, el rival se lleva ${g}.`; }},
      {label:"Retroceder y limpiar oleadas",desc:"No dar la pelea y defender con las oleadas.",
       p:sig(.1+(me.K-en.K)*.25+(me.pl-en.pl)*.1-M.gold/4000),
       at:()=>{ groupTo("mine",[120,282]); return [120,282]; },
       ok:()=>{ M.gold+=150; return "Tu equipo limpia las oleadas y el rival se queda sin nada que hacer."; },
       fail:()=>{ const t=tower("enemy"); return `Sin pelear, el rival asedia tranquilo y tira ${t}.`; }}]};
  }},
{ id:"baron",
  w:M=>M.t>=M.baronT?(recent(M.recentWin)?3:1.3):0,
  make:M=>{
    const me=tstats(M.team,true), en=tstats(sim.enemy.team,false), am=aliveCount("mine"), ae=aliveCount("enemy");
    const rw=recent(M.recentWin), rl=recent(M.recentLoss);
    const avg=(M.lanes.top.p+M.lanes.mid.p+M.lanes.bot.p)/3;
    const best=["top","mid","bot"].sort((a,b)=>M.lanes[b].p-M.lanes[a].p)[0];
    M.baronT=M.t+6;
    return {title:"Barón libre",
      show:()=>{ mark([120,120],"Barón disponible"); mark(clashPt(best),`Push en ${best}`,"mine"); },
      ctx:`El Barón está disponible. ${rw?"Tu equipo acaba de ganar una pelea.":rl?"Vienen de perder una pelea.":"Hace rato que nadie gana una pelea."} Oro ${goldTxt()}, vivos ${am} contra ${ae}.`,
      opts:[
      {label:"Hacer Barón",desc:"Tirarlo rápido antes de que lleguen.",
       p:sig(-.5+M.gold/2500+(rw?1.4:0)-(rl?1.2:0)+(me.dps-en.dps)*.3+(am-ae)*.6),
       at:()=>{ groupTo("mine",[118,120]); return [118,120]; },
       ok:()=>{ baron("mine"); return "Barón para tu equipo: con el buff, las torres caen solas."; },
       big:true,
       fail:()=>{ baron("enemy"); teamKills("enemy",3); M.recentLoss=M.t; const t=tower("enemy"); return `El rival llega a tiempo, roba el Barón, mata a tres y enseguida tira ${t}.`; }},
      {label:`Empujar torres en ${best}`,desc:"Ignorar el Barón y convertir la ventaja en estructuras.",
       p:sig(.2+avg+(me.S+me.K)*.15),
       at:()=>clashPt(best),
       ok:()=>{ const t=tower("mine",best); return `Tu equipo presiona ${best} y tira ${t}.`; },
       fail:()=>{ teamKills("enemy",1); return `El rival defiende ${best} y atrapa a uno de los tuyos.`; }}]};
  }},
{ id:"assassin",
  w:M=>M.t>=8&&M.team.some((c,i)=>has(c,"A")&&alive("mine",i))&&alive("enemy",3)?1.1:0,
  make:M=>{
    const ai=M.team.findIndex((c,i)=>has(c,"A")&&alive("mine",i)), a=champ("mine",ai), adc=champ("enemy",3), sup=champ("enemy",4);
    const near=alive("enemy",4)&&Math.random()<.55;
    const peel=near?(has(sup,"P")||has(sup,"H")?.7:0)+sup.tank*.2:0;
    return {title:"Carry rival a la vista",
      show:()=>{
        const f=M.lanes.bot.p<0?.42:.74, adcPt=along(PATHS.bot,f);
        moveTo("enemy",3,adcPt);
        if(alive("enemy",4)) moveTo("enemy",4,near?[adcPt[0]+14,adcPt[1]+12]:[255,105]);
        hl("enemy",3); hl("mine",ai);
        mark(adcPt,M.lanes.bot.p<0?`${adc.name} adelantado`:`${adc.name} junto a su torre`,"enemy");
        if(!near&&alive("enemy",4)) mark([255,105],`${sup.name} wardeando`);
        arrow(posOf("mine",ai),adcPt); },
      ctx:`${adc.name} (${kd("enemy",3)}) farmea ${M.lanes.bot.p<0?"adelantado en bot":"cerca de su torre"} y está ${hpTxt(M.ch.enemy[3].hp)}. ${near?`${sup.name} está a su lado.`:`${sup.name} se fue a wardear lejos.`} ${a.name} va ${kd("mine",ai)}.`,
      opts:[
      {label:`${a.name} va solo por ${adc.name}`,desc:"Entrar, borrar al carry y salir.",
       p:sig(-.2+form("mine",ai)*.8+(phaseVal(a,M.t)-2)*.4-peel-form("enemy",3)*.3+(1-M.ch.enemy[3].hp)*.8),
       at:()=>{ const pt=posOf("enemy",3); moveTo("mine",ai,[pt[0]+12,pt[1]-12]); return pt; },
       ok:()=>{ kill("mine",3,ai); if(!near&&Math.random()<.3) kill("mine",4,ai); return `${a.name} encuentra a ${adc.name} y lo borra antes de que reaccione.`; },
       fail:()=>{ kill("enemy",ai); return `${a.name} entra pero ${near?sup.name+" lo frena":adc.name+" sobrevive"} y termina muerto.`; }},
      {label:"Esperar con el equipo",desc:"Guardar al asesino para la próxima pelea.",
       p:sig(.3+tfIndex()*.5),
       at:null,
       ok:()=>{ M.gold+=200; return `${a.name} se queda con el equipo y suma presión en el mapa.`; },
       fail:()=>{ M.gold-=300; return `${adc.name} farmea tranquilo y sigue escalando.`; }}]};
  }},
{ id:"split",
  w:M=>M.t>=18&&M.team.some((c,i)=>has(c,"S")&&alive("mine",i))?1:0,
  make:M=>{
    const si=M.team.findIndex((c,i)=>has(c,"S")&&alive("mine",i)), s=champ("mine",si);
    const L=["top","bot"].sort((a,b)=>M.lanes[b].p-M.lanes[a].p)[0];
    const en=tstats(sim.enemy.team,false);
    return {title:"Presión lateral",
      show:()=>{ stageLane(L); const t=along(PATHS[L],.8); hl("mine",si); mark(t,`Split en ${L}`,"mine"); arrow(posOf("mine",si),t); },
      ctx:`${s.name} (${kd("mine",si)}) puede irse a ${L}, que está ${laneTxt(M.lanes[L].p)}. El rival ${en.G?"tiene ultis globales para responder":"no tiene cómo llegar rápido"}.`,
      opts:[
      {label:`${s.name} hace split en ${L}`,desc:"Uno presiona el lateral y el resto aguanta en mid.",
       p:sig(-.1+form("mine",si)*.6+(phaseVal(s,M.t)-2)*.4+M.lanes[L].p*.8-en.G*.35),
       at:()=>{ const pt=along(PATHS[L],.85); moveTo("mine",si,pt); return pt; },
       ok:()=>{ const t=tower("mine",L); push(L,.3); return `${s.name} gana el duelo lateral y tira ${t}.`; },
       fail:()=>{ kill("enemy",si); const t=tower("enemy","mid"); return `Atrapan a ${s.name} en ${L} y, con uno menos, cae ${t} de tu lado.`; }},
      {label:"Agruparse en mid",desc:"Los cinco juntos para forzar algo.",
       p:sig(tfIndex()*.8+.1),
       at:()=>{ groupTo("mine",[190,210]); return [190,210]; },
       ok:()=>{ const t=tower("mine","mid"); return `Agrupados presionan mid y cae ${t}.`; },
       fail:()=>{ const n=teamKills("enemy",1+Math.floor(Math.random()*3)); const g=n>=2?aftermath("enemy",1):""; return `El rival gana el choque en mid${g?` y tira ${g}`:""}.`; }}]};
  }},
{ id:"backdoor",
  w:M=>M.t>=24&&inhibsDown("enemy")&&M.team.some((c,i)=>(has(c,"S")||has(c,"G"))&&alive("mine",i))?.7:0,
  make:M=>{
    const si=M.team.findIndex((c,i)=>(has(c,"S")||has(c,"G"))&&alive("mine",i)), s=champ("mine",si), down=sum(M.tw.enemy);
    return {title:"Base expuesta",
      show:()=>{ const far=along(PATHS.bot,.3); groupTo("enemy",far); mark(far,"Rival ocupado","enemy");
        hl("mine",si); mark([352,48],"Nexo rival"); arrow(posOf("mine",si),[352,48]); },
      ctx:`El rival está ocupado del otro lado del mapa. Tiene un inhibidor caído, le quedan ${M.nexusT.enemy} torres del nexo y ${s.name} (${kd("mine",si)}) está libre.`,
      opts:[
      {label:`Backdoor con ${s.name}`,desc:"Ir directo al nexo mientras nadie mira.",
       p:sig(-1.6+down*.15-M.nexusT.enemy*.3+form("mine",si)*.5+(has(s,"S")?.4:0)+(has(s,"G")?.3:0)),
       at:()=>{ moveTo("mine",si,[338,62]); return [338,62]; },
       ok:()=>{ M.nexusT.enemy=0; drawStructs(); endGame(true,"backdoor"); return `¡${s.name} tira las torres del nexo y el nexo sin que nadie lo vea! Backdoor.`; },
       fail:()=>{ kill("enemy",si); if(Math.random()<.5) drake("enemy"); return `Los atrapan a mitad de camino: ${s.name} muere y el rival aprovecha.`; }},
      {label:"Volver a defender",desc:"Sumarse al equipo por si el rival fuerza.",
       p:sig(tfIndex()*.6+.2),
       at:()=>{ groupTo("mine",[175,225]); return [175,225]; },
       ok:()=>{ M.gold+=200; return "Tu equipo se reagrupa a tiempo y el rival no encuentra nada."; },
       fail:()=>{ const t=tower("enemy"); return `El rival fuerza igual y tira ${t}.`; }}]};
  }},
{ id:"build",
  w:M=>M.t>=10&&M.t<=28&&!M.built&&M.team.some(c=>c.dmg==="M")?.9:0,
  make:M=>{
    const hy=M.team.map((c,i)=>[c,i]).filter(([c])=>c.dmg==="M"), [c,i]=rnd(hy);
    const me=tstats(M.team,true), apShare=me.ap/(me.ad+me.ap||1), to=apShare<.5?"AP":"AD";
    const t2=M.team.slice(); t2[i]={...c,dmg:to}; const delta=analyze(t2).score-analyze(M.team).score;
    return {title:"Ajuste de build",
      show:()=>{ hl("mine",i); mark(posOf("mine",i),`${c.name}: ¿cambiar build?`,"mine"); },
      ctx:`Tu equipo pega ${Math.round((1-apShare)*100)}% físico y el rival empezó a comprar ${apShare<.5?"armadura":"resistencia mágica"}. ${c.name} (${kd("mine",i)}) puede cambiar de build.`,
      opts:[
      {label:`Pasar a ${c.name} a full ${to}`,desc:"Vender y rearmar con el otro tipo de daño.",
       p:sig(delta*.4+.1),
       at:()=>M.pos?.mine?.[i]||null,
       ok:()=>{ M.team[i]={...M.team[i],dmg:to}; M.built=true; M.myScore=analyze(M.team).score;
                return `Con la build ${to}, ${c.name} obliga al rival a repartir resistencias.`; },
       fail:()=>{ M.team[i]={...M.team[i],dmg:to}; M.built=true; M.myScore=analyze(M.team).score; M.gold-=400;
                return `El cambio a ${to} le cuesta oro a ${c.name} y no pega como esperaban.`; }},
      {label:"Mantener la build",desc:"No tocar nada y apostar a lo que ya funciona.",
       p:sig(-delta*.4+.2),
       at:null,
       ok:()=>{ M.built=true; M.gold+=150; return `${c.name} completa su build original y rinde igual.`; },
       fail:()=>{ M.built=true; M.gold-=300; return `Las resistencias del rival le apagan el daño a ${c.name}.`; }}]};
  }},
{ id:"laneswap",
  w:M=>M.t>=3&&M.t<=10&&!M.swapped?.9:0,
  make:M=>{
    const lanesIdx=[0,2,3,4], score=i=>affinity(M.team[i],i)+form("mine",i);
    const xi=lanesIdx.sort((a,b)=>score(a)-score(b))[0], x=champ("mine",xi), L=LANE_OF[xi];
    let best=null;
    [0,1,2,3,4].filter(j=>j!==xi).forEach(j=>{ const t=M.team.slice(); [t[xi],t[j]]=[t[j],t[xi]]; const d=analyze(t).score-M.myScore; if(!best||d>best.d) best={j,d}; });
    const y=champ("mine",best.j);
    return {title:"Línea complicada",
      show:()=>{ stageLane(L); hl("mine",xi); hl("mine",best.j); mark(clashPt(L),`${L}: ${laneLabel(M.lanes[L].p)}`,"enemy");
        if(alive("mine",1)) arrow(posOf("mine",1),clashPt(L)); },
      ctx:`${x.name} va ${kd("mine",xi)} en ${L} y la línea está ${laneTxt(M.lanes[L].p)}.`,
      opts:[
      {label:`Cambiar de línea con ${y.name}`,desc:"Intercambiar posiciones para buscar otro enfrentamiento.",
       p:sig(best.d/3-(M.t>7?.3:0)),
       at:()=>clashPt(L),
       ok:()=>{ swapLanes(xi,best.j); push(L,.2); return `${x.name} y ${y.name} cambian de línea y los dos encuentran mejores matchups.`; },
       fail:()=>{ swapLanes(xi,best.j); push(L,-.3); return `El cambio de ${x.name} y ${y.name} deja a los dos incómodos en líneas que no dominan.`; }},
      {label:"Aguantar y pedir ayuda al jungla",desc:"Jugar seguro hasta que llegue el gank.",
       p:sig(.1+form("mine",1)*.6+M.lanes[L].p*.6+(alive("mine",1)?.2:-.6)),
       at:()=>{ const pt=clashPt(L); if(alive("mine",1)) moveTo("mine",1,pt); return pt; },
       ok:()=>{ const v=aliveIn("enemy",L); if(v.length) kill("mine",v[0],1); push(L,.35); M.swapped=true; return `El jungla llega a ${L} y la línea se da vuelta.`; },
       fail:()=>{ kill("enemy",xi); if(alive("mine",1)&&Math.random()<.5) kill("enemy",1); push(L,-.2); M.swapped=true; return `El gank llega tarde y ${x.name} vuelve a morir.`; }}]};
  }},
{ id:"defend",
  w:M=>M.t>=18&&sum(M.tw.mine)>=4?1.4:0,
  make:M=>{
    const L=["top","mid","bot"].sort((a,b)=>M.tw.mine[b]-M.tw.mine[a])[0];
    const me=tstats(M.team,true), en=tstats(sim.enemy.team,false), eb=M.baron&&M.baron.side==="enemy"&&M.baron.until>=M.t;
    return {title:"Asedio a tu base",
      show:()=>{ const sp=onLane("mine",L,Math.max(.14,TOWER_F[Math.min(M.tw.mine[L],2)]+.04)); groupTo("enemy",sp);
        LANES[L].forEach((i,k)=>{ if(alive("mine",i)) moveTo("mine",i,onLane("mine",L,Math.max(.09,TOWER_F[Math.min(M.tw.mine[L],2)]-.03)+k*.02)); });
        [0,1,2,3,4].forEach(i=>alive("enemy",i)&&hl("enemy",i)); mark(sp,`Asedio en ${L}${eb?" (Barón)":""}`,"enemy"); },
      ctx:`El rival asedia ${L}${eb?" con el buff de Barón":""}. Perdiste ${sum(M.tw.mine)} torres; vivos ${aliveCount("mine")} contra ${aliveCount("enemy")}.`,
      opts:[
      {label:"Defender bajo torre",desc:"Aguantar con las torres y castigar al que entre.",
       p:sig((me.K-en.K)*.2+(me.cc-en.cc)*.06+(M.t>=28?(me.pl-en.pl)*.15:0)-(eb?1:0)+(aliveCount("mine")-aliveCount("enemy"))*.5),
       at:()=>{ groupTo("mine",along(PATHS[L],.2)); return along(PATHS[L],.25); },
       ok:()=>{ const n=teamKills("mine",2); return `La defensa aguanta: ${n} rivales caen bajo tu torre.`; },
       big:true,
       fail:()=>{ teamKills("enemy",3); M.recentLoss=M.t; const g=aftermath("enemy"); return `El rival rompe la defensa en ${L}, mata a tres y se lleva ${g}.`; }},
      {label:"Contraatacar en otra línea",desc:"Ignorar el asedio y presionar del otro lado.",
       p:sig((me.S+me.G)*.35+(M.lanes.top.p+M.lanes.bot.p)*.4-.3),
       at:()=>clashPt(L==="top"?"bot":"top"),
       ok:()=>{ const t=tower("mine",L==="top"?"bot":"top"); return `Mientras el rival asedia, tu equipo tira ${t}.`; },
       fail:()=>{ const a=tower("enemy",L), b=tower("enemy",L); return `El contraataque no alcanza: el rival tira ${a} y ${b}.`; }}]};
  }},
{ id:"fed",
  w:M=>[0,1,2,3,4].some(i=>{ const c=M.ch.enemy[i]; return c.k-c.d>=4&&!c.dead; })?1.3:0,
  make:M=>{
    const xi=[0,1,2,3,4].filter(i=>!M.ch.enemy[i].dead).sort((a,b)=>(M.ch.enemy[b].k-M.ch.enemy[b].d)-(M.ch.enemy[a].k-M.ch.enemy[a].d))[0];
    const x=champ("enemy",xi), me=tstats(M.team,true), en=tstats(sim.enemy.team,false);
    return {title:"Rival desatado",
      show:()=>{ hl("enemy",xi); mark(posOf("enemy",xi),`${x.name} ${kd("enemy",xi)}`,"enemy"); },
      ctx:`${x.name} rival va ${kd("enemy",xi)} y está decidiendo las peleas.`,
      opts:[
      {label:`Focalizar a ${x.name}`,desc:"Todo el control y el daño a un solo objetivo.",
       p:sig((me.cc-en.cc)*.08+me.E*.3+me.A*.2-form("enemy",xi)*.5+.2),
       at:()=>{ groupTo("mine",[200,215]); return [210,200]; },
       ok:()=>{ kill("mine",xi); const n=1+teamKills("mine",1+(Math.random()<.5?1:0)); const g=n>=3?aftermath("mine",1):""; return `Lo atrapan entre todos: ${x.name} cae primero y la pelea se da vuelta${g?`; tu equipo tira ${g}`:""}.`; },
       big:true,
       fail:()=>{ teamKills("enemy",3); M.recentLoss=M.t; const g=aftermath("enemy"); return `${x.name} esquiva el control, limpia la pelea y el rival se lleva ${g}.`; }},
      {label:`Jugar lejos de ${x.name}`,desc:"Farmear el otro lado del mapa y esperar el error.",
       p:sig(.2+me.K*.2+me.S*.2-(M.t>25?.4:0)),
       at:null,
       ok:()=>{ M.gold+=300; return `Tu equipo farmea donde ${x.name} no está y achica la diferencia.`; },
       fail:()=>{ const t=tower("enemy",LANE_OF[xi]); return `${x.name} aprovecha el espacio y tira ${t}.`; }}]};
  }},
];

/* ---------- Mapa ---------- */
function mapBaseSVG(){
  return `<defs><marker id="arrowhead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#f0e6d2"/></marker>
    <linearGradient id="grass2" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#10291f"/><stop offset="1" stop-color="#1a1f2e"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#grass2)"/>
    <path d="M0 40 L40 0 L400 360 L360 400 Z" fill="#123a4f" opacity=".75"/>
    <g stroke="#6b5a3a" stroke-width="16" fill="none" stroke-linecap="round" opacity=".85">
      <path d="M40 360 L40 40 L360 40"/><path d="M40 360 L360 360 L360 40"/><path d="M50 350 L350 50"/></g>
    <circle cx="26" cy="374" r="34" fill="#0d3a5c" stroke="#0ac8b9" stroke-width="2"/>
    <circle cx="374" cy="26" r="34" fill="#4a1622" stroke="#e84057" stroke-width="2"/>
    <circle cx="120" cy="120" r="9" fill="#7b5cc7"/><circle cx="280" cy="280" r="9" fill="#d9813b"/>
    <text class="pit" x="120" y="146" text-anchor="middle">Barón</text><text class="pit" x="280" y="306" text-anchor="middle">Dragón</text>`;
}
// Posición de cada estructura sobre el camino de su línea (0 = base propia, 1 = base rival)
const TOWER_F=[.36,.24,.13], INHIB_F=.065;
const NEXUS_T={mine:[[52,324],[76,348]],enemy:[[324,52],[348,76]]};
const onLane=(s,L,f)=>along(PATHS[L],s==="mine"?f:1-f);
function drawStructs(){
  const g=document.getElementById("structs"), M=sim.match; if(!g||!M) return;
  const sq=([x,y],r,cls,rot)=>`<rect class="st ${cls}" x="${x-r}" y="${y-r}" width="${r*2}" height="${r*2}"${rot?` transform="rotate(45 ${x} ${y})"`:""}/>`;
  g.innerHTML=["mine","enemy"].map(s=>{
    let h="";
    for(const L of ["top","mid","bot"]){
      TOWER_F.forEach((f,k)=>{ h+=sq(onLane(s,L,f),4.5,`${s}${M.tw[s][L]>k?" down":""}`); });
      h+=sq(onLane(s,L,INHIB_F),5,`inhib ${s}${inhibDown(s,L)?" down":""}`,true);
    }
    NEXUS_T[s].forEach((pt,k)=>{ h+=sq(pt,4.5,`${s}${M.nexusT[s]<=k?" down":""}`); });
    return h;
  }).join("");
}
function tokSVG(c,side,i){
  const col=side==="mine"?"#0ac8b9":"#e84057";
  return `<g class="tok" id="tk-${side}-${i}">
    <circle class="halo" r="20"/>
    <circle r="15" fill="#08121f"/>
    <clipPath id="tc-${side}-${i}"><circle r="13"/></clipPath>
    <text y="4" text-anchor="middle" style="font:700 10px Cinzel,serif;fill:#f0e6d2">${initials(c.name)}</text>
    <image href="${faceUrl(c)}" ${imgAttrs(c)} x="-15" y="-15" width="30" height="30" clip-path="url(#tc-${side}-${i})" preserveAspectRatio="xMidYMid slice"/>
    <circle r="14.5" fill="none" stroke="${col}" stroke-width="2.5"/>
  </g>`;
}
function moveTo(s,i,[x,y]){
  const M=sim.match; if(M){ M.pos=M.pos||{mine:[],enemy:[]}; M.pos[s][i]=[x,y]; }
  const el=document.getElementById(`tk-${s}-${i}`); if(el) el.style.transform=`translate(${x}px,${y}px)`;
}
function groupTo(s,[x,y]){ for(let i=0;i<5;i++) if(alive(s,i)) moveTo(s,i,[x+Math.cos(i*1.26)*17,y+Math.sin(i*1.26)*17]); }
// Posición de un jugador de línea justo detrás de su oleada
function lanerPt(s,i){
  const L=LANE_OF[i], f=frontF(sim.match.lanes[L].p)+(s==="mine"?-1:1)*(i===4?.03:.05);
  const [x,y]=along(PATHS[L],f), k=i===4?7:0;
  return [x+k,y-k];
}
function drawWaves(){
  const g=document.getElementById("waves"), M=sim.match; if(!g) return;
  g.innerHTML=["top","mid","bot"].map(L=>{
    const p=M.lanes[L].p, cls=p>.15?"mine":p<-.15?"enemy":"even", f=frontF(p);
    return [-.018,0,.018].map(d=>{ const [x,y]=along(PATHS[L],f+d); return `<circle class="wave ${cls}" cx="${x}" cy="${y}" r="3"/>`; }).join("");
  }).join("");
}
function layout(){
  const M=sim.match;
  drawWaves();
  if(Math.random()<.35) M.jg.mine=rnd(JG_SPOTS);
  if(Math.random()<.35){ const p=rnd(JG_SPOTS); M.jg.enemy=[400-p[1],400-p[0]]; }
  ["mine","enemy"].forEach(s=>{
    for(let i=0;i<5;i++){
      const c=M.ch[s][i], el=document.getElementById(`tk-${s}-${i}`); if(!el) continue;
      el.classList.toggle("dead",gone(c));
      let pt;
      if(gone(c)) pt=[BASE[s][0]+(i-2)*7,BASE[s][1]+((i%2)?6:-6)];
      else if(i===1) pt=M.jg[s];
      else pt=lanerPt(s,i);
      moveTo(s,i,[pt[0]+(Math.random()-.5)*8,pt[1]+(Math.random()-.5)*8]);
    }
  });
}
/* ---------- Foco de la decisión ----------
   Mientras la carta está abierta el mapa muestra lo mismo que dice el texto:
   quién está dónde, qué línea está empujada y qué objetivo está en juego. */
const posOf=(s,i)=>sim.match.pos?.[s]?.[i]||BASE[s];
const svgTxt=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function mark([x,y],label,side){
  const g=document.getElementById("focus"); if(!g) return;
  const hw=String(label).length*3.3+4, lx=clamp(x,hw,400-hw), ly=y<60?y+38:y-28;
  g.insertAdjacentHTML("beforeend",`<g class="fmark ${side||""}"><circle class="fring" cx="${x}" cy="${y}" r="24"/>
    <text x="${lx}" y="${ly}" text-anchor="middle">${svgTxt(label)}</text></g>`);
}
function arrow(a,b,side){
  const g=document.getElementById("focus"); if(!g||!a||!b) return;
  const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1, r=20, ux=(b[0]-a[0])/d, uy=(b[1]-a[1])/d;
  g.insertAdjacentHTML("afterbegin",`<line class="farrow ${side||""}" x1="${a[0]+ux*r}" y1="${a[1]+uy*r}" x2="${b[0]-ux*r}" y2="${b[1]-uy*r}" marker-end="url(#arrowhead)"/>`);
}
function hl(s,i){ const el=document.getElementById(`tk-${s}-${i}`); if(el) el.classList.add("focus"); }
function clearFocus(){
  const g=document.getElementById("focus"); if(g) g.innerHTML="";
  document.querySelectorAll(".tok.focus").forEach(e=>e.classList.remove("focus"));
}
// Ubica a los jugadores de una línea frente a su oleada (sin el desorden del tick)
function stageLane(L){ ["mine","enemy"].forEach(s=>LANES[L].forEach(i=>{ if(alive(s,i)) moveTo(s,i,lanerPt(s,i)); })); }
// Un punto de la jungla al costado de una línea, hacia el centro del mapa
function jgNear(L){ const [x,y]=clashPt(L); return [x+(200-x)*.32,y+(200-y)*.32]; }
const laneLabel=p=>p>.5?"dominando":p>.15?"con ventaja":p>-.15?"pareja":p>-.5?"en desventaja":"bajo tu torre";

function ping([x,y],ok){
  const g=document.getElementById("pings"); if(!g) return;
  g.insertAdjacentHTML("beforeend",`<circle class="ping ${ok?"ok":"bad"}" cx="${x}" cy="${y}" r="10"/>`);
  setTimeout(()=>{ if(g.firstElementChild) g.firstElementChild.remove(); },1400);
}
function logLine(t,ok){
  const l=document.getElementById("playlog"); if(!l) return;
  l.insertAdjacentHTML("afterbegin",`<li class="${ok===true?"ok":ok===false?"bad":""}"><span class="tm">${sim.match.t}'</span>${t}</li>`);
  while(l.children.length>14) l.lastElementChild.remove();
}
function sbHTML(){
  return ["mine","enemy"].map(s=>`<div class="sb-col ${s}">${[0,1,2,3,4].map(i=>{ const c=champ(s,i);
    return `<div class="sb-row" id="sb-${s}-${i}">${faceHTML(c)}<span class="sb-name">${c.name}</span><span class="sb-kd" id="kd-${s}-${i}">0/0</span><span class="sb-hp"><i id="hp-${s}-${i}"></i></span></div>`; }).join("")}</div>`).join("");
}
function hud(){
  const M=sim.match, $=id=>document.getElementById(id);
  if(!$("clock")) return;
  $("clock").textContent=String(M.t).padStart(2,"0")+":00";
  $("hk").textContent=`${M.kills.mine} – ${M.kills.enemy}`;
  $("ht").textContent=`${sum(M.tw.enemy)} – ${sum(M.tw.mine)}`;
  $("hi").textContent=`${inhibsDown("enemy")} – ${inhibsDown("mine")}`;
  $("hd").textContent=`${M.dr.mine}${M.soul==="mine"?" (Alma)":""} – ${M.dr.enemy}${M.soul==="enemy"?" (Alma)":""}`;
  $("he").textContent=buffOn(M.elder)?(M.elder.side==="mine"?"tuyo":"rival"):"–";
  $("hev").textContent=`${M.evDone}/${M.evMax}`;
  $("hg").textContent=Math.abs(M.gold)<100?"parejo":`${M.gold>0?"+":"−"}${(Math.abs(M.gold)/1000).toFixed(1)}k`;
  $("hb").textContent=buffOn(M.baron)?(M.baron.side==="mine"?"tuyo":"rival"):"–";
  $("tug").style.width=(sig(winIndex())*100)+"%";
  ["mine","enemy"].forEach(s=>M.ch[s].forEach((c,i)=>{
    $(`kd-${s}-${i}`).textContent=`${c.k}/${c.d}`;
    $(`hp-${s}-${i}`).style.width=(gone(c)?0:c.hp*100)+"%";
    $(`sb-${s}-${i}`).classList.toggle("dead",gone(c));
    $(`kd-${s}-${i}`).textContent=c.afk?"AFK":`${c.k}/${c.d}`;
  }));
}
function swapLanes(a,b){
  const M=sim.match;
  [M.team[a],M.team[b]]=[M.team[b],M.team[a]];
  [M.ch.mine[a],M.ch.mine[b]]=[M.ch.mine[b],M.ch.mine[a]];
  const ea=document.getElementById(`tk-mine-${a}`), eb=document.getElementById(`tk-mine-${b}`);
  ea.id=`tk-mine-${b}`; eb.id=`tk-mine-${a}`;
  document.getElementById("sb").innerHTML=sbHTML();
  M.myScore=analyze(M.team).score; M.swapped=true;
}

/* ---------- Eventos espontáneos ----------
   Pasan solos, sin carta de decisión. Cada uno se sortea una vez por partida con su probabilidad
   (entre 5% y 25%) y, si sale, ocurre en un minuto al azar dentro de su ventana. */
const RANDOM_EVENTS=[
  {id:"fedMine",  p:.18, from:5,  to:20, can:M=>aliveCount("mine")>=3,  fire:M=>fedCarry("mine")},
  {id:"fedEnemy", p:.18, from:5,  to:20, can:M=>aliveCount("enemy")>=3, fire:M=>fedCarry("enemy")},
  {id:"afk",      p:.05, from:4,  to:24, can:M=>aliveCount("mine")>=4,  fire:M=>afkAlly()},
  {id:"backdoor", p:.07, from:24, to:42, can:M=>true,                   fire:M=>spontaneousBackdoor(Math.random()<.5?"mine":"enemy")}
];
function rollRandomEvents(){
  return RANDOM_EVENTS.filter(e=>Math.random()<e.p).map(e=>({e,at:e.from+Math.floor(Math.random()*(e.to-e.from+1))}));
}
function randomEvents(){
  const M=sim.match;
  M.rand=M.rand.filter(r=>{
    if(M.over||M.t<r.at) return true;
    if(M.t>r.e.to+8) return false;           // se pasó la ventana: no ocurre
    if(!r.e.can(M)) return true;              // espera al próximo minuto
    r.e.fire(M); return false;
  });
}
// Un jugador encadena kills en su línea y queda carreando ~10 minutos
function fedCarry(side){
  const M=sim.match, cand=[0,2,3,1,4].filter(i=>alive(side,i));
  const i=cand.find(j=>j!==4&&Math.random()<.5)??cand[0], c=champ(side,i), L=LANE_OF[i]||rnd(["top","mid","bot"]);
  let n=0; for(let k=0;k<4;k++){ const v=aliveIn(other(side),L).concat([0,1,2,3,4].filter(j=>alive(other(side),j))); if(v.length&&kill(side,v[0],i)) n++; }
  M.carry={side,i,until:M.t+10};
  ping(posOf(side,i),side==="mine");
  logLine(`${side==="mine"?"":"¡Cuidado! "}${c.name} ${side==="mine"?"se pone las botas":"rival se feedea"}: ${n} kills seguidas y empieza a carrear la partida.`,side==="mine");
}
function afkAlly(){
  const M=sim.match, cand=[0,1,2,3,4].filter(i=>alive("mine",i)), i=rnd(cand), c=M.ch.mine[i];
  c.afk=3+Math.floor(Math.random()*4);
  logLine(`${champ("mine",i).name} se desconecta: tu equipo juega ${c.afk} minutos con uno menos.`,false);
}
// Un split pusher se mete a la base sin que nadie lo vea. Solo puede terminar la partida si hay un inhibidor caído.
function spontaneousBackdoor(side){
  const M=sim.match, d=other(side);
  const cand=[0,1,2,3,4].filter(i=>alive(side,i)).sort((a,b)=>(has(champ(side,b),"S")+has(champ(side,b),"G"))-(has(champ(side,a),"S")+has(champ(side,a),"G")));
  if(!cand.length) return;
  const i=cand[0], name=champ(side,i).name, who=side==="mine"?`Tu ${name}`:`${name} rival`;
  if(inhibsDown(d)){
    M.nexusT[d]=0; drawStructs();
    logLine(`${who} se mete por la base vacía: ¡backdoor espontáneo!`,side==="mine");
    endGame(side==="mine","backdoor");
  } else {
    const a=tower(side), b=tower(side);
    logLine(`${who} intenta un backdoor: no llega al nexo pero tira ${a} y ${b}.`,side==="mine");
  }
}

/* ---------- Plan de la partida ----------
   Cuanto menos chances tiene tu equipo, más decisiones aparecen (de 2 a 10).
   Cada decisión acertada suma "edge" y cada error resta. El tamaño del paso se calcula
   para que, en la partida más difícil, solo acertando las 10 se dé vuelta la diferencia. */
const MAX_EVENTS=10;
function matchPlan(my,en){
  const base=(my-en)/10, p0=sig(base);
  const evMax=clamp(Math.round(2+(1-p0)*8),2,MAX_EVENTS);
  const step=Math.max(.35,Math.max(0,-base)*1.6/evMax+.15);
  return {evMax,step,evGap:clamp(Math.round(28/evMax),3,9)};
}

/* ---------- Bucle de la partida ---------- */
function playRound(){
  if(sim.playing) return;
  sim.playing=true; sim.swap=false;
  document.querySelectorAll(".sim-actions .btn-big").forEach(b=>b.disabled=true);
  const mk=()=>Array.from({length:5},()=>({k:0,d:0,hp:1,dead:0}));
  const M=sim.match={team:sim.my.map(c=>({...c})),t:0,gold:0,paused:false,over:false,
    ch:{mine:mk(),enemy:mk()},lanes:{top:{p:0},mid:{p:0},bot:{p:0}},
    tw:{mine:{top:0,mid:0,bot:0},enemy:{top:0,mid:0,bot:0}},inhib:{mine:{top:0,mid:0,bot:0},enemy:{top:0,mid:0,bot:0}},nexusT:{mine:2,enemy:2},
    dr:{mine:0,enemy:0},soul:null,elder:null,carry:null,rand:rollRandomEvents(),kills:{mine:0,enemy:0},edge:0,evDone:0,nextFinal:0,
    baron:null,drakeT:5,baronT:20,evCount:{},lastEv:null,
    jg:{mine:JG_SPOTS[0],enemy:[400-JG_SPOTS[0][1],400-JG_SPOTS[0][0]]},recentWin:null,recentLoss:null,built:false,swapped:false};
  M.myScore=analyze(M.team).score;
  Object.assign(M,matchPlan(M.myScore,sim.enemy.score));
  M.nextEv=2+Math.floor(Math.random()*2);
  const area=document.getElementById("matchArea");
  area.innerHTML=`<div class="match">
    <div>
      <div class="match-map"><svg id="mmap" viewBox="0 0 400 400" aria-label="Partida en curso">${mapBaseSVG()}<g id="structs"></g><g id="waves"></g>
        ${M.team.map((c,i)=>tokSVG(c,"mine",i)).join("")}${sim.enemy.team.map((c,i)=>tokSVG(c,"enemy",i)).join("")}<g id="focus"></g><g id="pings"></g></svg></div>
      <div class="sb" id="sb">${sbHTML()}</div>
    </div>
    <div class="match-side">
      <div class="hud"><div class="clock" id="clock">00:00</div>
        <div class="hud-stats"><span>Kills <b id="hk">0 – 0</b></span><span>Torres <b id="ht">0 – 0</b></span><span>Inhibidores <b id="hi">0 – 0</b></span><span>Dragones <b id="hd">0 – 0</b></span><span>Oro <b id="hg">parejo</b></span><span>Barón <b id="hb">–</b></span><span>Ancestral <b id="he">–</b></span><span>Decisiones <b id="hev">0/${M.evMax}</b></span></div></div>
      <div class="tug"><span>Tu equipo</span><div class="tugbar"><i id="tug"></i></div><span>Rival</span></div>
      <div id="eventCard"></div>
      <ul id="playlog"></ul>
    </div></div>`;
  drawStructs(); layout(); hud();
  logLine("Bienvenidos a la Grieta del Invocador.",null);
  area.scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"start"});
  M.loop=setInterval(tick,TICK_MS);
}

function tick(){
  const M=sim.match; if(!M||M.paused||M.over) return;
  M.t++;
  ["mine","enemy"].forEach(s=>M.ch[s].forEach((c,i)=>{
    if(c.dead&&--c.dead===0) c.hp=1;
    if(c.afk&&--c.afk===0){ c.hp=1; logLine(`${champ(s,i).name} se reconecta y vuelve a la partida.`,s==="mine"); }
  }));
  randomEvents();
  if(M.over) return;
  // Inhibidores que reaparecen
  ["mine","enemy"].forEach(d=>["top","mid","bot"].forEach(L=>{
    if(inhibDown(d,L)&&M.t>=M.inhib[d][L]){ M.inhib[d][L]=0; drawStructs(); logLine(`Reaparece el inhibidor de ${L} ${d==="mine"?"de tu equipo":"del rival"}.`,d==="mine"); }
  }));
  // La diferencia de equipos y las decisiones tomadas inclinan las líneas
  const bias=.02*clamp(baseLogit()+M.edge,-3,3);

  // Fase de líneas
  for(const L of ["top","mid","bot"]){
    const ln=M.lanes[L], ma=aliveIn("mine",L), ea=aliveIn("enemy",L);
    if(!ma.length&&ea.length) push(L,-.25);
    else if(ma.length&&!ea.length) push(L,.25);
    else if(ma.length&&ea.length){
      const diff=ma.reduce((a,i)=>a+str("mine",i),0)/ma.length-ea.reduce((a,i)=>a+str("enemy",i),0)/ea.length;
      push(L,.07*diff+bias+(Math.random()-.5)*.25);
      ma.forEach(i=>{ const c=M.ch.mine[i]; c.hp=clamp(c.hp-Math.max(0,-ln.p)*.14-Math.random()*.05,.05,1); });
      ea.forEach(i=>{ const c=M.ch.enemy[i]; c.hp=clamp(c.hp-Math.max(0,ln.p)*.14-Math.random()*.05,.05,1); });
      [["mine",ma],["enemy",ea]].forEach(([s,a])=>a.forEach(i=>{ const c=M.ch[s][i]; if(c.hp<.22&&Math.random()<.5) c.hp=1; }));
      if(Math.random()<.035+Math.abs(ln.p)*.07){
        let w=ln.p>=0?"mine":"enemy"; if(Math.random()<.25) w=other(w);
        const vic=rnd(w==="mine"?ea:ma), kil=rnd(w==="mine"?ma:ea);
        if(kill(w,vic,kil)) logLine(`${champ(w,kil).name} mata a ${champ(other(w),vic).name} en ${L}.`,w==="mine");
      }
    }
    // Súper minions: con un inhibidor caído la línea empuja sola hacia esa base
    if(inhibDown("enemy",L)) push(L,.08);
    if(inhibDown("mine",L)) push(L,-.08);
    if(M.t>=8&&Math.abs(ln.p)>.75&&Math.random()<.16){
      const s=ln.p>0?"mine":"enemy", t=tower(s,L);
      logLine(`${s==="mine"?"Tu equipo":"El rival"} tira ${t}.`,s==="mine");
      if(M.over) return;
    }
  }
  // Ganks automáticos de los junglas
  if(Math.random()<.06){
    const s=Math.random()<sig(str("mine",1)-str("enemy",1))?"mine":"enemy", L=rnd(["top","mid","bot"]), v=aliveIn(other(s),L);
    if(alive(s,1)&&v.length&&Math.random()<.5&&kill(s,v[0],1)) logLine(`${champ(s,1).name} gankea ${L} y mata a ${champ(other(s),v[0]).name}.`,s==="mine");
  }
  M.gold+=(M.lanes.top.p+M.lanes.mid.p+M.lanes.bot.p)*50;
  // Barón y Ancestral: el equipo con el buff asedia y rompe estructuras rápido
  for(const [b,ch] of [[M.baron,.45],[M.elder,.3]]){
    if(!buffOn(b)) continue;
    ["top","mid","bot"].forEach(L=>push(L,sideVal(b.side,.12)));
    if(Math.random()<ch){ const t=tower(b.side); logLine(`${b.side==="mine"?"Tu equipo":"El rival"} asedia con el buff y tira ${t}.`,b.side==="mine"); if(M.over) return; }
  }
  // Ventaja numérica (después de una pelea): el que tiene más vivos convierte
  const nd=aliveCount("mine")-aliveCount("enemy");
  if(M.t>=8&&Math.abs(nd)>=3&&Math.random()<.6){
    const s=nd>0?"mine":"enemy", t=tower(s);
    logLine(`Con ${Math.abs(nd)} rivales muertos, ${s==="mine"?"tu equipo":"el rival"} tira ${t}.`,s==="mine");
    if(M.over) return;
  }
  // Objetivos que se resuelven solos si no hubo evento
  if(M.t>=M.drakeT){
    const ad=aliveCount("mine")-aliveCount("enemy");
    const s=Math.random()<sig((M.lanes.bot.p+M.lanes.mid.p)*.6+(str("mine",1)-str("enemy",1))*.25+M.gold/4000+ad*.4+M.edge*.3)?"mine":"enemy";
    const d=drake(s); logLine(`${s==="mine"?"Tu equipo":"El rival"} hace ${d}.`,s==="mine");
  }
  if(M.t>=M.baronT&&Math.abs(M.gold)>3000&&Math.random()<.3){
    const s=M.gold>0?"mine":"enemy"; baron(s);
    logLine(`${s==="mine"?"Tu equipo":"El rival"} hace Barón aprovechando la ventaja.`,s==="mine");
  }
  layout(); hud();
  if(M.over) return;
  // Cierre de la partida: la pelea decisiva llega cuando ya se jugaron todas las decisiones
  const done=M.evDone>=M.evMax;
  if(M.t>=M.nextFinal&&(M.t>=40||(done&&M.t>=22&&Math.random()<.025+(M.t-22)*.012+(inhibsDown("mine")+inhibsDown("enemy"))*.08))) return finalFight();
  // Eventos
  if(!done&&M.t>=M.nextEv) triggerEvent();
}

function triggerEvent(){
  const M=sim.match;
  const rep=M.evMax>=7?3:2;
  const pool=EVENTS.map(e=>[e,e.w(M)]).filter(([e,w])=>w>0&&e.id!==M.lastEv&&(M.evCount[e.id]||0)<rep);
  if(!pool.length){ M.nextEv=M.t+1; return; }
  let r=Math.random()*pool.reduce((a,[,w])=>a+w,0), ev=pool[0][0];
  for(const [e,w] of pool){ if((r-=w)<=0){ ev=e; break; } }
  M.lastEv=ev.id; M.evCount[ev.id]=(M.evCount[ev.id]||0)+1;
  const data=M.ev=ev.make(M);
  M.paused=true;
  drawWaves(); clearFocus(); if(data.show) data.show();
  const card=document.getElementById("eventCard");
  card.innerHTML=`<div class="event"><div class="ev-head"><b>${data.title}</b><span class="ev-n">Decisión ${M.evDone+1} de ${M.evMax}</span><div class="timer" title="Si no elegís a tiempo, el rival toma la iniciativa"><i></i></div></div>
    <p class="ev-ctx">${data.ctx}</p>
    <div class="ev-opts">${data.opts.map((o,j)=>`<button class="ev-opt" data-j="${j}"><strong>${o.label}</strong><small>${o.desc}</small></button>`).join("")}</div></div>`;
  card.querySelectorAll(".ev-opt").forEach(b=>b.onclick=()=>{ b.classList.add("chosen"); choose(data.opts[+b.dataset.j]); });
  card.querySelector(".ev-opt").focus({preventScroll:true});
  M.timer=setTimeout(()=>choose(null),12000);
}

function choose(opt){
  const M=sim.match; clearTimeout(M.timer);
  const card=document.getElementById("eventCard");
  card.querySelectorAll(".ev-opt").forEach(b=>b.disabled=true);
  const resume=()=>{ if(M.over) return; card.innerHTML=""; clearFocus(); M.nextEv=M.t+M.evGap+Math.floor(Math.random()*2); M.paused=false; };
  M.evDone++; M.ev=null;
  if(!opt){
    M.edge-=M.step*1.2; M.gold-=300; push(rnd(["top","mid","bot"]),-.2);
    logLine("Dudaron demasiado y el rival tomó la iniciativa.",false); hud();
    return setTimeout(resume,1200);
  }
  const pt=opt.at?opt.at():null;
  const ok=Math.random()<opt.p;
  // Las peleas grandes pesan más que una jugada chica, sobre todo si se pierden
  M.edge+=ok?M.step*(opt.big?1.15:1):-M.step*(opt.big?1.8:1.2);
  setTimeout(()=>{
    const txt=ok?opt.ok():opt.fail();
    ping(pt||[200,200],ok); logLine(txt,ok); hud();
    setTimeout(()=>{ if(!M.over){ layout(); resume(); } },1300);
  },reduceMotion()?100:900);
}

function finalFight(){
  const M=sim.match; if(M.over) return;
  M.paused=true;
  groupTo("mine",[188,214]); groupTo("enemy",[214,188]);
  const win=Math.random()<sig(winIndex()+tfIndex()*.5), s=win?"mine":"enemy";
  logLine(`Pelea decisiva en el minuto ${M.t}.`,null);
  setTimeout(()=>{
    ping([200,200],win);
    const n=teamKills(s,4+(Math.random()<.5?1:0)); teamKills(other(s),Math.random()<.4?1:0);
    // Después del minuto 40 la pelea decisiva alcanza para llegar al nexo desde cualquier punto
    const g=aftermath(s,M.t>=40?7:4);
    if(M.over) return;
    logLine(`${win?"Tu equipo":"El rival"} gana la pelea con ${n} kills y tira ${g}, pero el nexo sigue en pie.`,win);
    M.nextFinal=M.t+3; layout(); hud(); M.paused=false;
  },reduceMotion()?100:1200);
}

function endGame(win,how){
  const M=sim.match; if(M.over) return;
  M.over=true; M.paused=true; clearInterval(M.loop); clearTimeout(M.timer); clearFocus();
  if(how!=="backdoor") logLine(win?"Tu equipo rompe el nexo rival.":"El rival rompe tu nexo.",win);
  sim.history.push({round:sim.round,win,my:M.team.map(c=>({...c})),me:M.myScore,en:sim.enemy.score});
  setTimeout(()=>{ sim.playing=false; showOverlay(win,M.myScore,sim.enemy.score); },reduceMotion()?400:1500);
}

function showOverlay(win,a,b){
  const o=document.getElementById("overlay");
  o.className=win?"win":"lose"; o.hidden=false;
  const last=!win||sim.round===2;
  const sparks=win&&!reduceMotion()?Array.from({length:46},()=>{
    const ang=Math.random()*Math.PI*2, r=180+Math.random()*320;
    return `<i class="spark" style="--dx:${Math.cos(ang)*r}px;--dy:${Math.sin(ang)*r}px;animation-delay:${Math.random()*.25}s"></i>`;
  }).join(""):"";
  o.innerHTML=`<div class="rays"></div>${sparks}
    <div class="ov-card">
      <div class="ov-title">${win?"Victoria":"Derrota"}</div>
      <p>Ronda ${sim.round+1}: tu equipo ${a}, rival ${b}</p>
      <button class="btn-big primary" id="ovNext">${!win?"Ver estadísticas":last?"Ver resultado final":"Siguiente ronda"}</button>
    </div>`;
  const btn=document.getElementById("ovNext"); btn.focus();
  btn.onclick=()=>{
    o.hidden=true; o.innerHTML="";
    if(last) finishSim(); else { sim.round++; setupRound(); }
  };
}

// Al terminar (por derrota o tras la ronda 3) se actualiza la afinidad de cada campeón en la línea que jugó
function finishSim(){
  const rows=new Map();
  sim.history.forEach(h=>h.my.forEach((c,i)=>{
    const k=c.name+"@"+LANE_CODE[i];
    if(!rows.has(k)) rows.set(k,{c,i,before:affinity(c,i),w:0,l:0});
    h.win?rows.get(k).w++:rows.get(k).l++;
  }));
  rows.forEach((e,k)=>{
    const rec=AFF_LOG[k]||{w:0,l:0}; rec.w+=e.w; rec.l+=e.l; AFF_LOG[k]=rec;
    e.total=rec; e.after=affinity(e.c,e.i);
  });
  saveAff();
  sim.table=[...rows.values()].sort((a,b)=>a.i-b.i);
  sim.done=true; sim.match=null;
  renderSim();
  setTimeout(()=>{ const s=document.getElementById("stats"); if(s) s.scrollIntoView({behavior:reduceMotion()?"auto":"smooth",block:"start"}); },60);
}

function showView(v){
  document.getElementById("draftView").hidden=v!=="draft";
  document.getElementById("simView").hidden=v!=="sim";
  document.getElementById("tabDraft").setAttribute("aria-selected",v==="draft");
  document.getElementById("tabSim").setAttribute("aria-selected",v==="sim");
  window.scrollTo({top:0,behavior:"auto"});
}

if(typeof document!=="undefined"){
  document.getElementById("restart").addEventListener("click",()=>{ if(!spinning){ sim=null; newGame(); } });
  document.getElementById("rerollBtn").addEventListener("click",rerollAll);
  document.getElementById("tabDraft").addEventListener("click",()=>showView("draft"));
  document.getElementById("tabSim").addEventListener("click",()=>{ if(!sim) startSim(); else showView("sim"); });
  // No esperar más de 2,5 s al CDN: mientras tanto las imágenes salen de CommunityDragon
  Promise.race([initDD(),new Promise(r=>setTimeout(r,2500))]).finally(newGame);
}
