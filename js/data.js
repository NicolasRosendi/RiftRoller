/* Datos de campeones: nombre|daño|tanque|cc|early|mid|late|flags|winrate */
const RAW = `Aatrox|AD|2|2|3|3|2|EFS|50.2
Ahri|AP|0|2|2|3|2|AK|50.8
Akali|AP|0|1|2|3|2|A|49.0
Akshan|AD|0|0|3|3|2|AS|50.4
Alistar|U|3|3|2|3|2|EP|50.5
Ambessa|AD|1|2|3|3|2|SA|49.4
Amumu|AP|3|3|1|3|3|EF|51.3
Anivia|AP|0|2|1|2|3|KF|51.0
Annie|AP|0|3|2|3|2|EFA|51.2
Aphelios|AD|0|1|1|2|3|YD|49.0
Ashe|AD|0|2|2|2|2|KEP|50.8
Aurelion Sol|AP|0|2|1|2|3|FYK|50.5
Aurora|AP|0|2|2|3|2|AK|50.0
Azir|AP|0|2|1|2|3|YFK|47.5
Bard|U|1|2|2|3|2|PG|51.5
Bel'Veth|AD|1|1|1|2|3|YD|50.5
Blitzcrank|U|2|3|3|2|1|EA|50.8
Brand|AP|0|1|2|3|2|FK|50.5
Braum|U|3|3|2|2|2|P|50.4
Briar|AD|1|1|3|3|2|AE|50.6
Caitlyn|AD|0|1|3|2|2|KD|50.0
Camille|AD|1|2|2|3|2|SA|50.0
Cassiopeia|AP|0|2|1|2|3|DY|50.5
Cho'Gath|AP|3|3|1|2|3|FE|50.7
Corki|M|0|0|1|2|3|KD|49.6
Darius|AD|2|2|3|3|2|S|50.5
Diana|AP|1|2|2|3|2|EFA|50.8
Dr. Mundo|AD|3|1|1|2|3|S|50.9
Draven|AD|0|1|3|3|2|D|49.8
Ekko|AP|1|2|2|3|2|A|50.6
Elise|AP|1|2|3|2|1|A|50.0
Evelynn|AP|0|1|1|3|3|A|50.5
Ezreal|M|0|0|2|3|2|K|49.5
Fiddlesticks|AP|1|3|2|3|2|EF|51.0
Fiora|AD|1|1|2|3|3|S|50.3
Fizz|AP|0|1|2|3|2|A|50.8
Galio|AP|3|3|2|3|2|EFG|50.6
Gangplank|AD|0|1|1|2|3|GKS|49.3
Garen|AD|2|1|2|3|2|S|51.0
Gnar|AD|2|3|2|2|2|EFU|49.5
Gragas|AP|2|3|2|3|2|EP|50.2
Graves|AD|1|0|3|3|2|D|50.0
Gwen|AP|1|0|1|2|3|SD|50.4
Hecarim|AD|2|2|2|3|2|EF|50.5
Heimerdinger|AP|0|2|2|3|2|K|50.8
Hwei|AP|0|2|1|3|2|KF|49.5
Illaoi|AD|2|1|2|3|2|S|50.6
Irelia|AD|1|2|2|3|2|SD|49.8
Ivern|U|1|2|2|2|2|PH|50.9
Janna|U|0|3|1|2|2|PHU|50.9
Jarvan IV|AD|2|3|3|3|1|EFU|50.2
Jax|M|2|1|2|3|3|S|50.4
Jayce|AD|0|1|3|3|1|K|48.8
Jhin|AD|0|2|2|3|2|KD|51.2
Jinx|AD|0|2|1|2|3|YD|51.0
K'Sante|AD|3|3|2|3|2|EP|48.2
Kai'Sa|M|0|0|1|2|3|YDA|49.6
Kalista|AD|0|2|3|3|1|DU|48.5
Karma|AP|0|1|2|3|2|HK|49.8
Karthus|AP|0|1|1|2|3|GF|50.6
Kassadin|AP|0|1|1|2|3|AY|50.5
Katarina|AP|0|0|2|3|2|AF|50.3
Kayle|M|0|0|1|2|3|YH|50.8
Kayn|AD|1|1|2|3|3|A|50.2
Kennen|AP|1|3|2|3|2|EF|49.8
Kha'Zix|AD|0|0|2|3|2|A|50.8
Kindred|AD|0|1|2|3|3|DP|49.5
Kled|AD|2|1|3|3|2|E|50.8
Kog'Maw|M|0|1|1|2|3|YD|51.0
LeBlanc|AP|0|2|3|3|1|A|49.0
Lee Sin|AD|1|2|3|3|1|AU|48.5
Leona|U|3|3|3|3|1|E|50.4
Lillia|AP|1|2|2|3|2|F|50.6
Lissandra|AP|1|3|2|3|2|EF|50.5
Locke|AP|0|1|2|3|2|A|50.0
Lucian|AD|0|0|3|3|1|D|49.4
Lulu|U|0|2|2|2|2|HP|49.8
Lux|AP|0|2|2|3|2|K|50.5
Malphite|AP|3|3|1|3|2|EFU|51.5
Malzahar|AP|0|2|2|2|2|AK|51.0
Maokai|AP|3|3|2|3|2|EFP|51.0
Master Yi|AD|0|0|1|2|3|YD|50.6
Mel|AP|0|1|2|3|2|KP|49.5
Milio|U|0|1|1|2|3|HP|51.0
Miss Fortune|AD|0|1|3|3|2|FD|51.0
Mordekaiser|AP|2|1|2|3|2|SA|50.5
Morgana|AP|1|3|2|2|2|PF|50.8
Naafiri|AD|0|0|2|3|2|A|50.6
Nami|U|0|3|2|3|2|HP|51.2
Nasus|AD|2|1|1|2|3|S|51.0
Nautilus|U|3|3|3|3|1|E|50.6
Neeko|AP|1|3|2|3|2|EF|50.2
Nidalee|AP|0|1|3|2|1|KA|48.5
Nilah|AD|1|1|1|2|3|DF|51.0
Nocturne|AD|1|1|2|3|2|GAE|50.8
Nunu & Willump|AP|3|3|2|3|2|EF|50.6
Olaf|AD|2|0|3|3|1|S|50.3
Orianna|AP|0|3|1|3|3|FPK|49.4
Ornn|M|3|3|2|3|3|EFU|50.0
Pantheon|AD|1|2|3|3|1|AG|50.0
Poppy|AD|3|3|2|3|2|EP|50.8
Pyke|AD|0|2|3|3|1|A|49.5
Qiyana|AD|0|3|2|3|2|AF|49.0
Quinn|AD|0|1|3|3|1|SG|51.0
Rakan|U|1|3|2|3|2|EFU|50.0
Rammus|M|3|3|2|3|2|E|51.0
Rek'Sai|AD|1|2|3|3|1|AEU|50.0
Rell|U|3|3|2|3|2|EF|50.5
Renata Glasc|U|0|2|1|2|2|PH|49.5
Renekton|AD|2|1|3|3|1|S|49.6
Rengar|AD|0|1|2|3|2|A|49.8
Riven|AD|1|2|2|3|2|SU|50.2
Rumble|AP|1|1|2|3|2|F|49.0
Ryze|AP|1|1|1|2|3|YG|47.0
Samira|AD|0|1|2|3|2|DF|50.2
Sejuani|AP|3|3|2|3|2|EF|49.8
Senna|AD|0|1|1|2|3|KH|50.5
Seraphine|AP|0|3|1|3|3|FHK|50.8
Sett|AD|2|2|3|3|2|EFS|50.4
Shaco|AD|0|1|3|2|1|A|50.6
Shen|AP|3|2|2|3|2|GPS|50.5
Shyvana|M|2|1|2|3|2|F|50.7
Singed|AP|2|2|1|2|3|S|51.0
Sion|AD|3|3|1|3|3|E|50.8
Sivir|AD|0|0|1|2|3|DF|50.0
Skarner|AP|3|3|2|3|2|EA|49.8
Smolder|AD|0|0|1|2|3|YK|49.8
Sona|U|0|2|1|2|3|HFK|51.8
Soraka|U|0|1|1|2|3|HG|51.3
Swain|AP|2|2|2|3|2|F|50.5
Sylas|AP|1|2|2|3|2|A|48.8
Syndra|AP|0|2|2|3|2|AK|49.5
Tahm Kench|AP|3|2|2|2|2|P|50.2
Taliyah|AP|0|2|2|3|2|GKU|50.0
Talon|AD|0|0|2|3|2|AG|50.4
Taric|U|3|3|1|2|3|PH|51.0
Teemo|AP|0|1|2|2|2|KS|50.5
Thresh|U|2|3|2|3|2|EP|50.0
Tristana|AD|0|1|2|3|3|YD|50.6
Trundle|AD|2|1|3|3|2|S|51.0
Tryndamere|AD|0|0|2|3|3|SY|50.5
Twisted Fate|AP|0|2|2|3|2|GA|49.5
Twitch|M|0|1|1|2|3|YDA|51.0
Udyr|M|2|1|3|3|2|S|51.0
Urgot|AD|2|2|2|3|2|S|50.8
Varus|M|0|2|2|3|2|KD|49.5
Vayne|AD|0|1|1|2|3|YDS|50.3
Veigar|AP|0|2|1|2|3|YK|51.0
Vel'Koz|AP|0|1|2|3|2|K|51.0
Vex|AP|0|2|2|3|2|A|51.0
Vi|AD|1|2|3|3|2|EA|50.5
Viego|AD|1|0|2|3|2|A|49.2
Viktor|AP|0|1|1|2|3|KF|50.0
Vladimir|AP|1|0|1|2|3|YF|49.0
Volibear|M|2|2|3|3|2|E|50.8
Warwick|AD|2|2|3|3|1|E|51.0
Wukong|AD|2|3|2|3|2|EFU|50.8
Xayah|AD|0|1|2|3|3|DP|50.2
Xerath|AP|0|1|2|3|2|K|51.0
Xin Zhao|AD|2|2|3|3|1|EU|50.2
Yasuo|AD|0|1|2|3|2|SD|49.5
Yone|M|0|1|2|3|3|SD|49.0
Yorick|AD|2|1|2|3|3|S|51.5
Yunara|AD|0|1|1|2|3|YD|49.5
Yuumi|U|0|1|1|2|3|HY|47.5
Zaahen|AD|2|2|2|3|2|S|50.0
Zac|AP|3|3|2|3|2|EFU|51.0
Zed|AD|0|0|2|3|2|A|50.0
Zeri|AD|0|1|1|2|3|YD|48.0
Ziggs|AP|0|1|2|3|2|K|50.5
Zilean|U|0|2|2|2|3|PH|51.2
Zoe|AP|0|2|2|3|2|AK|49.0
Zyra|AP|0|2|2|3|2|FK|51.0`;

