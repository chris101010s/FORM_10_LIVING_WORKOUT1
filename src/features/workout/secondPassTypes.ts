import type {Exercise,GymSet,LiveWorkout,Program,Routine,SetKind,Workout} from '../../data/schema';

export type TargetMode='reps'|'amrap'|'time'|'distance';
export type LoadBasis='total'|'perHand'|'perSide';
export type LoadType='weighted'|'bodyweight'|'assisted';
export type PlannedSetTarget={
 id:string;kind:SetKind;targetMode:TargetMode;loadType?:LoadType;
 repsMin?:number;repsMax?:number;weightKg?:number;rir?:number;rpe?:number;
 restSeconds?:number;durationSeconds?:number;distanceMeters?:number;tempo?:string;note?:string;
 estimatedSeconds?:number;unilateral?:boolean;loadBasis?:LoadBasis;
};
export type RoutinePosition={id:string;exerciseId:string;enabled?:boolean;replacementExerciseIds?:string[];targets:PlannedSetTarget[];note?:string};
export type SideDraft={weight:string;reps:string;rir?:string};
export type SideActual={weightKg:number;reps:number;rir?:number};
export type SplitDraft={left:SideDraft;right:SideDraft};
export type SplitActual={left:SideActual;right:SideActual};
export type PlanRevision={
 id:string;programId:string;createdAt:string;comment?:string;parentId?:string;
 source:'baseline'|'edit'|'copy'|'import'|'restore'|'progression';
 program:Program;routines:Routine[];exercises?:Exercise[];
};
export type PlanOccurrence={
 id:string;programId:string;routineId:string;originalDate:string;scheduledDate:string;
 week:number;weekday:number;kind:'training'|'optional';status?:'scheduled'|'skipped';
 reason?:string;updatedAt:string;
};
export type RestObservation={
 id:string;rowId?:string;startedAt:number;activeMs:number;runningSince?:number;
 expectedEndAt?:number;endedAt?:number;reason?:'elapsed'|'skip'|'nextSet'|'finish'|'restart';
};
export type WorkoutSafety={pain?:boolean;overload?:boolean};
export type ExerciseDisposition={status:'skipped'|'active';reason?:string;at:string};
export type UndoAction='setComplete'|'extraRep'|'extraSet'|'setRemove'|'exerciseSwap'|'exerciseSkip'|'workoutDelete'|'occurrenceMove'|'occurrenceSkip';
export type UndoRecord={
 id:string;action:UndoAction;entityId:string;createdAt:string;expectedAfter:string;
}&({scope:'live';before:LiveWorkout}|{scope:'workout';before:Workout}|{scope:'occurrence';before:PlanOccurrence|null});
export type EquipmentSetup={barKg?:number;plates?:{kg:number;count:number}[];studio?:string;machine?:string;seat?:string;pin?:string;grip?:string;rack?:string;stackOffsetKg?:number;note?:string};
export type ProgressionDecision={id:string;exerciseId:string;positionId?:string;at:string;sessionIds:string[];decision:'accepted'|'dismissed';proposalKey:string};
export type AnalyticsFavorite='week'|'duration'|'volume'|'last';
export type WorkoutComparisonValues={planned:number;completed:number;extra:number;volume:number;activeMs:number;observedRests:{count:number;totalMs:number;averageMs:number|null}};
export type WorkoutComparison={previous:Workout|null;reason?:string;current:WorkoutComparisonValues;baseline?:WorkoutComparisonValues};
export type RecordTicket={id:string;exerciseId:string;sessionId:string;setId:string;at:string;kind:'load'|'repsAtLoad'|'e1rm'|'bodyweight'|'duration'|'distance';value:number;previous:number;unit:string;loadKg?:number;side?:'left'|'right';set:GymSet};
