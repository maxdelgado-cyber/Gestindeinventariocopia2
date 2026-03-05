# 🎵 Sistema de Gestión Allegra

Sistema integral de gestión para productora de audio y eventos "Allegra".

## 🔐 Acceso al Sistema

**Usuario:** Administrador  
**Contraseña por defecto:** `allegra2026`

> ⚠️ **Importante:** Cambia la contraseña después del primer acceso desde Configuración → Seguridad

## 📋 Módulos Principales

### 1. 📊 Dashboard
Panel de control con métricas estratégicas:
- Eventos totales y próximos
- Estado del inventario (disponible, reservado, dañado)
- Vehículos disponibles
- Trabajadores activos
- Valor total del inventario
- Capacidad operativa
- Insights y alertas

### 2. 📅 Gestión de Eventos
- Calendario de eventos
- Creación y edición de eventos
- Asignación de equipamiento, vehículos y personal
- Tipos: Corporativo, Concierto, Boda, Privado, Festival, Teatro
- Estados: Próximamente, Cerrado, Cancelado
- Control de montaje y desmontaje

### 3. 📦 Inventario General
- Registro completo de equipamiento
- Estados: Disponible, Reservado, En Mantenimiento, Dañado
- Control de stock por fechas
- Historial de uso por equipo
- Alertas de bajo stock y equipos dañados
- Categorías:
  - Audio (Micrófonos, Altavoces, Mezcladores, Interfaces)
  - Iluminación (Cabezas Móviles, PAR LED, Strobes, Consolas DMX)
  - Video (Pantallas LED, Proyectores, Cámaras, Switchers)
  - Estructura (Truss, Escenarios, Rigging)
  - Energía (Generadores, Distribución)

### 4. 📤 Módulo de Montaje
- Checklist automático de equipamiento por evento
- Descuento automático de inventario
- Registro de responsable de entrega
- Fecha y hora de salida
- Exportación de listas (PDF)

### 5. 📥 Módulo de Desmontaje
- Checklist de equipamiento retornado
- Registro de estado: Correcto, Dañado, Faltante
- Reintegro automático al inventario
- Reportes de incidencias
- Actualización de estado de equipos

### 6. 🚐 Vehículos
- Registro de flota
- Control de disponibilidad
- Historial de mantenimientos
- Alertas de mantenimiento próximo
- Asignación de conductores
- Historial de uso por evento

### 7. 👷 Trabajadores
- Registro de personal
- Habilidades y especialidades
- Disponibilidad semanal
- Asignación a eventos
- Historial de eventos por trabajador
- Visualización de carga laboral

### 8. ⚙️ Configuración
Cuatro secciones:

#### 👤 Perfil
- Actualización de datos personales
- Usuario y email

#### 🔒 Seguridad
- Cambio de contraseña
- Contraseña encriptada con SHA-256

#### 📝 Auditoría
- Registro de todas las acciones en el sistema
- Timestamp y detalles de cada operación
- Trazabilidad completa

#### 🕐 Registro de Accesos
- Intentos de login exitosos y fallidos
- IP de acceso
- Fecha y hora

## 🎯 Características Principales

✅ **Autenticación Segura**
- Acceso con contraseña obligatoria
- Passwords encriptados
- Registro de intentos de acceso

✅ **Gestión Completa de Eventos**
- Calendario visual
- Asignación de recursos
- Control de fechas y disponibilidad

✅ **Control de Inventario**
- Stock en tiempo real
- Historial de uso
- Alertas automáticas
- Control por fechas

✅ **Flujo de Montaje/Desmontaje**
- Checklists automáticos
- Descuento y reintegro de inventario
- Registro de incidencias

✅ **Gestión de Flota**
- Control de vehículos
- Mantenimientos programados
- Asignación de conductores

✅ **Administración de Personal**
- Disponibilidad semanal
- Habilidades
- Carga laboral

✅ **Dashboard Estratégico**
- Métricas clave
- Insights automáticos
- Alertas de recursos
- Capacidad operativa

✅ **Auditoría Completa**
- Registro de todas las acciones
- Trazabilidad
- Intentos de acceso

## 🛠️ Datos de Ejemplo

El sistema incluye datos de demostración:
- **3 eventos** programados (Concierto, Summit, Boda)
- **8 equipos** de inventario (audio, iluminación, estructura)
- **3 vehículos** (camión, van, camioneta)
- **4 trabajadores** con diferentes especialidades

## 💾 Almacenamiento

Los datos se almacenan en Supabase (base de datos en la nube):
- Persistencia permanente
- Backup automático
- Acceso desde cualquier dispositivo
- Sincronización en tiempo real

## 📱 Responsive Design

El sistema es completamente responsive:
- Escritorio (experiencia completa)
- Tablet (navegación optimizada)
- Móvil (acceso desde cualquier lugar)

## 🔄 Flujo de Trabajo Sugerido

1. **Crear Evento** → Asignar fecha, cliente y tipo
2. **Asignar Recursos** → Seleccionar equipamiento, vehículos y personal
3. **Montaje** → Generar checklist y confirmar salida de equipos
4. **Ejecutar Evento** → Personal en terreno
5. **Desmontaje** → Confirmar retorno y estado de equipos
6. **Cerrar Evento** → Marcar como completado

## 🎨 Paleta de Colores

- **Primario:** Púrpura/Índigo (branding Allegra)
- **Secundario:** Azul, Verde, Naranja (estados)
- **Alertas:** Rojo (peligro), Amarillo (advertencia), Verde (éxito)

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema Allegra, contacta al administrador del sistema.

---

© 2026 Allegra - Productora de Audio · Sistema de Gestión Integral v1.0.0
