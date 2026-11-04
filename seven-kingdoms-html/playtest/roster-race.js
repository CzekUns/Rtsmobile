/* Roster race display adapter. A culture string is not proof of an original 7KAA raceId.
 * Preserve unknown legacy identities and never infer a numeric race from culture.
 * GPL-2.0-only.
 */
export function rosterRaceLabel(person){
 const id=person?.raceId;
 const race=Number.isInteger(id)&&id>0?'Razza #'+id:'Razza non identificata';
 const culture=typeof person?.culture==='string'&&person.culture.trim()?' · '+person.culture.trim():'';
 return race+culture;
}
