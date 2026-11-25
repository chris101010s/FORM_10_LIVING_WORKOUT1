const fs=require('node:fs'),path=require('node:path');
const lists=['weights','scans','exercises','routines','cardio','performance','habits','nutrition','recovery','measurements','goals','journal','programs','healthEntries'];
function seedV10(db,input=JSON.parse(fs.readFileSync(path.join(__dirname,'v10-existing.json'),'utf8'))){
 db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');db.exec(fs.readFileSync(path.join(__dirname,'v10-schema.sql'),'utf8'));
 db.exec('BEGIN IMMEDIATE');
 try{
  db.prepare('INSERT INTO form_meta VALUES(1,8,?)').run('2026-11-24T12:00:00.000Z');
  for(const [key,value] of Object.entries(input)){
   if(['schema','workouts','live'].includes(key))continue;
   if(lists.includes(key))value.forEach((entry,i)=>db.prepare('INSERT INTO form_entity VALUES(?,?,?,?,?)').run(key,entry.id,i,entry.date??null,JSON.stringify(entry)));
   else db.prepare('INSERT INTO form_singleton VALUES(?,?)').run(key,JSON.stringify(value));
  }
  function session(scope,workout,i){const {sets,...rest}=workout;db.prepare('INSERT INTO form_session VALUES(?,?,?,?,?,?)').run(scope,workout.id,i,workout.startedAt,workout.finishedAt??null,JSON.stringify(rest));sets.forEach((s,j)=>db.prepare('INSERT INTO form_set VALUES(?,?,?,?,?,?,?)').run(scope,workout.id,s.id,j,s.exerciseId,s.at,JSON.stringify(s)));}
  input.workouts.forEach((w,i)=>session('history',w,i));if(input.live)session('live',input.live,0);
  db.exec('COMMIT');return input;
 }catch(error){db.exec('ROLLBACK');throw error;}
}
function port(db,options={}){
 return {exec:async sql=>{if(options.beforeExec)options.beforeExec(sql);db.exec(sql);},run:async(sql,params)=>{if(options.beforeRun)options.beforeRun(sql,params);db.prepare(sql).run(...params);},all:async(sql,params=[])=>db.prepare(sql).all(...params),transaction:async fn=>{db.exec('BEGIN IMMEDIATE');try{const result=await fn(port(db,options));if(options.beforeCommit)options.beforeCommit();db.exec('COMMIT');return result;}catch(error){try{db.exec('ROLLBACK')}catch{}throw error;}}};
}
function rawTables(db){return Object.fromEntries(['form_meta','form_singleton','form_entity','form_session','form_set'].map(name=>[name,db.prepare('SELECT * FROM '+name+' ORDER BY rowid').all().map(x=>({...x}))]));}
module.exports={seedV10,port,rawTables};
