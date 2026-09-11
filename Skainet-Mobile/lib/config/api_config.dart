import 'package:flutter/foundation.dart' show kIsWeb;

// ══════════════════════════════════════════════════
// CONFIGURACIÓN DE API - SKAINET WORKSHOP
// ══════════════════════════════════════════════════
//
// INSTRUCCIONES:
// 1. Despliega el backend en Render.com
// 2. Copia la URL que te da Render (ej: https://skainet-backend-xxxx.onrender.com)
// 3. Pégala aquí abajo reemplazando la URL actual
//
// NOTA: En la nube usa HTTPS, en local usa HTTP
// ══════════════════════════════════════════════════

/// URL del backend desplegado en Render.com
/// ⚡ CAMBIA ESTA URL después de desplegar en Render
const String _cloudUrl = 'http://10.31.30.34:3000';

/// URL local para desarrollo en Chrome
const String _localUrl = 'http://localhost:3000';

/// Selecciona automáticamente la URL según la plataforma
String apiBaseUrl = kIsWeb ? _localUrl : _cloudUrl;

/// Permite modificar la URL de la API dinámicamente en caliente
void setApiBaseUrl(String newUrl) {
  apiBaseUrl = newUrl;
}

