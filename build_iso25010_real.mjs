import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = 'outputs/iso25010_real';
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const summary = wb.worksheets.add('Resumen real');
const evidence = wb.worksheets.add('Evidencia verificada');

const rows = [
  ['Adecuación funcional','AF-COM-01','Requisitos funcionales cubiertos por pruebas','239 pruebas Jest aprobadas; no hay trazabilidad completa a 22 requisitos.',3],
  ['Adecuación funcional','AF-COM-02','Flujos jerárquicos y navegación','Módulos web, API y móvil existentes; no hay prueba de aceptación completa.',2],
  ['Adecuación funcional','AF-COR-01','Inventario y kardex consistentes','Tablas PostgreSQL, DML de evidencia y pruebas de inventario.',3],
  ['Adecuación funcional','AF-COR-02','Tres pesajes y discrepancias','Módulo y pruebas presentes; falta demostración integral en producción.',2],
  ['Adecuación funcional','AF-PER-01','Roles ven solo funciones permitidas','JWT y reglas por rol comprobadas en servicios y controladores.',3],
  ['Eficiencia de rendimiento','ER-TIEM-01','P95 de login, inventario, kardex y búsqueda ≤ 3 s','No existe medición P95 ni reporte de rendimiento.',0],
  ['Eficiencia de rendimiento','ER-TIEM-02','P95 de movimientos y pesajes ≤ 3 s','No existe medición P95 ni reporte de rendimiento.',0],
  ['Eficiencia de rendimiento','ER-REC-01','CPU, memoria y conexiones controladas','No hay métricas ni monitoreo documentado.',0],
  ['Eficiencia de rendimiento','ER-CAP-01','Prueba de concurrencia','No hay prueba de carga o concurrencia.',0],
  ['Compatibilidad','CO-COE-01','Convivencia web y móvil','React/Vite, API NestJS y Flutter existen; sin prueba cruzada ejecutada.',1],
  ['Compatibilidad','CO-INT-01','Contratos entre web, API y móvil','API REST y clientes existen; sin evidencia de contrato integrado.',1],
  ['Compatibilidad','CO-INT-02','Comunicación con báscula y datos inválidos','No hay evidencia de prueba con hardware real.',0],
  ['Usabilidad','US-SAT-01','Pruebas con usuarios y encuesta','No hay encuesta ni acta de prueba con usuarios.',0],
  ['Usabilidad','US-APR-01','Primer uso de usuario nuevo','No hay evidencia de prueba de aprendizaje.',0],
  ['Usabilidad','US-OP-01','Navegación de tareas','Hay pruebas Cypress configuradas, sin ejecución verificada.',1],
  ['Usabilidad','US-PRO-01','Prevención de errores','Hay validaciones puntuales; falta prueba UX documentada.',1],
  ['Usabilidad','US-EST-01','Diseño visual validado','No hay evaluación visual con usuarios.',0],
  ['Usabilidad','US-ACC-01','Cumplimiento WCAG 2.1 AA','No hay auditoría de accesibilidad.',0],
  ['Fiabilidad','FI-MAD-01','Registro y análisis de incidentes','Existe AuditLog, pero no métricas ni análisis de incidentes.',2],
  ['Fiabilidad','FI-DIS-01','Disponibilidad mensual ≥ 99%','No hay historial de disponibilidad.',0],
  ['Fiabilidad','FI-TOL-01','Operaciones atómicas sin estado parcial','Hay lógica de negocio y pruebas; no se verificaron transacciones atómicas completas.',1],
  ['Fiabilidad','FI-REC-01','Restauración y RPO/RTO','Existe backup SQL; no existe restauración comprobada ni tiempos RPO/RTO.',1],
  ['Seguridad','SE-CON-01','Hash de contraseñas y TLS','Hash scrypt confirmado. La API local usa HTTP, sin TLS.',2],
  ['Seguridad','SE-INT-01','Validación y autorización','JWT, guardas y reglas de rol implementadas.',3],
  ['Seguridad','SE-NR-01','Auditoría no repudiable/inmutable','AuditLog existe, pero no se garantiza inmutabilidad.',2],
  ['Seguridad','SE-AUT-01','Roles, cuentas inactivas y cambio de clave','Roles, estado y cambio obligatorio de contraseña implementados.',3],
  ['Mantenibilidad','MA-MOD-01','Arquitectura modular','API separada por módulos y servicios.',3],
  ['Mantenibilidad','MA-REU-01','Reutilización y baja duplicación','No hay métrica de duplicación ejecutada.',1],
  ['Mantenibilidad','MA-ANA-01','Trazabilidad mediante logs','AuditLog está implementado; falta correlación integral.',2],
  ['Mantenibilidad','MA-MODI-01','Cambio controlado','Compilación y pruebas verificadas; sin flujo formal de cambios.',2],
  ['Mantenibilidad','MA-PRU-01','Pruebas y pipeline automático','239 Jest aprobadas, Cypress configurado, Sonar configurado; no hay CI ejecutado.',2],
  ['Portabilidad','PO-ADA-01','Ejecución en navegador y móvil','Web y Flutter existen; no hay matriz de dispositivos probada.',1],
  ['Portabilidad','PO-INS-01','Instalación limpia','No hay evidencia de instalación limpia reproducible.',0],
  ['Portabilidad','PO-REP-01','Exportar, backup y restaurar','Dump PostgreSQL generado; restauración no comprobada.',2],
];

