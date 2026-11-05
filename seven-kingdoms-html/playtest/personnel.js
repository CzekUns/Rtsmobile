/* Workers and original 7KAA skill identifiers. 
 * Sources: 7kaa include/OSKILL.h SKILL_* and include/OFIRM.h Worker.
 * This adapter does not claim complete C++ worker or residence parity.
 * Legacy demo workers have UNKNOWN person/skill data; do not fabricate their past.
 * GPL-2.0-only.
 */
export const SKILLS=Object.freeze([
  Object.freeze({id:0,key:'none',label:'Non addestrato',trainable:false}),
  Object.freeze({id:1,key:'construction',label:'Costruzione',trainable:true}),
  Object.freeze({id:2,key:'leading',label:'Comando',trainable:true}),
  Object.freeze({id:3,key:'mining',label:'Estrazione',trainable:true}),
  Object.freeze({id:4,key:'manufacturing',label:'Manifattura',trainable:true}),
  Object.freeze({id:5,key:'research',label:'Ricerca',trainable:true}),
  Object.freeze({id:6,key:'spying',label:'Spionaggio',trainable:true}),
  Object.freeze({id:7,key:'praying',label:'Preghiera',trainable:false})
]);
const cap=v=>Math.max(0,Math.min(8,Number.isFinite(v)?Math.floor(v):0));
const skillNumber=v=>Number.isInteger(v)&&v>=0&&v<SKILLS.length?v:0;
export const workerRoleLabel=(person)=>{
 if(person?.legacyUnknown)return 'Ruolo precedente non documentato';
 if(person?.kind==='soldier')return 'Soldato';
 if(person?.kind==='peasant')return 'Abitante';
 return 'Ruolo sconosciuto';
};
export const workerRaceLabel=(person)=>{
 const id=person?.raceId;
 const culture=typeof person?.culture==='string'&&person.culture.trim()?person.culture.trim():null;
 // String IDs belong to the HTML demo; do not claim they are 7KAA RACE.DBF IDs.
 if(id==='greek'||id==='norman')return culture|| (id==='greek'?'Greci':'Normanni');
 if(Number.isInteger(id)&&id>0)return 'Razza #'+id+(culture?' · '+culture:'');
 return 'Etnia non verificata'+(culture?' · '+culture:'');
};
export const skillLabel=(id,level=0,unknown=false)=>
  unknown?'Non documentata (salvataggio precedente)':
  SKILLS[skillNumber(id)].label+(skillNumber(id)===0?'':' · '+Math.max(0,Math.floor(level||0)));
const identifier=(firm,n)=>String(firm.id)+':staff-'+n;
/** Migrate old workers:number to stable, openly unknown legacy slots. */
export function ensureFirmPersonnel(firm){
 if(!Array.isArray(firm.staff))firm.staff=[];
 const current=Math.max(firm.staff.length,cap(firm.workers));
 const used=new Set(firm.staff.map(p=>p.id));
 let seq=Math.max(1,Math.floor(firm.nextStaffSerial)||1);
 for(const p of firm.staff){
  const match=String(p.id??'').match(/:staff-(\d+)$/);
  if(match)seq=Math.max(seq,Number(match[1])+1);
 }
 while(firm.staff.length<current){
  while(used.has(identifier(firm,seq)))seq++;
  const id=identifier(firm,seq++);
  used.add(id);
  firm.staff.push({
   id,personId:null,name:null,raceId:null,culture:null,
   kind:firm.kind==='fort'?'soldier':'peasant',
   skillId:0,skillLevel:0,combatLevel:0,hp:100,
   legacyUnknown:true
  });
 }
 firm.nextStaffSerial=seq;
 firm.workers=firm.staff.length;
 return firm.staff;
}
export function staffFromUnit(firm,unit){
 ensureFirmPersonnel(firm);
 const id=identifier(firm,firm.nextStaffSerial++);
 return {
  id,personId:unit.personId??unit.id,name:unit.name??null,
  raceId:unit.raceId??null,culture:unit.culture??null,
  kind:unit.kind,skillId:skillNumber(unit.skillId),
  skillLevel:Math.max(0,Math.floor(unit.skillLevel||0)),
  combatLevel:Math.max(0,Math.floor(unit.combatLevel||0)),
  hp:Math.max(0,Math.floor(unit.hp??100)),
  legacyUnknown:unit.legacyUnknown===true
 };
}
export function releasedUnitAttributes(staff,firm){
 return {
  owner:firm.owner,personId:staff.personId??staff.id,name:staff.name??null,
  raceId:staff.raceId??null,culture:staff.culture??null,
  kind:staff.kind||(firm.kind==='fort'?'soldier':'peasant'),
  hp:staff.hp??100,level:1,training:staff.skillLevel||0,
  skillId:skillNumber(staff.skillId),skillLevel:staff.skillLevel||0,
  combatLevel:staff.combatLevel||0,legacyUnknown:staff.legacyUnknown===true,
  route:[],workTargetId:null,target:null
 };
}
