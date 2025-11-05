#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_PATTERNS = [
  /\.d\.ts$/,
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /dist/,
  /build/
];

// Statistiques
let stats = {
  totalFiles: 0,
  totalExports: 0,
  unusedExports: 0,
  files: []
};

// Fonction pour vérifier si un fichier doit être ignoré
function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

// Fonction pour extraire les exports d'un fichier
function extractExports(filePath, content) {
  const exports = [];
  
  // Export nommés: export const/function/class/interface/type
  const namedExports = content.match(/export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g);
  if (namedExports) {
    namedExports.forEach(exportStr => {
      const match = exportStr.match(/export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/);
      if (match) {
        exports.push({
          name: match[1],
          type: 'named',
          line: content.substring(0, content.indexOf(exportStr)).split('\n').length
        });
      }
    });
  }
  
  // Export default
  const defaultExport = content.match(/export\s+default\s+(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|(\w+))/);
  if (defaultExport) {
    const name = defaultExport[1] || defaultExport[2] || defaultExport[3] || defaultExport[4] || 'default';
    exports.push({
      name,
      type: 'default',
      line: content.substring(0, content.indexOf(defaultExport[0])).split('\n').length
    });
  }
  
  // Export avec as
  const asExports = content.match(/export\s*\{\s*[^}]*\s+as\s+(\w+)/g);
  if (asExports) {
    asExports.forEach(exportStr => {
      const match = exportStr.match(/as\s+(\w+)/);
      if (match) {
        exports.push({
          name: match[1],
          type: 'named',
          line: content.substring(0, content.indexOf(exportStr)).split('\n').length
        });
      }
    });
  }
  
  return exports;
}

// Fonction pour vérifier si un export est utilisé
function isExportUsed(exportName, filePath, allFiles) {
  // Chercher dans tous les fichiers
  for (const file of allFiles) {
    if (file.path === filePath) continue; // Ne pas chercher dans le même fichier
    
    const content = file.content;
    
    // Import direct: import { exportName } from './file'
    const directImport = new RegExp(`import\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}\\s*from\\s*['"]\\.?/?[^'"]*${path.basename(filePath, path.extname(filePath))}['"]`, 'g');
    if (directImport.test(content)) return true;
    
    // Import avec as: import { something as exportName } from './file'
    const asImport = new RegExp(`import\\s*\\{[^}]*\\bas\\s+${exportName}\\b[^}]*\\}\\s*from\\s*['"]\\.?/?[^'"]*${path.basename(filePath, path.extname(filePath))}['"]`, 'g');
    if (asImport.test(content)) return true;
    
    // Import namespace: import * as something from './file' puis usage de something.exportName
    const namespaceImport = new RegExp(`import\\s*\\*\\s+as\\s+\\w+\\s*from\\s*['"]\\.?/?[^'"]*${path.basename(filePath, path.extname(filePath))}['"]`, 'g');
    if (namespaceImport.test(content)) {
      const namespaceMatch = content.match(namespaceImport);
      if (namespaceMatch) {
        const namespaceName = namespaceMatch[0].match(/import\s*\*\s+as\s+(\w+)/)[1];
        const namespaceUsage = new RegExp(`\\b${namespaceName}\\.${exportName}\\b`, 'g');
        if (namespaceUsage.test(content)) return true;
      }
    }
    
    // Import default: import exportName from './file'
    const defaultImport = new RegExp(`import\\s+${exportName}\\s+from\\s*['"]\\.?/?[^'"]*${path.basename(filePath, path.extname(filePath))}['"]`, 'g');
    if (defaultImport.test(content)) return true;
  }
  
  return false;
}

// Fonction pour scanner un répertoire
function scanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldIgnoreFile(filePath)) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext) && !shouldIgnoreFile(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const exports = extractExports(filePath, content);
          
          stats.totalFiles++;
          stats.totalExports += exports.length;
          
          const fileInfo = {
            path: filePath,
            exports: exports.map(exp => ({
              ...exp,
              used: isExportUsed(exp.name, filePath, [])
            }))
          };
          
          stats.files.push(fileInfo);
          
          // Compter les exports non utilisés
          const unusedCount = fileInfo.exports.filter(exp => !exp.used).length;
          stats.unusedExports += unusedCount;
          
        } catch (error) {
          console.warn(`Erreur lors de la lecture de ${filePath}:`, error.message);
        }
      }
    }
  }
}

// Fonction principale
function main() {
  console.log('🔍 Recherche de code mort dans le frontend...\n');
  
  if (!fs.existsSync(FRONTEND_DIR)) {
    console.error(`❌ Le répertoire ${FRONTEND_DIR} n'existe pas`);
    process.exit(1);
  }
  
  // Scanner tous les fichiers
  scanDirectory(FRONTEND_DIR);
  
  // Maintenant vérifier les usages avec tous les fichiers chargés
  console.log('📊 Vérification des usages...');
  for (const file of stats.files) {
    for (const exp of file.exports) {
      exp.used = isExportUsed(exp.name, file.path, stats.files);
    }
  }
  
  // Recalculer les statistiques
  stats.unusedExports = 0;
  for (const file of stats.files) {
    const unusedCount = file.exports.filter(exp => !exp.used).length;
    stats.unusedExports += unusedCount;
  }
  
  // Afficher les résultats
  console.log('\n📈 Statistiques:');
  console.log(`   Fichiers analysés: ${stats.totalFiles}`);
  console.log(`   Exports totaux: ${stats.totalExports}`);
  console.log(`   Exports non utilisés: ${stats.unusedExports}`);
  console.log(`   Taux d'utilisation: ${((stats.totalExports - stats.unusedExports) / stats.totalExports * 100).toFixed(1)}%`);
  
  // Afficher les exports non utilisés
  if (stats.unusedExports > 0) {
    console.log('\n🚨 Exports non utilisés:');
    for (const file of stats.files) {
      const unusedExports = file.exports.filter(exp => !exp.used);
      if (unusedExports.length > 0) {
        console.log(`\n📁 ${file.path}:`);
        for (const exp of unusedExports) {
          console.log(`   Ligne ${exp.line}: ${exp.type} export '${exp.name}'`);
        }
      }
    }
  } else {
    console.log('\n✅ Aucun export non utilisé trouvé!');
  }
}

// Exécuter
main();
