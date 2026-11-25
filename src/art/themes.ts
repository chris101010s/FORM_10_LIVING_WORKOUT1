export type FormTheme='system'|'light'|'dark'|'paper'|'retro';
/** Absence of the new setting preserves the old appearance + paper choice. */
export function effectiveTheme(settings:{theme?:FormTheme;appearance?:'system'|'light'|'dark';paperMode?:boolean},system:'light'|'dark'|null|undefined):Exclude<FormTheme,'system'>{
 if(settings.theme)return settings.theme==='system'?(system==='dark'?'dark':'light'):settings.theme;
 if(settings.appearance==='dark'||(settings.appearance!=='light'&&system==='dark'))return 'dark';
 return settings.paperMode?'paper':'light';
}
