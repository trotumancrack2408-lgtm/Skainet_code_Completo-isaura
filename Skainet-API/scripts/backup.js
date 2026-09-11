const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuración de rutas
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const LOG_FILE = path.join(BACKUP_DIR, 'backup_log.txt');

// Asegurar que exista la carpeta de backups
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getFormattedTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function calculateSHA256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function verifySqliteHeader(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(16);
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);
  const header = buffer.toString('utf-8', 0, 15);
  return header === 'SQLite format 3';
}

async function runBackup() {
  console.log('📦 Iniciando proceso de respaldo (Skainet RV)...');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Error: No se encontró la base de datos origen en ${DB_PATH}`);
    process.exit(1);
  }

  const timestamp = getFormattedTimestamp();
  const backupFileName = `backup_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  // 1. Copia física del archivo SQLite (Respaldo Full)
  fs.copyFileSync(DB_PATH, backupFilePath);

  // 2. Verificación de Integridad y Cabecera
  const stats = fs.statSync(backupFilePath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);
  const isHeaderValid = verifySqliteHeader(backupFilePath);
  const sha256Hash = calculateSHA256(backupFilePath);

  let status = isHeaderValid && stats.size > 0 ? 'EXITOSO' : 'CORRUPTO';

  // Intenta validación adicional con sqlite3 si está instalado en el sistema
  try {
    const pragmaCheck = execSync(`sqlite3 "${backupFilePath}" "PRAGMA integrity_check;"`, { encoding: 'utf8' }).trim();
    if (pragmaCheck !== 'ok') {
      status = 'CORRUPTO';
    }
  } catch (err) {
    // Si no está sqlite3 CLI instalado, confiamos en la validación de cabecera y tamaño
  }

  // 3. Registro de Evidencias (backup_log.txt)
  const logEntry = `[${new Date().toISOString()}] | ARCHIVO: ${backupFileName} | TAMAÑO: ${fileSizeKB} KB | HASH SHA-256: ${sha256Hash} | ESTADO: ${status}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);

  console.log('✅ Respaldo generado correctamente:');
  console.log(`   - Archivo: ${backupFileName}`);
  console.log(`   - Tamaño: ${fileSizeKB} KB`);
  console.log(`   - Hash SHA-256: ${sha256Hash}`);
  console.log(`   - Estado de integridad: ${status}`);
  console.log(`   - Evidencia registrada en: ${LOG_FILE}`);

  // 4. Retención de respaldos (conservar los últimos 15 respaldos)
  cleanOldBackups(15);
}

function cleanOldBackups(maxBackups) {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);

  if (files.length > maxBackups) {
    const toDelete = files.slice(maxBackups);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🧹 Respaldo antiguo eliminado por política de retención: ${file.name}`);
    });
  }
}

runBackup().catch(err => {
  console.error('❌ Error ejecutando respaldo:', err);
  process.exit(1);
});
