const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const [mode,file]=process.argv.slice(2);
if(!['unsigned','healthkit-signed'].includes(mode)||!file||!fs.existsSync(file))throw Error('Usage: node scripts/release-manifest.cjs unsigned|healthkit-signed IPA_PATH');
const app=require('../app.json').expo,buffer=fs.readFileSync(file),sha256=crypto.createHash('sha256').update(buffer).digest('hex');
const checkFile=path.resolve('artifacts/check-status.json');
const checks=fs.existsSync(checkFile)?JSON.parse(fs.readFileSync(checkFile,'utf8')).checks:[];
const manifest={version:app.version,displayName:app.name,bundleIdentifier:app.ios.bundleIdentifier,scheme:app.scheme,buildNumber:app.ios.buildNumber,mode,healthKit:mode==='healthkit-signed',widgets:false,customTabs:process.env.EXPO_PUBLIC_FORM_CUSTOM_TABS==='1',checks,checkEvidence:checks.length?'Recorded command exits; see associated logs':'No local test attestation supplied',nativeCompile:'xcodebuild completed; see xcodebuild log',deviceUpgrade:'not established by build',yazioRoundtrip:'not established by build',commit:process.env.GITHUB_SHA||null,builtAt:new Date().toISOString(),node:process.version,xcode:cp.execFileSync('xcodebuild',['-version'],{encoding:'utf8'}).trim(),file:path.basename(file),sizeBytes:buffer.length,sha256};
const stem=file.replace(/\.ipa$/i,'');fs.writeFileSync(stem+'.manifest.json',JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(stem+'.sha256',`${sha256}  ${path.basename(file)}\n`);
console.log(`${path.basename(file)} SHA-256 ${sha256}`);
