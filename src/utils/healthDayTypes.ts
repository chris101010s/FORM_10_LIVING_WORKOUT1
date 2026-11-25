import type {HealthSource,NutritionWindow} from './nutritionTypes';
export type HealthDailyMetric='steps'|'walkKm'|'restingPulse'|'heartRate'|'activeKcal'|'weight'|'sleepHours';
export type HealthDaySample={uuid:string;metric:HealthDailyMetric;value:number;unit:'count'|'km'|'bpm'|'kcal'|'kg'|'h';startedAt:string;endedAt:string;source:HealthSource};
export type HealthDaySnapshot=NutritionWindow&{queriedAt:string;samples:HealthDaySample[];unavailable:HealthDailyMetric[]};
export type HealthImportedProvenance={queriedAt:string;from:string;to:string;timeZone:string;sourceKey:string;source:HealthSource;sampleUUIDs:string[]};
export type HealthDayValue={metric:HealthDailyMetric;value:number;origin:HealthImportedProvenance};
