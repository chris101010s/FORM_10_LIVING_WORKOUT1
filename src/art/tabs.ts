import type {InkDrawing} from './types';
export const tabNames=['home','plans','gym','weight','health','profile'] as const;
export type FormTabName=typeof tabNames[number];
const base:Record<FormTabName,InkDrawing>={
 home:{paths:['M13 42 46 14 83 41M21 39 21 81 72 81 73 40','M40 81 40 57 55 57 55 81'],wash:'M23 41 47 22 70 41 70 78 24 78Z'},
 plans:{paths:['M18 22 78 22 78 81 18 81Z','M18 37 78 37M31 14 31 29M65 14 65 29','M29 49 39 49M54 49 65 49M29 63 39 63M54 63 65 63'],wash:'M19 24 77 24 77 36 19 36Z'},
 gym:{paths:['M12 43 84 43M12 53 84 53','M21 29 21 67M30 23 30 73M66 23 66 73M75 29 75 67'],wash:'M31 43 65 43 65 53 31 53Z'},
 weight:{paths:['M18 17 18 79 83 79','M28 64 41 49 53 56 75 27','M62 25 76 26 76 41'],wash:'M27 76 41 52 54 61 76 35 76 76Z'},
 health:{paths:['M48 31C31 7 7 25 16 44Q24 61 48 80Q74 60 81 43C89 21 63 8 48 31Z','M28 44 39 44 44 35 52 57 59 44 70 44'],wash:'M48 31C31 7 7 25 16 44Q24 61 48 80Q74 60 81 43C89 21 63 8 48 31Z'},
 profile:{paths:['M35 16 58 13 69 27 65 55 32 58 27 32Z','M58 14 57 29 68 27M38 34 38 38M54 33 54 37M40 47 52 46','M16 82Q22 61 47 63Q72 62 80 82'],wash:'M35 16 58 13 69 27 65 55 32 58 27 32Z'},
};
export function tabDrawing(name:FormTabName,active:boolean):InkDrawing{const b=base[name];return {paths:[...b.paths,...(active?['M26 89Q48 85 70 89']:[])],wash:active?b.wash:undefined,detail:active?['M82 12 86 8']:undefined};}
