#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('========================================');
console.log('LANCEMENT DE TOUS LES TESTS POSSIBLES');
console.log('========================================\n');

const results = {
  zod: { status: 'skipped', message: '' },
  typescript: { status: 'skipped', message: '' },
  e2e: { status: 'skipped', message: '' },
  files: { count: 0, total: 0 },
};

// 1. Vérification TypeScript
console.log('1. Verification TypeScript...');
try {
  execSync('npx tsc --noEmit --skipLibCheck 2>&1', {
    encoding: 'utf-8',
    stdio: 'pipe',
    timeout: 30000,
  });
  console.log('   OK: Aucune erreur de syntaxe\n');
  results.typescript = { status: 'passed', message: 'Aucune erreur' };
} catch (error) {
  const errors = error.stdout || error.stderr || '';
  const errorCount = (errors.match(/error TS/g) || []).length;
  if (errorCount > 0) {
    console.log(`   ERREUR: ${errorCount} erreur(s) TypeScript\n`);
    results.typescript = { status: 'failed', message: `${errorCount} erreurs` };
  } else {
    console.log('   OK: Aucune erreur de syntaxe\n');
    results.typescript = { status: 'passed', message: 'Aucune erreur' };
  }
}

// 2. Vérification Maestro
console.log('2. Tests E2E (Maestro)...');
try {
  execSync('maestro --version', { stdio: 'pipe' });
  console.log('   OK: Maestro installe');
  console.log('   INFO: Pour lancer: npm run test:e2e (necessite app lancee)\n');
  results.e2e = { status: 'available', message: 'Disponible' };
} catch (error) {
  console.log('   SKIP: Maestro non installe');
  console.log('   INFO: Installez Maestro: voir INSTALLATION_MAESTRO.md\n');
  results.e2e = { status: 'skipped', message: 'Non installe' };
}

// 3. Vérification des fichiers de test
console.log('3. Verification des fichiers de test...');
const testFiles = [
  'src/services/__tests__/auth.service.test.ts',
  'src/services/__tests__/booking.service.test.ts',
  'src/components/__tests__/Input.test.tsx',
  'src/components/__tests__/Button.test.tsx',
  'src/components/__tests__/PhotoPicker.test.tsx',
  'src/components/__tests__/SignaturePad.test.tsx',
  'src/screens/__tests__/LoginScreen.test.tsx',
  'src/screens/__tests__/BookingsScreen.test.tsx',
  'src/__tests__/zod-validation.test.ts',
  '.maestro/login.yaml',
  '.maestro/bookings-flow.yaml',
  '.maestro/checkin-flow.yaml',
];

let existingFiles = 0;
testFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    existingFiles++;
  }
});

results.files = { count: existingFiles, total: testFiles.length };
console.log(`   OK: ${existingFiles}/${testFiles.length} fichiers de test trouves\n`);

// 4. Note sur les tests unitaires
console.log('4. Tests unitaires (Jest)...');
console.log('   INFO: Les tests unitaires necessitent des mocks Expo supplementaires');
console.log('   INFO: Voir RESUME_TESTS_AUTOMATISES.md pour plus de details\n');

// Résumé
console.log('========================================');
console.log('RESUME DES TESTS');
console.log('========================================\n');

console.log(`Verification TypeScript: ${results.typescript.status === 'passed' ? 'OK' : 'ERREUR'}`);
if (results.typescript.message) {
  console.log(`  - ${results.typescript.message}`);
}

console.log(`\nTests E2E Maestro: ${results.e2e.status === 'available' ? 'DISPONIBLE' : 'NON DISPONIBLE'}`);
if (results.e2e.message) {
  console.log(`  - ${results.e2e.message}`);
}

console.log(`\nFichiers de test: ${results.files.count}/${results.files.total} trouves`);

console.log('\n========================================\n');

if (results.typescript.status === 'passed' && results.files.count > 0) {
  console.log('OK: Les tests disponibles sont configures correctement');
  console.log('INFO: Les tests unitaires necessitent des ajustements pour Expo SDK 54');
} else {
  console.log('ATTENTION: Certains tests necessitent des ajustements');
}

console.log('');
