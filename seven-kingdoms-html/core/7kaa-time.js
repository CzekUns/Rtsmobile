// Formula-level ports of ODATE.cpp, OINFO.cpp and OSYS2.cpp at 7kaa
// 14e6fdfba9481af4dc3a54722614a608776e20bc. Pure data, no external imports.
export const SEVEN_KAA_FRAMES_PER_DAY = 10; // include/OSYS.h
export const SEVEN_KAA_JULIAN_ADJUSTMENT = 1721425;
const offsets = [0,31,59,90,120,151,181,212,243,273,304,334,365];
const integer = Number.isSafeInteger;
export function is7kaaLeapYear(year) {
  if (!integer(year) || year < 1) throw new RangeError('year');
  return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
}
export function sevenKaaDayOfYear(year,month,day) {
  if (!integer(month) || month < 1 || month > 12 || !integer(day)) throw new RangeError('date');
  const leap = Number(is7kaaLeapYear(year));
  const length = offsets[month]-offsets[month-1]+(month===2 ? leap : 0);
  if (day < 1 || day > length) throw new RangeError('day');
  return offsets[month-1]+day+(month > 2 ? leap : 0);
}
export function sevenKaaJulian(year,month,day) {
  const yd = sevenKaaDayOfYear(year,month,day), y = year-1;
  const n = y*365+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)+yd+SEVEN_KAA_JULIAN_ADJUSTMENT;
  if (!integer(n) || n > 5373484) throw new RangeError('out of supported date range');
  return n;
}
export function sevenKaaFromJulian(julian) {
  if (!integer(julian) || julian < 1721426 || julian > 5373484) throw new RangeError('julian');
  let low=1,high=9999;
  while(low<high) {
    const mid=Math.ceil((low+high)/2);
    if (sevenKaaJulian(mid,1,1) <= julian) low=mid;
    else high=mid-1;
  }
  const year=low,dayOfYear=julian-sevenKaaJulian(year,1,1)+1;
  let month=1, day=dayOfYear;
  for(;month<=12;month++) {
    const length=offsets[month]-offsets[month-1]+(month===2 && is7kaaLeapYear(year)?1:0);
    if(day<=length) break;
    day-=length;
  }
  return {year,month,day,dayOfYear};
}
export function create7kaaCalendar({year=1000,month=6,day=1}={}) {
  const gameDate=sevenKaaJulian(year,month,day);
  return {gameDate,gameYear:year,gameMonth:month,gameDay:day,
    yearDay:sevenKaaDayOfYear(year,month,day),yearPassed:0,weekDay:gameDate%7};
}
export function next7kaaDay(calendar) {
  if (!calendar || !integer(calendar.gameDate) || !integer(calendar.gameDay) ||
      !integer(calendar.gameMonth) || !integer(calendar.gameYear) ||
      !integer(calendar.yearPassed)) throw new TypeError('calendar');
  const gameDate=calendar.gameDate+1;
  const d=sevenKaaFromJulian(gameDate);
  const monthChanged=d.month!==calendar.gameMonth, yearChanged=d.year!==calendar.gameYear;
  const gameDay=monthChanged?1:Math.min(30,calendar.gameDay+1);
  return {calendar:{gameDate,gameYear:d.year,gameMonth:d.month,gameDay,
    yearDay:sevenKaaDayOfYear(d.year,d.month,gameDay),
    yearPassed:calendar.yearPassed+Number(yearChanged),weekDay:gameDate%7},
    monthChanged,yearChanged};
}
export function create7kaaFrameState({frameCount=1,dayFrameCount=0,calendar=create7kaaCalendar()}={}) {
  if (!integer(frameCount)||frameCount<1||!integer(dayFrameCount)||
      dayFrameCount<0||dayFrameCount>SEVEN_KAA_FRAMES_PER_DAY) throw new RangeError('frame counters');
  return {frameCount,dayFrameCount,calendar:{...calendar}};
}
export function step7kaaFrame(input) {
  const before=create7kaaFrameState(input);
  const frameCount=before.frameCount+1;
  if (!integer(frameCount)) throw new RangeError('frame overflow');
  const dayBoundary=before.dayFrameCount+1>SEVEN_KAA_FRAMES_PER_DAY;
  const day=dayBoundary?next7kaaDay(before.calendar):null;
  return {state:{frameCount,dayFrameCount:dayBoundary?0:before.dayFrameCount+1,
    calendar:day?day.calendar:before.calendar},
    dayBoundary,monthBoundary:day?.monthChanged??false,
    yearBoundary:day?.yearChanged??false,syncFrame:frameCount%3===0};
}
