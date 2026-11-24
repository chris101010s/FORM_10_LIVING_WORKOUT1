export type WeightEntry = { id: string; date: string; kg: number; note?: string };
export type BodyScan = { id: string; date: string; bodyFat?: number; muscleKg?: number; visceralFat?: number; waistCm?: number; weightKg?: number; bmr?: number; source?: string; rawText?: string };
export type Exercise = { id: string; name: string; group: string; photo?:string };
export type SetKind = 'work'|'warmup'|'drop'|'failure'|'assisted'|'timed'|'distance'|'bodyweight';
export type TrainingBlock = 'straight'|'superset'|'giant'|'circuit'|'emom'|'amrap'|'interval';
export type RoutineSegment = {id:string;kind:TrainingBlock;exerciseIds:string[];seconds:number};
export type SetDraft = {weight:string;reps:string;rir:string;kind?:SetKind;duration?:string;distance?:string;rpe?:string;side?:'both'|'left'|'right';tempo?:string;note?:string};
export type Prescription = {sets?:number;reps?:number;rir?:number;restSeconds?:number;warmupSets?:number};
export type Routine = { id: string; name: string; exerciseIds: string[]; restSeconds: number; block?:TrainingBlock; blockSeconds?:number; segments?:RoutineSegment[]; prescriptions?:Record<string,Prescription> };
export type GymSet = { id: string; exerciseId: string; weightKg: number; reps: number; rir?: number; at: string; kind?: SetKind; durationSeconds?:number; distanceMeters?:number; rpe?:number; side?:'both'|'left'|'right'; tempo?:string; note?: string };
export type Workout = { id: string; createdAt?:string; status?:'completed'; routineId?: string; name: string; startedAt: string; finishedAt: string; sets: GymSet[]; note?:string; block?:TrainingBlock; segments?:RoutineSegment[]; pausedMs?:number };
export type LiveWorkout = { id: string; createdAt?:string; lastSavedAt?:string; status?:'active'|'paused'; setSequence?:number; restPausedMs?:number; routineId?: string; name: string; startedAt: string; exerciseIds: string[]; sets: GymSet[]; restUntil: number | null; restSeconds: number; activeExerciseId?: string; drafts?: Record<string,SetDraft>; note?:string; block?:TrainingBlock; blockSeconds?:number; blockEndsAt?:number; segments?:RoutineSegment[]; segmentStartedAt?:number; pausedAt?:number; pausedMs?:number; prescriptions?:Record<string,Prescription> };
export type Cardio = { id: string; date: string; kind: string; minutes: number; km?: number; note?: string };
export type Performance = { id: string; date: string; kind: 'Push-ups'|'Plank'|'Sprint'|'Klimmzüge'|'Andere'; value: number; unit: string };
export type Habit = { id: string; title: string; days?:number[]; paused?:boolean; archived?:boolean; trigger?:string; replacement?:string };
export type Nutrition = { id: string; date: string; kcal?: number; protein?: number; carbs?: number; fat?: number; source?: string };
export type RecoveryEntry = {id:string;date:string;sleepHours?:number;energy?:number;soreness?:number;note?:string};
export type MeasurementType = 'waist'|'chest'|'hips'|'upperArm'|'thigh'|'neck';
export type Measurement = { id:string; date:string; metric:MeasurementType; cm:number; note?:string };
export type AthleteGoalMetric = 'pushups'|'pullups'|'plank'|'workouts'|'weight'|'run5k'|'lift';
export type AthleteGoal = { id:string; metric:AthleteGoalMetric; target:number; exerciseId?:string; label?:string };
export type TrainingPlan = { day:number; routineId:string|null }; // Sunday=0 ... Saturday=6
export type JournalEntry = {id:string;date:string;text:string;tag:string};
export type ProgramDay = {week:number;day:number;kind:'training'|'optional'|'rest';routineId:string|null};
export type Program = {id:string;name:string;description:string;color:'blue'|'yellow'|'green'|'coral';start:string;end?:string;weeks:number;status:'active'|'paused'|'archived';days:ProgramDay[]};
export type HealthMetric = 'steps'|'walkKm'|'waterMl'|'sleepQuality'|'bedtime'|'wakeTime'|'restingPulse'|'readiness'|'heartRate'|'activeKcal';
export type HealthEntry = {id:string;date:string;metric:HealthMetric;value:number;note?:string};
export type AthleteData = {
  programs?: Program[];
  healthEntries?: HealthEntry[];
  journal?: JournalEntry[];
  equipmentNotes?:Record<string,string>;
  schema: 4;
  profile: { name: string; targetKg: number | null; startingKg: number | null; onboarded: boolean; priority?:'strength'|'endurance'|'composition'|'athletic'|'mixed' };
  weights: WeightEntry[];
  scans: BodyScan[];
  exercises: Exercise[];
  routines: Routine[];
  workouts: Workout[];
  live: LiveWorkout | null;
  cardio: Cardio[];
  performance: Performance[];
  habits: Habit[];
  habitChecks: Record<string, string[]>;
  favoriteExerciseIds: string[];
  nutrition: Nutrition[];
  recovery: RecoveryEntry[];
  measurements: Measurement[];
  goals: AthleteGoal[];
  weeklyPlan: TrainingPlan[];
  settings: { coach: boolean; restSeconds: number; showWeightOnShare: boolean; tone?: 'calm'|'coach'|'chaos'|'off'; focusMode?:boolean; eggs?:boolean; weightStep?:number; paperMode?:boolean; haptics?:boolean; appearance?:'system'|'light'|'dark'; restAlerts?:boolean; alertSound?:boolean; reminderTime?:string; widgetEnabled?:boolean; activityEnabled?:boolean };
};
export const emptyData = (): AthleteData => ({
  schema: 4, journal: [], programs: [], healthEntries: [],
  profile: { name: '', targetKg: null, startingKg: null, onboarded: false },
  weights: [], scans: [], exercises: [], routines: [], workouts: [], live: null,
  cardio: [], performance: [], habits: [], habitChecks: {}, favoriteExerciseIds: [], nutrition: [], recovery: [], measurements: [], goals: [], weeklyPlan: [],
  settings: { coach: true, restSeconds: 90, showWeightOnShare: false }
});
