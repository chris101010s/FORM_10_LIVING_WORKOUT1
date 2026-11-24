// Early, dependency-free integrity check for the GitHub macOS workflow.
// Checks source files before spending minutes on npm/Xcode.
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const required = [
  'src/utils/livingWorkout.ts', 'src/features/workout/LivingComponents.tsx', 'tests/test-living-workout.cjs', 'App.tsx', 'app.json', 'app.config.js', 'package.json',
  'modules/form-health/ios/FormHealthModule.swift', 'modules/form-health/ios/FormBackupCrypto.swift', 'modules/form-health/ios/FormHealth.podspec', 'modules/form-health/expo-module.config.json',
  'src/widgets/TrainingWidget.tsx', 'src/widgets/TrainingActivity.tsx', 'tests/test-native-features.cjs',
  'src/data/schema.ts', 'src/screens/Gym.tsx', 'src/screens/Plans.tsx', 'src/screens/Health.tsx',
  'scripts/fetch-photos.mjs', 'scripts/fetch-fonts.mjs', 'src/catalog/photos.generated.ts', 'src/components/fonts.generated.ts',
  'src/catalog/exercises.generated.json',
  'scripts/build-ios-unsigned.sh', 'scripts/test-apple-crypto.sh', 'src/components/BackupCenter.tsx', 'src/components/BlockEditor.tsx', 'tests/test-form84.cjs',
  '.github/workflows/ios-unsigned.yml',
];
let errors = 0;
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) {
    console.error(`FEHLT: ${relative}  — die Datei muss im GitHub-Repository enthalten sein.`);
    errors++;
  }
}
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
if (!/^\/ios\/$/m.test(gitignore) || /^ios\/$/m.test(gitignore)) {
  console.error('FALSCH: .gitignore muss /ios/ statt ios/ enthalten (sonst fehlt der Swift-Quellcode).');
  errors++;
}
if (fs.existsSync(path.join(root,'.git'))) try {
  const tracked = cp.execFileSync('git',['ls-files','--cached','--full-name'],{cwd:root,encoding:'utf8'}).split(/\r?\n/);
  const set = new Set(tracked);
  // After checkout, ensure every required file was actually committed.
  for (const file of required) if (!set.has(file)) {
    console.error(`NICHT IM GIT-COMMIT: ${file}. GitHub Actions kann die Datei nicht sehen.`);
    errors++;
  }
} catch (e) { console.error('git ls-files nicht verfügbar:',e.message); errors++; }
if (errors) {
  console.error(`\nABBRUCH: ${errors} Projekt-/Git-Fehler. Bitte korrigieren und erneut pushen.`);
  process.exit(1);
}
console.log('PASS: Kernquellen und Git-Tracking vorhanden.');
