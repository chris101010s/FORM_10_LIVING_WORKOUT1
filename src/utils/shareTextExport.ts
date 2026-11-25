import {File,Paths} from 'expo-file-system';
import {randomUUID} from 'expo-crypto';
import * as Sharing from 'expo-sharing';

/** Ephemeral, explicitly requested export. Completion does not prove an external destination saved it. */
export async function shareTextExport(filename:string,text:string,mimeType:string,dialogTitle?:string):Promise<void>{
 if(typeof filename!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(filename)||filename.includes('..'))throw Error('Exportdateiname ungültig.');
 const file=new File(Paths.cache,`FORM_export_${randomUUID()}_${filename}`);
 let failed=false,failure:unknown;
 try{
  file.create({overwrite:false});
  await file.write(text);
  if(await file.text()!==text)throw Error('Exportdatei wurde nicht vollständig geschrieben.');
  if(!await Sharing.isAvailableAsync())throw Error('Die Systemfreigabe ist auf diesem Gerät nicht verfügbar.');
  await Sharing.shareAsync(file.uri,{mimeType,dialogTitle});
 }catch(error){failed=true;failure=error;}
 finally{
  let cleanupFailed=false;
  try{if(file.exists)file.delete();cleanupFailed=file.exists;}catch{cleanupFailed=true;}
  if(cleanupFailed){failed=true;failure=Error('Die temporäre Exportdatei konnte nicht entfernt werden.');}
 }
 if(failed)throw failure;
}
