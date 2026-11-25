import type {InkDrawing} from './types';
/** Category pictograms indicate equipment, never a movement instruction. */
export const categories={
 freeWeights:{paths:['M12 37 82 37M12 47 82 47','M21 27 21 57M29 23 29 61M65 23 65 61M74 27 74 57','M31 75 65 75M37 67 37 83M59 67 59 83'],wash:'M29 33 65 33 65 51 29 51Z'},
 machine:{paths:['M18 81 21 13 73 13 78 81M12 83 86 83','M27 43 61 43 64 49 27 49Z','M35 49 35 80M62 16 63 42','M46 24 70 24M46 30 70 30M46 36 70 36','M27 16 27 34'],wash:'M45 20 70 20 70 38 45 38Z'},
 cable:{paths:['M17 81 18 15 77 15 80 81M11 83 86 83','M25 23Q25 15 32 22Q32 30 25 23M63 23Q63 15 70 22Q70 30 63 23','M28 28 28 51 38 58M66 28 66 51 56 58','M31 58 40 55 45 68 35 71Z','M50 68 55 56 65 59 60 72Z'],wash:'M31 58 40 55 45 68 35 71Z'},
 bodyweight:{paths:['M39 20Q39 10 49 11Q59 12 57 22Q55 32 46 29Q39 28 39 20Z','M47 31 45 56M45 39 24 46 15 39M46 39 65 46 78 39','M45 56 28 73 21 83M45 56 62 73 73 81','M13 89 82 89'],wash:'M40 33 52 33 51 55 41 55Z'},
 bands:{paths:['M25 65Q3 18 35 13Q64 9 76 39Q92 78 62 82Q39 89 25 65Z','M31 62Q15 26 36 22Q56 19 67 44Q77 69 60 73Q41 79 31 62Z','M23 45 32 43M67 56 77 53'],wash:'M25 65Q3 18 35 13Q64 9 76 39L67 44Q56 19 36 22Q15 26 31 62Z'},
 cardio:{paths:['M12 71 68 71 79 81 20 81Z','M61 71 73 25 86 25M72 25 70 17 85 17','M17 68 54 68M27 81 26 87M68 82 69 87','M49 27Q49 17 41 17Q32 17 32 25Q32 34 41 34Q49 34 49 27Z','M40 36 48 48 59 43M43 40 31 45 20 41M48 49 38 59 28 59M48 49 56 60 64 63'],wash:'M13 72 68 72 78 81 21 81Z'},
 core:{paths:['M12 76 83 76 88 83 8 83Z','M23 57Q14 58 14 49Q14 39 23 39Q32 39 32 48Q32 57 23 57Z','M31 51 58 48 75 65M36 53 30 70 19 70','M58 49 60 66 78 70','M37 41 58 39'],wash:'M8 77 83 77 88 84 8 84Z'},
 mobility:{paths:['M45 18Q45 9 54 10Q64 11 63 20Q63 30 53 29Q45 28 45 18Z','M52 30 44 53M48 40 25 32 15 17M48 40 69 47 82 41','M44 53 25 68 11 70M44 53 58 69 81 71','M17 83Q46 90 79 82'],wash:'M42 33 53 34 49 54 40 54Z'},
 balance:{paths:['M21 79Q45 65 76 79M18 81 79 81M44 83 51 83 49 89Z','M41 18Q41 9 50 10Q60 11 59 20Q58 28 49 28Q41 27 41 18Z','M49 30 47 52 44 75M48 51 65 58 56 68','M48 37 29 40 16 34M49 37 69 32 81 39'],wash:'M23 78Q46 68 75 78Z'},
 mixed:{paths:['M15 25 42 24 42 48 14 49Z','M60 22Q76 20 78 35Q78 48 64 50Q51 48 51 35Q50 25 60 22Z','M13 79 29 57 44 79Z','M56 61 78 61 78 82 55 82Z','M19 32 35 32M20 40 31 40M62 66 71 76M71 66 62 76'],wash:'M15 25 42 24 42 48 14 49Z'},
} satisfies Record<string,InkDrawing>;
export type CategoryName=keyof typeof categories;
export function equipmentCategory(value?:string):CategoryName{const v=(value??'').toLowerCase();if(/cable|kabel/.test(v))return 'cable';if(/machine|maschine|smith/.test(v))return 'machine';if(/band|expander/.test(v))return 'bands';if(/body|körper|koerper/.test(v))return 'bodyweight';if(/cardio|lauf|bike|rowing/.test(v))return 'cardio';if(/stretch|mobil/.test(v))return 'mobility';if(/balance|bosu/.test(v))return 'balance';if(/core|abdom|bauch/.test(v))return 'core';if(/dumbbell|barbell|kettlebell|hantel|weight/.test(v))return 'freeWeights';return 'mixed';}