summary.showGridLines = false;
summary.getRange('A2:F2').merge();
summary.getRange('A2').values = [['Matriz ISO/IEC 25010 – evidencia real del proyecto Skainet']];
summary.getRange('A2:F2').format = { font: { name: 'Arial', size: 14, bold: true, color: '#17365D' }, horizontalAlignment: 'left', verticalAlignment: 'center' };
summary.getRange('A3:F3').merge();
summary.getRange('A3').values = [['Escala: 0 = sin evidencia; 1 = código/configuración; 2 = evidencia parcial; 3 = evidencia verificada. No equivale a certificación ISO.']];
summary.getRange('A3').format = { font: { name: 'Arial', size: 10, italic: true, color: '#555555' } };
summary.getRange('A5:F5').values = [['Característica','Criterios','Promedio','Cobertura con evidencia','Estado','Conclusión']];
const categories = [...new Set(rows.map(r => r[0]))];
summary.getRange(`A6:A${5+categories.length}`).values = categories.map(c => [c]);
summary.getRange(`B6:B${5+categories.length}`).formulas = categories.map((_, i) => [`=COUNTIF('Evidencia verificada'!$A$5:$A$39,A${i+6})`]);
summary.getRange(`C6:C${5+categories.length}`).formulas = categories.map((_, i) => [`=AVERAGEIF('Evidencia verificada'!$A$5:$A$39,A${i+6},'Evidencia verificada'!$E$5:$E$39)`]);
summary.getRange(`D6:D${5+categories.length}`).formulas = categories.map((_, i) => [`=COUNTIFS('Evidencia verificada'!$A$5:$A$39,A${i+6},'Evidencia verificada'!$E$5:$E$39,">=2")/B${i+6}`]);
summary.getRange(`E6:E${5+categories.length}`).formulas = categories.map((_, i) => [`=IF(C${i+6}>=2.5,"Sustentado",IF(C${i+6}>=1,"Parcial","Pendiente"))`]);
summary.getRange(`F6:F${5+categories.length}`).values = [
  ['Pruebas y base de datos sustentan los procesos principales.'],['No hay métricas de desempeño.'],['Tecnologías coexistentes, sin validación cruzada.'],['Faltan pruebas con usuarios y accesibilidad.'],['Faltan operación sostenida y restauración.'],['Hash, JWT y roles; TLS e inmutabilidad pendientes.'],['Diseño modular y pruebas; falta CI y métricas.'],['Faltan pruebas de instalación y dispositivos.']
];
summary.getRange(`A${7+categories.length}:B${7+categories.length}`).values = [['Resultado global','Promedio verificable']];
summary.getRange(`C${7+categories.length}`).formulas = [[`=AVERAGE('Evidencia verificada'!E5:E39)`]];
summary.getRange(`D${7+categories.length}:F${7+categories.length}`).merge();
summary.getRange(`D${7+categories.length}`).values = [['El proyecto tiene una base funcional comprobable, pero no está 100% aprobado.']];

