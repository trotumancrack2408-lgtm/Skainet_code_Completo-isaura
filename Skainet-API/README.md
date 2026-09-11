# 🚀 Skainet-API — Servidor REST Principal

Módulo central de API REST para la plataforma de gestión de taller de joyería Skainet. Atiende a las aplicaciones cliente: **Skainet-Frontend (React)** y **Skainet-Mobile (Flutter)**.

## 📌 Módulos y Endpoints REST

- **Autenticación (`/auth`)**: Login, generación de tokens JWT, cambio de contraseña obligatoria y roles de usuario.
- **Usuarios (`/users`)**: Administración de personal, joyeros y administradores.
- **Pedidos de Clientes (`/client-orders`)**: Registro de pedidos por clientes y tracking público de estado.
- **Órdenes de Trabajo (`/orders`)**: Gestión de órdenes de fabricación, asignación de joyero y control de anillos/lotes.
- **Inventario (`/inventory`)**: Kárdex y control de existencias de oro, plata y gemas.
- **Pesajes y Fases (`/production-logs`)**: Registro de pesajes triples y tiempos por estación de trabajo.
- **Búsqueda Global (`/search`)**: Consulta unificada de órdenes, clientes y lotes.
- **Métricas y Estadísticas (`/stats`)**: Reportes e indicadores de rendimiento del taller.
- **Alertas y Auditoría (`/alerts`, `/audit`)**: Visualización de eventos del sistema.

## 🔌 Puerto y Swagger
- **Puerto:** `3000`
- **Documentación Swagger:** `http://localhost:3000/api`

## 🏃‍♂️ Ejecución
```bash
iniciar_api.bat
```
