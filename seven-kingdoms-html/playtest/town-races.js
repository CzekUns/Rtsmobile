/* Seven Kingdoms HTML — playable racial-population integration adapter.
 * Original references: OTOWN.h (race_pop_array, jobless_race_pop_array),
 * OTOWNIF.cpp (browse_race, race_filter), OTOWN.cpp (dec_pop).
 * Race identifiers below are DEMO keys rather than original numeric RACE.DBF IDs.
 * Legacy scalar-population saves carry estimated jobless counts, clearly marked.
 * This is not full 7KAA demographic parity. GPL-2.0-only.
 */
export const DEMO_RACES=Object.freeze([
 Object.freeze({id:'greek',label:'Greci'}),
 Object.freeze({id:'norman',label:'Normanni'})
]);
export const raceLabel=id=>DEMO_RACES.find(r=>r.id===id)?.label||String(id||'Sconosciuta');
export const raceIdForCulture=culture=>
 DEMO_RACES.find(r=>r.label===culture)?.id||'legacy-'+String(culture||'unknown').toLowerCase().replace(/[^a-z0-9]/g,'');
const bound=(n,min,max)=>Math.min(max,Math.max(min,n));
const people=v=>Math.max(0,Math.floor(Number.isFinite(v)?v:0));
function row(r){
 r.population=people(r.population);
 r.jobless=bound(people(r.jobless),0,r.population);
 r.spyCount=bound(people(r.spyCount),0,r.jobless);
 r.loyalty=bound(Number.isFinite(r.loyalty)?r.loyalty:50,0,100);
 r.culture??=raceLabel(r.raceId);
 return r;
}
export function ensureTownRaces(town){
 if(!Array.isArray(town.races)||!town.races.length){
  town.races=[{
   raceId:raceIdForCulture(town.culture),culture:town.culture||'Sconosciuta',
   population:people(town.pop),jobless:people(town.pop),
   loyalty:town.owner===0?50:(town.loyalty??50),
   spyCount:0,legacyEstimated:true
  }];
  town.raceJoblessEstimated=true;
 }
 town.races.forEach(row);
 town.selectedRaceId=town.races.some(r=>r.raceId===town.selectedRaceId)?
  town.selectedRaceId:town.races[0].raceId;
 town.trainingQueue??=[];
 return town.races;
}
export function selectedTownRace(town,raceId=null){
 const races=ensureTownRaces(town);
 return races.find(r=>r.raceId===(raceId??town.selectedRaceId))||null;
}
export function summarizeTown(town){
 const races=ensureTownRaces(town),sum=races.reduce((n,r)=>n+r.population,0);
 town.pop=sum;
 if(town.owner!==0&&sum>0){
  town.loyalty=races.reduce((n,r)=>n+r.population*r.loyalty,0)/sum;
 }
 return town;
}
export function setTownLoyalty(town,loyalty){
 ensureTownRaces(town);
 const diff=loyalty-town.loyalty;
 for(const r of town.races)r.loyalty=bound(r.loyalty+diff,0,100);
 summarizeTown(town);
}
export function removeTownPerson(town,raceId,penalty=0){
 const race=selectedTownRace(town,raceId);
 if(!race||race.jobless<=0||race.population<=0)return null;
 race.population--;race.jobless--;
 race.loyalty=bound(race.loyalty-penalty,0,100);
 summarizeTown(town);
 return race;
}
export function addTownBirth(town){
 const races=ensureTownRaces(town);
 const largest=races.filter(r=>r.population>0).sort((a,b)=>b.population-a.population)[0]||races[0];
 largest.population++;largest.jobless++;
 summarizeTown(town);
 return largest;
}
export function recruitableTownPeople(town,raceId,queued=true){
 const r=selectedTownRace(town,raceId);
 if(!r)return 0;
 const pending=queued?(town.trainingQueue||[]).filter(q=>q.raceId===r.raceId).length:0;
 return Math.max(0,r.jobless-r.spyCount-pending);
}