/* Líneas por campeón (orden = preferencia): T top, J jungla, M mid, B adc, S support */
const ROLE_RAW=`Aatrox:T
Ahri:M
Akali:MT
Akshan:MT
Alistar:S
Ambessa:TJ
Amumu:JS
Anivia:M
Annie:MS
Aphelios:B
Ashe:BS
Aurelion Sol:M
Aurora:MT
Azir:M
Bard:S
Bel'Veth:J
Blitzcrank:S
Brand:SJ
Braum:S
Briar:J
Caitlyn:B
Camille:TS
Cassiopeia:MT
Cho'Gath:TM
Corki:M
Darius:T
Diana:JM
Dr. Mundo:TJ
Draven:B
Ekko:JM
Elise:J
Evelynn:J
Ezreal:B
Fiddlesticks:J
Fiora:T
Fizz:M
Galio:MS
Gangplank:T
Garen:T
Gnar:T
Gragas:JT
Graves:J
Gwen:TMJ
Hecarim:J
Heimerdinger:MS
Hwei:MS
Illaoi:T
Irelia:TM
Ivern:J
Janna:S
Jarvan IV:J
Jax:TJ
Jayce:TM
Jhin:B
Jinx:B
K'Sante:T
Kai'Sa:B
Kalista:B
Karma:SM
Karthus:J
Kassadin:M
Katarina:M
Kayle:T
Kayn:J
Kennen:T
Kha'Zix:J
Kindred:J
Kled:T
Kog'Maw:B
LeBlanc:M
Lee Sin:J
Leona:S
Lillia:J
Lissandra:M
Locke:M
Lucian:BM
Lulu:S
Lux:SM
Malphite:TS
Malzahar:M
Maokai:SJ
Master Yi:J
Mel:MS
Milio:S
Miss Fortune:B
Mordekaiser:T
Morgana:SJ
Naafiri:M
Nami:S
Nasus:TJ
Nautilus:S
Neeko:MS
Nidalee:J
Nilah:B
Nocturne:J
Nunu & Willump:J
Olaf:TJ
Orianna:M
Ornn:T
Pantheon:TS
Poppy:JTS
Pyke:S
Qiyana:JM
Quinn:T
Rakan:S
Rammus:J
Rek'Sai:J
Rell:S
Renata Glasc:S
Renekton:T
Rengar:J
Riven:T
Rumble:TM
Ryze:MT
Samira:B
Sejuani:J
Senna:SB
Seraphine:SB
Sett:TS
Shaco:JS
Shen:TS
Shyvana:J
Singed:T
Sion:T
Sivir:B
Skarner:JT
Smolder:BM
Sona:S
Soraka:S
Swain:SMB
Sylas:MJ
Syndra:M
Tahm Kench:TS
Taliyah:M
Talon:MJ
Taric:S
Teemo:T
Thresh:S
Tristana:BM
Trundle:JT
Tryndamere:T
Twisted Fate:M
Twitch:BJ
Udyr:JT
Urgot:T
Varus:BM
Vayne:BT
Veigar:MS
Vel'Koz:SM
Vex:M
Vi:J
Viego:J
Viktor:M
Vladimir:MT
Volibear:JT
Warwick:JT
Wukong:JT
Xayah:B
Xerath:SM
Xin Zhao:J
Yasuo:MT
Yone:MT
Yorick:T
Yunara:B
Yuumi:S
Zaahen:T
Zac:J
Zed:MJ
Zeri:B
Ziggs:MB
Zilean:SM
Zoe:M
Zyra:SJ`;

