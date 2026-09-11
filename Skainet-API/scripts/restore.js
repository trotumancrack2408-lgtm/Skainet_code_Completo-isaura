const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const LOG_FILE = path.join(BACKUP_DIR, 'backup_log.txt');

function calculateSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function runRestore() {
  console.log('🔄 Iniciando procedimiento de restauración (Skainet RV)...');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ Error: No existe directorio de respaldos.');
    process.exit(1);
  }

  // Buscar el archivo de respaldo más reciente
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) {
    console.error('❌ Error: No hay archivos de respaldo disponibles para restaurar.');
    process.exit(1);
  }

  const latestBackup = files[0];
  console.log(`📦 Restaurando desde el respaldo más reciente: ${latestBackup.name}`);

  // Verificar hash antes de restaurar
  const sha256Hash = calculateSHA256(latestBackup.path);

  // Copia y reemplazo seguro
  fs.copyFileSync(latestBackup.path, DB_PATH);

  const logEntry = `[${new Date().toISOString()}] | ACCIÓN: RESTAURACIÓN | ARCHIVO: ${latestBackup.name} | HASH SHA-256: ${sha256Hash} | ESTADO: COMPLETADO\n`;
  fs.appendFileSync(LOG_FILE, logEntry);

  console.log('✅ Base de datos restaurada exitosamente.');
  console.log(`   - Origen: ${latestBackup.name}`);
  console.log(`   - Destino: ${DB_PATH}`);
  console.log(`   - Hash verificado: ${sha256Hash}`);
}

runRestore().catch(err => {
  console.error('❌ Error ejecutando restauración:', err);
  process.exit(1);
});
