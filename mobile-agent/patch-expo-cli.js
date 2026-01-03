// Script pour patcher Expo CLI après npm install
// Usage: node patch-expo-cli.js

const fs = require('fs');
const path = require('path');

const externalsFile = path.join(__dirname, 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js');

if (!fs.existsSync(externalsFile)) {
  console.log('Fichier externals.js non trouvé. Expo CLI n\'est peut-être pas installé.');
  process.exit(1);
}

let content = fs.readFileSync(externalsFile, 'utf8');

// Patch 1: getNodeExternalModuleId
if (!content.includes('safeModuleId = moduleId.replace(/:/g')) {
  content = content.replace(
    /function getNodeExternalModuleId\(fromModule, moduleId\) \{[\s\S]*?return _path\.default\.relative\(_path\.default\.dirname\(fromModule\), _path\.default\.join\(METRO_EXTERNALS_FOLDER, moduleId, "index\.js"\)\);/,
    `function getNodeExternalModuleId(fromModule, moduleId) {
    // Fix Windows: Replace ':' with '-' in folder names (node:sea -> node-sea)
    const safeModuleId = moduleId.replace(/:/g, '-');
    return _path.default.relative(_path.default.dirname(fromModule), _path.default.join(METRO_EXTERNALS_FOLDER, safeModuleId, "index.js"));`
  );
}

// Patch 2: tapNodeShims
if (!content.includes('const safeModuleId = moduleId.replace(/:/g')) {
  content = content.replace(
    /async function tapNodeShims\(projectRoot\) \{[\s\S]*?for \(const moduleId of NODE_STDLIB_MODULES\)\{[\s\S]*?const shimDir = _path\.default\.join\(projectRoot, METRO_EXTERNALS_FOLDER, moduleId\);/,
    `async function tapNodeShims(projectRoot) {
    const externals = {};
    for (const moduleId of NODE_STDLIB_MODULES){
        // Fix Windows: Replace ':' with '-' in folder names (node:sea -> node-sea)
        const safeModuleId = moduleId.replace(/:/g, '-');
        const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, safeModuleId);`
  );
}

fs.writeFileSync(externalsFile, content, 'utf8');
console.log('✅ Expo CLI patché avec succès pour Windows!');