/* Últimos 5 parches (26.16 → 26.20). Cada buff suma y cada nerf resta al WR de referencia;
   los ajustes no mueven el WR pero se muestran en el análisis.
   Fuentes: notas oficiales de Riot y resúmenes de dotesports, riftpatchnotes y gameriv. */
const PATCHES=[
  {v:"26.16",date:"11/08/2026",buff:["Gwen","Kennen","Azir"],nerf:["Bel'Veth","Mordekaiser","Poppy"],adj:["Camille","Nasus"],
   note:"ADCs con más resistencia mágica contra el meta de magos en bot; supports que roamean ganan menos oro; Sterak's rehecho para juggernauts."},
  {v:"26.17",date:"25/08/2026",buff:["Aurelion Sol","Cho'Gath","Irelia","LeBlanc","Qiyana","Trundle","Yasuo","Yone"],nerf:["Graves","Nasus","Nocturne","Thresh","Vayne","Xerath"],adj:[],
   note:"Buffs a carries melee AD (Yasuo y Yone pegan más con crítico). Stormrazor buffeado, Sundered Sky nerfeado."},
  {v:"26.18",date:"09/09/2026",buff:["Ekko","Kassadin","Master Yi","Viego","Zaahen"],nerf:["Seraphine","Syndra","Zeri","Bard","Nautilus"],adj:["Cassiopeia"],
   note:"Cassiopeia pasa poder del daño base al escalado AP. Guinsoo's Rageblade mejorado."},
  {v:"26.19",date:"22/09/2026",buff:["Aatrox","Aphelios","Aurora","Draven","Elise","Fiora","Kha'Zix","Lillia","Master Yi"],nerf:["Nasus","Nocturne","Poppy","Vi","Ryze"],adj:["Lucian","Rumble","Volibear"],
   note:"Primer parche pre-Worlds. TP de la misión de top con 30 s menos de enfriamiento. Ítems de support con menos vida y más regeneración: mejoran los supports melee."},
  {v:"26.20",date:"07/10/2026",buff:["Diana","Kennen","Kindred","Lillia","Lucian","Mordekaiser","Neeko","Smolder","Swain","Tahm Kench","Vayne"],nerf:["Ambessa","Ashe","Cassiopeia","K'Sante","Yunara"],adj:[],
   note:"Parche de Worlds. Hexplate y Runaan's Hurricane nerfeados; Rocketbelt con menos haste y más daño activo."}
];
const PATCH_NOW=PATCHES[PATCHES.length-1].v;