evidence.showGridLines = false;
evidence.getRange('A2:F2').merge();
evidence.getRange('A2').values = [['Detalle de evidencia revisada']];
evidence.getRange('A2:F2').format = { font: { name: 'Arial', size: 14, bold: true, color: '#17365D' } };
evidence.getRange('A3:F3').merge();
evidence.getRange('A3').values = [['Fuentes revisadas: código Skainet-API, configuración React/Vite y Flutter, PostgreSQL local, pruebas Jest, Cypress configurado y dump SQL.']];
evidence.getRange('A3').format = { font: { name: 'Arial', size: 10, italic: true, color: '#555555' } };
evidence.getRange('A5:F5').values = [['Característica','ID','Criterio','Evidencia comprobada','Puntaje','Estado']];
evidence.getRange(`A6:E${5+rows.length}`).values = rows.map(r => r.slice(0,5));
evidence.getRange(`F6:F${5+rows.length}`).formulas = rows.map((_, i) => [`=IF(E${i+6}=0,"Pendiente",IF(E${i+6}=1,"Código/configuración",IF(E${i+6}=2,"Parcial","Verificado")))`]);

for (const sheet of [summary, evidence]) {
  sheet.getRange('A1:F50').format.font = { name: 'Arial', size: 10, color: '#222222' };
  sheet.getRange('A5:F5').format = { fill: '#1F4E78', font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center' };
  sheet.getRange('A5:F50').format.verticalAlignment = 'center';
  sheet.getRange('A5:F50').format.borders = { preset: 'all', style: 'thin', color: '#D9E2F3' };
  sheet.freezePanes.freezeRows(5);
}
summary.getRange('C6:C14').format.numberFormat = '0.0';
summary.getRange('D6:D13').format.numberFormat = '0.0%';
summary.getRange(`C${7+categories.length}`).format.numberFormat = '0.0';
summary.getRange(`A${7+categories.length}:F${7+categories.length}`).format = { fill: '#D9EAD3', font: { name: 'Arial', size: 10, bold: true, color: '#274E13' }, borders: { preset: 'all', style: 'thin', color: '#93C47D' } };
summary.getRange('A6:F13').format.wrapText = true;
evidence.getRange('A6:F39').format.wrapText = true;
evidence.getRange('E6:E39').format.horizontalAlignment = 'center';
summary.getRange('A:A').format.columnWidth = 24;
summary.getRange('B:B').format.columnWidth = 12;
summary.getRange('C:C').format.columnWidth = 12;
summary.getRange('D:D').format.columnWidth = 20;
summary.getRange('E:E').format.columnWidth = 14;
summary.getRange('F:F').format.columnWidth = 52;
evidence.getRange('A:A').format.columnWidth = 24;
evidence.getRange('B:B').format.columnWidth = 14;
evidence.getRange('C:C').format.columnWidth = 36;
evidence.getRange('D:D').format.columnWidth = 68;
evidence.getRange('E:E').format.columnWidth = 10;
evidence.getRange('F:F').format.columnWidth = 20;
summary.getRange('A2:F2').format.rowHeight = 26;
evidence.getRange('A2:F2').format.rowHeight = 26;

wb.recalculate();
const check = await wb.inspect({ kind: 'table', range: 'Resumen real!A2:F14', include: 'values,formulas', tableMaxRows: 14, tableMaxCols: 6 });
console.log(check.ndjson);
const errors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 100 }, summary: 'formula errors' });
console.log(errors.ndjson);
const preview = await wb.render({ sheetName: 'Resumen real', range: 'A2:F15', scale: 1.5, format: 'png' });
await fs.writeFile(`${outputDir}/preview_resumen.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(`${outputDir}/Matriz_ISO_25010_Evidencia_Real_Skainet.xlsx`);
