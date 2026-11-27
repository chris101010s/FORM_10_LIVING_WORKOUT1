import type {GymSet,PlannedSetRow,Workout} from '../data/schema';

/** Display-only history. Never use these values to silently complete or change a planned set. */
export type PreviousActual={set:GymSet;finishedAt:string;source:'comparable'|'exercise'};
type ComparableHistory={workout:Workout;byTargetId:Record<string,GymSet>}|null;
type SetCategory='work'|'warmup'|'extra';

function rowCategory(row:PlannedSetRow):SetCategory {
 return row.isExtraSet?'extra':row.kind==='warmup'?'warmup':'work';
}
function actualCategory(workout:Workout,set:GymSet):SetCategory {
 const planned=workout.plannedRows?.find(row=>row.id===(set.plannedRowId??set.id));
 if(set.isExtraSet===true||planned?.isExtraSet===true)return 'extra';
 if(set.role==='warmup'||set.kind==='warmup'||planned?.kind==='warmup')return 'warmup';
 return 'work';
}
const finishedTime=(w:Workout)=>Date.parse(w.finishedAt);

/**
 * Show the most recent actual session for each exercise, even when a copied or
 * changed routine is no longer comparable for automatic progression.
 * A missing/skipped set must not shift the next set into its place.
 * When two historic positions use the same exercise, suppress an ambiguous fallback.
 */
export function previousActualsForRows(
 workouts:Workout[],rows:PlannedSetRow[],comparable:ComparableHistory=null,startedAt?:string
):Record<string,PreviousActual> {
 const cutoff=startedAt?Date.parse(startedAt):Infinity;
 const history=[...workouts].filter(w=>Number.isFinite(finishedTime(w))&&finishedTime(w)<=cutoff)
  .sort((a,b)=>finishedTime(b)-finishedTime(a)||b.id.localeCompare(a.id));
 const result:Record<string,PreviousActual>={};
 for(const row of rows){
  const category=rowCategory(row);
  const last=history.find(w=>w.sets.some(s=>s.exerciseId===row.exerciseId&&actualCategory(w,s)===category));
  if(!last)continue;
  if(category==='work'&&row.targetId&&comparable?.workout.id===last.id){
   const exact=comparable.byTargetId[row.targetId];
   if(exact&&exact.exerciseId===row.exerciseId&&actualCategory(last,exact)===category){
    result[row.id]={set:exact,finishedAt:last.finishedAt,source:'comparable'};
    continue;
   }
  }
  let candidates=last.sets.filter(s=>s.exerciseId===row.exerciseId&&actualCategory(last,s)===category);
  const positions=new Set(candidates.map(s=>s.planPositionId).filter((id):id is string=>!!id));
  if(positions.size>1){
   if(!row.planPositionId||!positions.has(row.planPositionId))continue;
   candidates=candidates.filter(s=>s.planPositionId===row.planPositionId);
  }
  let match:GymSet|undefined;
  if(row.plannedIndex!==null){
   match=candidates.some(s=>s.plannedIndex!=null)
    ?candidates.find(s=>s.plannedIndex===row.plannedIndex)
    :candidates[row.plannedIndex];
  }else if(category==='extra'){
   const ordinal=rows.filter(r=>r.exerciseId===row.exerciseId&&r.isExtraSet).findIndex(r=>r.id===row.id);
   match=ordinal<0?undefined:candidates[ordinal];
  }
  if(match)result[row.id]={set:match,finishedAt:last.finishedAt,source:'exercise'};
 }
 return result;
}
