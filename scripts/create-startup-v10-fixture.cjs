'use strict';

// Synthetic simulator inputs only. Never reads an installed app or user backup.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {seedV10}=require('../tests/fixtures/sqlite-helpers.cjs');

const root=path.resolve(__dirname,'..');
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourcePath=path.join(root,'tests/fixtures/v10-existing.json');
const schemaPath=path.join(root,'tests/fixtures/v10-schema.sql');
const expectedSchemaHash='575a86ed0e4857b68983c288f68a13bbd0e9d0bf33cc4ef2b28c78431f271a13';

function createFixtures(outputDirectory){
 const output=path.resolve(outputDirectory);
 const sourceBytes=fs.readFileSync(sourcePath),schemaBytes=fs.readFileSync(schemaPath);
 // This fixture was compared with the actual supplied FORM10 relationalSchema.
 // Only comments, whitespace and IF NOT EXISTS differ; no newer schema is used.
 assert.equal(sha256(schemaBytes),expectedSchemaHash,'Recheck a changed fixture schema against the supplied FORM10 schema before using it for startup testing.');
 const source=JSON.parse(sourceBytes);
 assert.equal(source.profile.onboarded,true,'Upgrade smoke must reach Main, not SetupScreen.');
 assert.equal(source.workouts.length,2);assert.equal(source.weights.length,3);
 assert.ok(source.live,'The live smoke requires a real legacy session fixture.');
 for(const name of ['home','live'])assert.equal(fs.existsSync(path.join(output,name)),false,'Refusing to overwrite an existing fixture directory.');
 assert.equal(fs.existsSync(path.join(output,'manifest.json')),false,'Refusing to overwrite a fixture manifest.');
 fs.mkdirSync(output,{recursive:true});
 const cases=[];
 for(const name of ['home','live']){
  const data=structuredClone(source);
  if(name==='home')data.live=null;
  const directory=path.join(output,name),file=path.join(directory,'form-v84-clean.db');
  fs.mkdirSync(directory);
  const db=new DatabaseSync(file);
  try{
   seedV10(db,data);
   assert.equal(db.prepare('SELECT version FROM form_meta WHERE id=1').get().version,8);
   assert.equal(JSON.parse(db.prepare("SELECT payload FROM form_singleton WHERE key='profile'").get().payload).onboarded,true);
   assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
   assert.equal(Object.values(db.prepare('PRAGMA integrity_check').get())[0],'ok');
   const checkpoint=db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();
   assert.equal(checkpoint.busy,0,'WAL checkpoint must finish before the database is copied.');
  }finally{db.close();}
  // Reopen the closed file: the main DB alone must contain every synthetic row.
  const read=new DatabaseSync(file,{readOnly:true});
  let counts;
  try{
   counts={workouts:read.prepare("SELECT count(*) n FROM form_session WHERE scope='history'").get().n,weights:read.prepare("SELECT count(*) n FROM form_entity WHERE collection='weights'").get().n,liveSessions:read.prepare("SELECT count(*) n FROM form_session WHERE scope='live'").get().n,historySets:read.prepare("SELECT count(*) n FROM form_set WHERE scope='history'").get().n,liveSets:read.prepare("SELECT count(*) n FROM form_set WHERE scope='live'").get().n};
   assert.deepEqual(counts,{workouts:2,weights:3,liveSessions:name==='live'?1:0,historySets:2,liveSets:name==='live'?1:0});
   assert.equal(read.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name='form_planned_row'").get().n,0,'Input must remain FORM10, before migration.');
  }finally{read.close();}
  const bytes=fs.readFileSync(file);
  cases.push({name,file:path.relative(output,file).split(path.sep).join('/'),byteLength:bytes.length,sha256:sha256(bytes),databaseSchema:8,jsonSchema:4,onboarded:true,expectedRoute:name==='live'?'gym':'home',counts,expectedAfterMigration:{databaseSchema:9,workoutIds:data.workouts.map(w=>w.id),weightIds:data.weights.map(w=>w.id),liveId:data.live?.id??null,liveName:data.live?.name??null,liveDrafts:data.live?.drafts??null}});
 }
 const manifest={format:'FORM-Synthetic-Startup-Fixtures-v1',synthetic:true,source:{data:'tests/fixtures/v10-existing.json',dataSha256:sha256(sourceBytes),schema:'tests/fixtures/v10-schema.sql',schemaSha256:sha256(schemaBytes),schemaComparedWith:'Supplied FORM10 src/data/relational.ts; whitespace/comments/IF NOT EXISTS normalized'},simulatorDatabasePath:'Documents/SQLite/form-v84-clean.db',usage:'Use only a newly created CI simulator test installation. Stop the app, copy one closed fixture DB before launch, then verify process, logs, screenshot and migration. Do not copy into a personal device or existing user container.',cases};
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return manifest;
}

if(require.main===module){
 try{
  assert.equal(process.argv.length,3,'Usage: node scripts/create-startup-v10-fixture.cjs <output-directory>');
  const manifest=createFixtures(process.argv[2]);
  console.log(JSON.stringify(manifest,null,2));
 }catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
}
module.exports={createFixtures};
