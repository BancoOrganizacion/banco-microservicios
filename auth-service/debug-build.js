// Guardar como debug-build.js y ejecutar con: node debug-build.js
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

console.log('=== Diagnóstico de compilación NestJS ===');

// Verificar estructura de archivos
console.log('\n1. Verificando estructura de archivos:');
const requiredFiles = ['src/main.ts', 'tsconfig.json', 'package.json'];
for (const file of requiredFiles) {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? 'Existe ✓' : 'No existe ✗'}`);
}

// Verificar tsconfig.json
console.log('\n2. Verificando configuración de TypeScript:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log(`- outDir: ${tsconfig.compilerOptions.outDir}`);
  console.log(`- baseUrl: ${tsconfig.compilerOptions.baseUrl}`);
  console.log(`- module: ${tsconfig.compilerOptions.module}`);
} catch (err) {
  console.error('Error al leer tsconfig.json:', err.message);
}

// Verificar package.json
console.log('\n3. Verificando package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`- Nombre: ${pkg.name}`);
  console.log(`- Scripts de construcción:`);
  Object.entries(pkg.scripts)
    .filter(([name]) => name.includes('build') || name.includes('start'))
    .forEach(([name, script]) => {
      console.log(`  * ${name}: ${script}`);
    });
  
  console.log('- Dependencias de NestJS:');
  const nestDeps = Object.entries({...pkg.dependencies, ...pkg.devDependencies})
    .filter(([name]) => name.includes('@nestjs'))
    .forEach(([name, version]) => {
      console.log(`  * ${name}: ${version}`);
    });
} catch (err) {
  console.error('Error al leer package.json:', err.message);
}

// Intentar compilación manual
console.log('\n4. Intentando compilación manual con tsc:');
exec('npx tsc --project tsconfig.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al compilar: ${error.message}`);
    console.error(stderr);
    return;
  }
  
  console.log('Compilación completada. Verificando dist/main.js:');
  const mainJsExists = fs.existsSync('dist/main.js');
  console.log(`dist/main.js: ${mainJsExists ? 'Existe ✓' : 'No existe ✗'}`);
  
  if (mainJsExists) {
    console.log('Contenido del directorio dist:');
    const distFiles = fs.readdirSync('dist');
    distFiles.forEach(file => {
      console.log(` - ${file}`);
    });
  } else {
    console.log('Explorando directorio dist (si existe):');
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist');
      if (distFiles.length > 0) {
        console.log('Archivos encontrados en dist:');
        distFiles.forEach(file => {
          console.log(` - ${file}`);
        });
      } else {
        console.log('El directorio dist está vacío.');
      }
    } else {
      console.log('El directorio dist no existe.');
    }
  }
});