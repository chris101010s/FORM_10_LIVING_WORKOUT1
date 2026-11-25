import type {DoodleName} from './doodles';

export type DeskSceneVariant='today'|'plan'|'training'|'health'|'welcome';
export type DeskSceneTone='blue'|'mint'|'warm'|'peach';
export type DeskSceneSpec={
  paperAngle:number;
  paperTone:DeskSceneTone;
  side:DoodleName;
  sideAngle:number;
  sticker:DoodleName;
  stickerTone:DeskSceneTone;
  companion:DoodleName;
  stickerAngle:number;
};

/** Original FORM desktop compositions. Motifs contain no user data or result claims. */
export const deskScenes:Record<DeskSceneVariant,DeskSceneSpec>={
  today:{paperAngle:-3,paperTone:'blue',side:'shoe',sideAngle:-12,sticker:'waterGlass',stickerTone:'warm',companion:'pipNeutral',stickerAngle:8},
  plan:{paperAngle:3,paperTone:'mint',side:'pencil',sideAngle:-13,sticker:'folder',stickerTone:'blue',companion:'pipThinking',stickerAngle:-7},
  training:{paperAngle:-3,paperTone:'blue',side:'kettlebell',sideAngle:-10,sticker:'stopwatch',stickerTone:'warm',companion:'pipStopwatch',stickerAngle:9},
  health:{paperAngle:2,paperTone:'peach',side:'waterGlass',sideAngle:-11,sticker:'moon',stickerTone:'mint',companion:'pipNeutral',stickerAngle:-8},
  welcome:{paperAngle:-4,paperTone:'mint',side:'pencil',sideAngle:-14,sticker:'heart',stickerTone:'warm',companion:'pipWave',stickerAngle:8},
};

/** Shared local geometry, deliberately asymmetric instead of stock card rectangles. */
export const deskScenePaths={
  backdrop:'M39 80Q46 28 113 26L267 28Q337 26 350 87Q363 149 286 157L87 157Q30 151 39 80Z',
  paper:'M77 31Q151 27 234 32L240 145Q164 151 75 145Z',
  paperShadow:'M82 37 242 36 247 149Q161 157 80 151Z',
  paperFold:'M218 32 235 32 237 49Q224 45 218 32Z',
  tape:'M122 19 130 16 137 19 144 15 152 18 160 15 168 18 176 15 184 18 192 15 201 19 197 38 189 36 181 39 173 36 165 39 157 36 149 39 141 36 133 39 125 36Z',
  sticker:'M19 10Q32 5 44 9Q57 2 69 10Q90 7 94 27Q104 39 98 53Q102 69 89 79Q86 100 65 98Q48 106 34 96Q14 98 12 79Q-1 66 7 50Q0 34 14 26Z',
  clip:'M226 42 240 18Q245 10 252 16Q259 22 253 30L238 55Q231 66 223 58Q216 52 222 42L236 20M228 43 240 24Q243 19 247 22Q250 25 246 30L234 51Q231 56 227 53',
  deskEdge:'M19 158Q85 155 144 159M158 159Q237 156 291 159M305 159 365 157',
  pencil:'M110 155 207 143 219 147 209 153 112 165 103 161Z',
  pencilDetail:'M113 155 115 164M121 154 123 163M124 158 206 148M207 144 209 153M219 147 214 149',
  quietStars:['M49 40 49 49M45 44 54 44','M318 24 318 32M314 28 322 28','M342 112 342 119M338 115 346 115'],
};
