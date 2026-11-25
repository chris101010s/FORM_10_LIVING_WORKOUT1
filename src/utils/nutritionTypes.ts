/** HealthKit cache is deliberately separate from the existing manual nutrition log. */
export type NutritionMetric = 'kcal'|'protein'|'carbs'|'fat'|'waterMl';
export type HealthSource = {
  name: string;
  bundleIdentifier: string;
  version?: string;
  productType?: string;
  deviceName?: string;
  deviceId?: string;
};
export type HealthNutritionSample = {
  uuid: string;
  metric: NutritionMetric;
  value: number;
  unit: 'kcal'|'g'|'ml';
  startedAt: string;
  endedAt: string;
  source: HealthSource;
  /** Returned by the native bridge from this app's source/metadata, never guessed. */
  isOwnExport?: boolean;
};
export type NutritionWindow = {from: string; to: string; timeZone: string};
export type NutritionSnapshot = NutritionWindow & {
  queriedAt: string;
  samples: HealthNutritionSample[];
  completeMetrics: NutritionMetric[];
  unavailable: NutritionMetric[];
};
export type NutritionCoverage = NutritionWindow & {queriedAt:string;completeMetrics:NutritionMetric[];unavailable:NutritionMetric[]};
export type NutritionSyncTrigger = 'open'|'foreground'|'manual'|'history';
export type NutritionSyncAttempt = NutritionWindow & {
  id:string;startedAt:string;finishedAt?:string;trigger:NutritionSyncTrigger;
  status:'running'|'success'|'partial'|'failed'|'cancelled';completedChunks:number;totalChunks:number;
  errorCode?:string;message?:string;
};
export type HealthExportRequest =
  | {kind:'weight';entryId:string;at:string;kg:number}
  | {kind:'workout';entryId:string;startedAt:string;finishedAt:string;durationSeconds:number};
export type HealthExportRecord = {
  id: string;
  syncIdentifier: string;
  syncVersion: number;
  fingerprint: string;
  request: HealthExportRequest;
  status: 'pending'|'confirmed'|'deletePending'|'deleted';
  requestedAt: string;
  confirmedAt?: string;
  healthKitUUID?: string;
  deletionRequestedAt?:string;
  deletedAt?:string;
  deletedUUIDs?:string[];
};
export type HealthNutritionState = {
  version: 1;
  authorizationRequested: boolean;
  requestedMetrics: NutritionMetric[];
  samples: HealthNutritionSample[];
  selectedSourceBundle?: string;
  lastSync?: NutritionWindow & {
    queriedAt: string;
    completeMetrics: NutritionMetric[];
    unavailable: NutritionMetric[];
  };
  exports: HealthExportRecord[];
  syncPreferences?: {onOpen?:boolean;onForeground?:boolean};
  coverage?: NutritionCoverage[];
  lastAttempt?: NutritionSyncAttempt;
  /** First committed query with real readable samples; a permission dialog is insufficient. */
  connectionConfirmedAt?: string;
  connectionEventId?: string;
  /** User-entered FORM targets, never claimed to be imported from YAZIO. */
  formGoals?: Partial<Record<NutritionMetric,number>>;
};
