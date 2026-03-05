# PROMPT COMPLETO PARA CLAUDE CODE — SISTEMA ALLEGRA

---

## CONTEXTO GENERAL DEL PROYECTO

Estás trabajando en **Allegra**, un sistema web de gestión integral para una productora de audio profesional chilena. El sistema está **parcialmente construido** y necesitas continuar su desarrollo desde el estado actual. NO debes reescribir lo que ya existe; debes comprender la arquitectura y continuar construyendo sobre ella.

---

## STACK TECNOLÓGICO

- **React 18 + TypeScript** (Vite)
- **Tailwind CSS v4** (con tema personalizado en `/src/styles/theme.css`)
- **React Router** (modo Data, usando `react-router`, NO `react-router-dom`)
- **shadcn/ui** — componentes UI ya instalados en `/src/app/components/ui/`
- **lucide-react** — iconos
- **sonner** — notificaciones toast (`import { toast } from 'sonner'`)
- **Supabase** — backend + auth (con fallback completo a localStorage cuando el backend no está disponible)
- **localStorage** — almacenamiento principal de datos cuando el backend no está disponible

---

## ARQUITECTURA DE AUTENTICACIÓN

### Flujo de Auth (YA IMPLEMENTADO — NO MODIFICAR)

```
App.tsx → RouterProvider
  └── RootLayout.tsx
        └── AuthProvider (contexto)
              └── AuthGuard (componente)
                    ├── Si NO autenticado → LoginPage
                    └── Si autenticado → Outlet → MainLayout → páginas
```

- **Contraseña por defecto local**: `allegra2026`
- **AuthContext** (`/src/app/contexts/AuthContext.tsx`): maneja `isAuthenticated`, `login()`, `logout()`
- El sistema intenta autenticar contra el backend Supabase primero; si falla, usa la contraseña local
- La sesión se persiste en `localStorage` con la clave `allegra_auth`

### Versioning del localStorage

El sistema tiene un mecanismo de versioning para forzar recarga de datos de ejemplo cuando cambian:

```typescript
// En /src/app/data/initialData.ts
export const INVENTORY_VERSION = 23;
export const VEHICLES_VERSION = 4;
export const EVENTS_VERSION = 4;
export const WORKERS_VERSION = 5;
export const CLIENTS_VERSION = 1;
export const MONTAJES_VERSION = 1;
export const DESMONTAJES_VERSION = 1;
```

Si cambias datos de ejemplo, debes incrementar la versión correspondiente y el sistema limpiará el localStorage al próximo arranque.

---

## ESTRUCTURA DE ARCHIVOS ACTUAL

```
/src/app/
├── App.tsx                          # Entry point: <RouterProvider router={router} />
├── routes.tsx                       # Todas las rutas del sistema
│
├── contexts/
│   └── AuthContext.tsx              # AuthProvider, useAuth hook
│
├── lib/
│   ├── api.ts                       # APIs: eventsAPI, inventoryAPI, vehiclesAPI, workersAPI, clientsAPI, montajesAPI, desmontajesAPI, authAPI
│   ├── availabilityEngine.ts        # Motor de disponibilidad de inventario
│   ├── eventStateMachine.ts         # Máquina de estados de eventos
│   └── rutUtils.ts                  # Formateo de RUT chileno
│
├── types/
│   └── allegra.ts                   # TODOS los tipos TypeScript del sistema
│
├── data/
│   ├── initialData.ts               # Datos iniciales y versiones
│   ├── sampleEvents.ts              # SAMPLE_EVENTS, SAMPLE_CLIENTS, SAMPLE_MONTAJES, SAMPLE_DESMONTAJES
│   └── clientsData.ts               # INITIAL_CLIENTS
│
├── components/
│   ├── RootLayout.tsx               # AuthProvider + AuthGuard (NO MODIFICAR)
│   ├── MainLayout.tsx               # Sidebar + Header + Outlet
│   ├── LoginPage.tsx                # Página de login con password
│   ├── AlertsPanel.tsx              # Panel de alertas de stock
│   ├── AvailabilityChecker.tsx      # Verificador de disponibilidad de equipos
│   ├── EventStateFlow.tsx           # Visualizador del flujo de estados del evento
│   ├── RegistroSemanalHoras.tsx     # Registro semanal de horas de trabajadores
│   └── ui/                          # shadcn/ui components (NO MODIFICAR)
│       ├── button.tsx, card.tsx, input.tsx, label.tsx, select.tsx
│       ├── dialog.tsx, badge.tsx, tabs.tsx, textarea.tsx
│       ├── table.tsx, checkbox.tsx, switch.tsx, separator.tsx
│       ├── calendar.tsx, popover.tsx, scroll-area.tsx
│       ├── alert.tsx, alert-dialog.tsx, form.tsx, toast.tsx
│       └── ... (muchos más)
│
└── pages/
    ├── Dashboard.tsx                # Panel de control estratégico
    ├── EventsPage.tsx               # Lista/calendario de eventos + CRUD
    ├── EventDetailPage.tsx          # Detalle completo de un evento
    ├── InventoryPage.tsx            # Gestión de inventario
    ├── MontajePage.tsx              # Módulo de montaje (salida de equipos)
    ├── DesmontajePage.tsx           # Módulo de desmontaje (reintegro)
    ├── VehiclesPage.tsx             # Gestión de vehículos
    ├── WorkersPage.tsx              # Gestión de trabajadores
    ├── ClientsPage.tsx              # Gestión de clientes
    └── ConfigurationPage.tsx       # Configuración del sistema y seguridad
```

---

## RUTAS DEL SISTEMA

```typescript
// /src/app/routes.tsx
'/'               → Dashboard
'/eventos'        → EventsPage
'/eventos/:eventId' → EventDetailPage
'/inventario'     → InventoryPage
'/montaje'        → MontajePage
'/desmontaje'     → DesmontajePage
'/vehiculos'      → VehiclesPage
'/trabajadores'   → WorkersPage
'/clientes'       → ClientsPage
'/configuracion'  → ConfigurationPage
```

---

## TIPOS TYPESCRIPT COMPLETOS

### Tipos de Eventos

```typescript
// Estado del evento — flujo obligatorio:
// Agendado → En Montaje → Montado → En Desmontaje → Cerrado
// También puede ir a: Cancelado (desde Agendado o En Montaje)
type EventState = 'Agendado' | 'En Montaje' | 'Montado' | 'En Desmontaje' | 'Cerrado' | 'Cancelado';

interface Event {
  id: string;
  nombre: string;
  cliente: string;
  contactoResponsable: string;
  telefono: string;
  email: string;
  fechaInicio: string;           // formato 'YYYY-MM-DD'
  fechaFin: string;              // formato 'YYYY-MM-DD'
  horaInicio: string;            // formato 'HH:MM'
  horaFin: string;               // formato 'HH:MM'
  direccion: string;
  tipoEvento: 'Corporativo' | 'Concierto' | 'Boda' | 'Fiesta en Domicilio' | 'Festival' | 'Teatro' | 'Otro';
  estado: EventState;
  equipamientoAsignado: string[];  // IDs de items del inventario
  vehiculosAsignados: string[];    // IDs de vehículos
  trabajadoresAsignados: string[]; // IDs de trabajadores
  choferId?: string;
  choferNombre?: string;
  vehiculoId?: string;
  vehiculoNombre?: string;
  valorTotal: number;              // EXISTE en el tipo pero NO se muestra en la UI
  estadoPago?: 'Pendiente de pago' | 'Abonado' | 'Pagado';
  montoPagado?: number;            // EXISTE pero NO se muestra en la UI
  notas?: string;
  montajeRealizado: boolean;
  desmontaljeRealizado: boolean;
  evaluacion?: {
    calificacionGeneral?: number;  // 1-5 estrellas
    aspectosPositivos?: string;
    aspectosAMejorar?: string;
    comentariosCliente?: string;
    desempenoEquipo?: number;      // 1-5
    estadoEquipamiento?: number;   // 1-5
    recomendaciones?: string;
    fechaEvaluacion?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Tipos de Inventario

```typescript
interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;             // 'Sonido', 'Iluminación', 'Estructuras', 'Cables', etc.
  marca?: string;
  modelo?: string;
  cantidad: number;
  numeroSerie?: string;
  estado: 'Disponible' | 'Reservado' | 'En Mantenimiento' | 'Dañado' | 'Fuera de Servicio';
  ubicacion: string;
  fechaAdquisicion: string;
  historialUso: UseHistory[];
  notas?: string;
  imagenUrl?: string;
  esContenedor?: boolean;        // ¿Es un case/contenedor?
  contenidoInterno?: CaseContent;
  esConsumible?: boolean;        // ¿Es un insumo consumible?
  unidadMedida?: string;
  stockMinimo?: number;
}

interface UseHistory {
  eventoId: string;
  eventoNombre: string;
  fechaSalida: string;
  fechaRetorno?: string;
  estadoSalida: string;
  estadoRetorno?: string;
  cantidadSalida: number;
  cantidadRetorno?: number;
  observaciones?: string;
}
```

### Tipos de Montaje / Desmontaje

```typescript
interface MontajeItem {
  equipoId: string;
  equipoNombre: string;
  cantidad: number;
}

interface Montaje {
  id: string;
  eventoId: string;
  items: MontajeItem[];
  responsableEntrega: string;
  choferId: string;
  choferNombre: string;
  vehiculoId: string;
  vehiculoNombre: string;
  fechaSalida: string;
  horaSalida: string;
  observaciones?: string;
  completado: boolean;
}

interface DesmontaljeItem {
  equipoId: string;
  equipoNombre: string;
  cantidadSalida: number;
  cantidadRetorno: number;
  estadoRetorno: 'Correcto' | 'Dañado' | 'Faltante';
  observaciones?: string;
  confirmado: boolean;
}

interface Desmontalje {    // ATENCIÓN: el typo "Desmontalje" existe en el código, NO cambiar
  id: string;
  eventoId: string;
  montajeId: string;
  items: DesmontaljeItem[];
  responsableRecepcion: string;
  choferId: string;
  choferNombre: string;
  vehiculoId: string;
  vehiculoNombre: string;
  fechaRetorno: string;
  horaRetorno: string;
  incidencias: string[];
  completado: boolean;
}
```

### Tipos de Vehículos

```typescript
interface Vehicle {
  id: string;
  nombre: string;
  tipo: 'Camión' | 'Van' | 'Camioneta' | 'Auto' | 'Otro';
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  capacidadCarga: number;       // kg
  estado: 'Disponible' | 'En Uso' | 'En Mantenimiento';
  conductorAsignado?: string;
  mantenimientos: Mantenimiento[];
  proximoMantenimiento?: string;
  historialUso: VehicleUseHistory[];
  anotaciones: VehicleAnotacion[];
  notas?: string;
}
```

### Tipos de Trabajadores

```typescript
interface Worker {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
  cargo: string;
  habilidades: string[];
  especialidades: string[];
  disponibilidad: WeekAvailability;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  fechaIngreso: string;
  historialEventos: WorkerEventHistory[];
  anotaciones: WorkerAnotacion[];
  registroSemanal: RegistroSemanal[];
  notas?: string;
  imagenUrl?: string;
}

interface RegistroSemanal {
  id: string;
  trabajadorId: string;
  semana: string;               // Formato: "2026-W08"
  fechaInicio: string;          // Lunes de la semana
  fechaFin: string;             // Domingo de la semana
  diasTrabajados: DiaTrabajoRegistro[];
  totalHoras: number;
  descuentoColacion: number;    // En horas
  totalHorasNetas: number;
  observaciones?: string;
  aprobado: boolean;
  fechaAprobacion?: string;
  aprobadoPor?: string;
}

interface DiaTrabajoRegistro {
  fecha: string;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  horasTrabajadas: number;
  descuentoColacion: number;
  horasNetas: number;
  eventoId?: string;
  eventoNombre?: string;
  observaciones?: string;
}
```

### Tipos de Clientes

```typescript
interface Client {
  id: string;
  nombre: string;
  tipoCliente: 'Empresa' | 'Persona';
  rut?: string;
  contactoResponsable: string;
  telefono: string;
  email: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  giro?: string;
  eventosRealizados: number;
  valorTotalEventos: number;    // EXISTE pero NO se muestra en la UI
  ultimoEvento?: string;
  notas?: string;
  estado: 'Activo' | 'Inactivo';
  createdAt: string;
  updatedAt: string;
}
```

---

## CAPA DE API (`/src/app/lib/api.ts`)

El sistema tiene dos modos de operación:

1. **Modo conectado**: Usa el backend Supabase Edge Function en `https://${projectId}.supabase.co/functions/v1/make-server-787f7306`
2. **Modo offline**: Usa `localStorage` como base de datos local

**Todas las APIs siguen el mismo patrón:**
```typescript
export const eventsAPI = {
  getAll: async () => { ... },   // Lee de backend o retorna [] si offline
  save: async (data: any[]) => { ... }, // Guarda en backend o silently succeed si offline
};
```

**APIs disponibles:** `eventsAPI`, `inventoryAPI`, `vehiclesAPI`, `workersAPI`, `clientsAPI`, `montajesAPI`, `desmontajesAPI`, `authAPI`

**Patrón estándar de carga de datos en páginas:**
```typescript
// SIEMPRE usar este patrón de carga
const loadData = async () => {
  const localData = JSON.parse(localStorage.getItem('allegra_clave') || 'null');
  let backendData = null;
  try { backendData = await someAPI.getAll(); } catch (e) {}
  
  const loadedData = 
    (backendData && backendData.length > 0) ? backendData :
    (localData && localData.length > 0) ? localData :
    INITIAL_DATA;
  
  setData(loadedData);
  localStorage.setItem('allegra_clave', JSON.stringify(loadedData));
};
```

**Patrón estándar de guardado:**
```typescript
// Siempre guardar en localStorage Y luego intentar el backend
localStorage.setItem('allegra_clave', JSON.stringify(updatedData));
await someAPI.save(updatedData).catch(() => {}); // Silently ignore if offline
```

---

## MOTOR DE DISPONIBILIDAD (`/src/app/lib/availabilityEngine.ts`)

Funciones exportadas:

```typescript
// Verifica disponibilidad de UN equipo en rango de fechas
calcularDisponibilidad(equipoId, fechaInicio, fechaFin, cantidadRequerida, inventory, events, montajes, eventoExcluirId?)
// Retorna: AvailabilityCheck { equipoId, equipoNombre, cantidadDisponible, cantidadTotal, cantidadReservada, conflictos, disponible }

// Verifica disponibilidad de MÚLTIPLES equipos
verificarDisponibilidadMultiple(equiposRequeridos, fechaInicio, fechaFin, inventory, events, montajes, eventoExcluirId?)

// Genera alertas automáticas de stock bajo / sin stock / conflictos
generarAlertasStock(inventory, events, montajes)
// Retorna: StockAlert[] donde cada alerta tiene: equipoId, equipoNombre, tipo, mensaje, gravedad, fechaDeteccion

// Obtiene equipos disponibles para un rango de fechas
obtenerEquiposDisponibles(fechaInicio, fechaFin, inventory, events, montajes, categoriaFiltro?)

// Calcula estadísticas de uso de un equipo
calcularEstadisticasUso(equipoId, events, montajes)
```

---

## MÁQUINA DE ESTADOS (`/src/app/lib/eventStateMachine.ts`)

```typescript
// Transiciones válidas:
// Agendado → En Montaje (requiere: equipamiento + vehículo + trabajadores asignados)
// Agendado → Cancelado
// En Montaje → Montado (requiere: montaje completado)
// En Montaje → Cancelado
// Montado → En Desmontaje (requiere: evento finalizado)
// En Desmontaje → Cerrado (requiere: desmontaje completado)

// Funciones disponibles:
getPossibleTransitions(currentState)   // Retorna StateTransition[]
isValidTransition(from, to)            // Retorna boolean
validateTransitionConditions(event, targetState, montajeCompletado, desmontaljeCompletado)
applyStateTransition(event, targetState)  // Retorna Event actualizado
getStateColor(state)                   // Retorna clases Tailwind
getStateIcon(state)                    // Retorna emoji
getStateDescription(state)            // Retorna descripción en español
getEventProgress(state)               // Retorna número 0-100
getNextSuggestedState(currentState)   // Retorna siguiente estado sugerido
```

---

## DATOS DE EJEMPLO PRE-CARGADOS

El sistema viene con datos de ejemplo en:

- **`/src/app/data/sampleEvents.ts`**: 8 eventos en diferentes estados (2 Cerrados, 1 Montado en curso, 5 Agendados futuros) + 5 clientes + 3 montajes completados + 2 desmontajes
- **`/src/app/data/initialData.ts`**: Inventario completo (~50 items de audio/iluminación), vehículos (3), trabajadores (6+), clientes

Claves de localStorage utilizadas:
- `allegra_auth` — estado de autenticación
- `allegra_events` — eventos
- `allegra_inventory` — inventario
- `allegra_vehicles` — vehículos
- `allegra_workers` — trabajadores
- `allegra_clients` — clientes
- `allegra_montajes` — registros de montaje
- `allegra_desmontajes` — registros de desmontaje
- `allegra_events_version`, `allegra_inventory_version`, etc. — versiones para invalidación de caché

---

## ESTADO ACTUAL DE CADA MÓDULO

### ✅ Dashboard (`/src/app/pages/Dashboard.tsx`)
**FUNCIONAL.** Muestra:
- Filtro de mes navegable (flechas izquierda/derecha) con estadísticas del mes seleccionado
- Total eventos del mes, estados de pago (contadores sin montos), capacidad operativa, recursos activos
- Distribución por tipo de evento con barras de progreso de estados de pago
- Próximos 7 días (lista con links a EventDetailPage)
- AlertsPanel (alertas de stock/conflictos del motor de disponibilidad)

### ✅ Eventos (`/src/app/pages/EventsPage.tsx`)
**FUNCIONAL.** Incluye:
- Lista de todos los eventos con filtros por estado/tipo/búsqueda
- Modal de creación/edición de eventos completo
- Asignación de equipamiento, vehículos, trabajadores dentro del modal
- Selector de chofer y vehículo
- Badges de estado y estado de pago
- Navegación a EventDetailPage

### ✅ Detalle de Evento (`/src/app/pages/EventDetailPage.tsx`)
**FUNCIONAL.** Incluye:
- Vista completa del evento con toda la información
- Historial de montaje/desmontaje asociado
- Opción de impresión
- Botones de acción (ir a montaje, ir a desmontaje según estado)
- Evaluación post-evento

### ✅ Inventario (`/src/app/pages/InventoryPage.tsx`)
**FUNCIONAL.** Incluye:
- Lista con filtros por categoría, estado, búsqueda
- CRUD completo (crear, editar, eliminar)
- Soporte para contenedores/cases con contenido detallado
- Soporte para insumos consumibles con stock mínimo
- Historial de uso por item
- Vista expandida del contenido de cases

### ✅ Montaje (`/src/app/pages/MontajePage.tsx`)
**FUNCIONAL (pero mejorable).** Incluye:
- Selección de evento para montar (solo eventos en estado Agendado o En Montaje)
- Lista editable de ítems de equipamiento
- Agregar equipos desde el inventario disponible con filtro por categoría
- Campo de responsable, fecha, hora de salida
- Selector de chofer y vehículo
- Completar montaje: actualiza estado del evento a "Montado", marca equipos como "Reservado", guarda registro
- Vista de impresión / orden de salida (formato documento imprimible)
- Panel de depuración (ESTE PANEL DEBE ELIMINARSE en la versión final)

### ✅ Desmontaje (`/src/app/pages/DesmontajePage.tsx`)
**FUNCIONAL (pero mejorable).** Incluye:
- Lista de eventos pendientes de desmontaje (montajeRealizado=true, desmontaljeRealizado=false)
- Lista de desmontajes completados
- Formulario de desmontaje: cantidades de retorno, estado de cada equipo, observaciones
- Confirmación individual de cada equipo (checkbox confirmado)
- Registro de incidencias
- Al completar: actualiza estado del evento a "Cerrado", libera equipos al inventario
- **Panel de depuración visible en la UI** (DEBE ELIMINARSE)

### ✅ Vehículos (`/src/app/pages/VehiclesPage.tsx`)
**FUNCIONAL.** Incluye:
- Lista de vehículos con estado, tipo, patente
- CRUD completo
- Modal de anotaciones por vehículo
- Historial de uso por vehículo
- Próximos mantenimientos

### ✅ Trabajadores (`/src/app/pages/WorkersPage.tsx`)
**FUNCIONAL.** Incluye:
- Lista de trabajadores con estado, cargo, especialidades
- CRUD completo con validación de RUT chileno
- Anotaciones (desempeño, capacitación, incidente, general)
- Registro semanal de horas trabajadas (componente `RegistroSemanalHoras.tsx`)
- Disponibilidad semanal configurable

### ✅ Clientes (`/src/app/pages/ClientsPage.tsx`)
**FUNCIONAL.** Incluye:
- Lista de clientes con tipo (Empresa/Persona), estado
- CRUD completo
- Contador de eventos realizados
- **IMPORTANTE: NO mostrar montos de dinero** (ni `valorTotalEventos`)

### ✅ Configuración (`/src/app/pages/ConfigurationPage.tsx`)
**FUNCIONAL.** Incluye:
- Tabs: Perfil, Seguridad, Auditoría, Historial de login
- Cambio de contraseña
- Logs de auditoría
- Historial de intentos de login

---

## REGLAS DE NEGOCIO CRÍTICAS (NO VIOLAR)

### 1. NUNCA mostrar montos de dinero
El sistema **NUNCA debe mostrar valores monetarios** en la interfaz. Los campos `valorTotal`, `montoPagado`, `valorTotalEventos` existen en los tipos pero solo se usan internamente. En la UI solo se muestra el **estado de pago**: `Pendiente de pago`, `Abonado`, `Pagado`.

### 2. Flujo de estados de eventos
Los eventos **solo pueden avanzar** según la máquina de estados:
- `Agendado` → `En Montaje` (requiere equipamiento + vehículo + trabajadores)
- `En Montaje` → `Montado` (requiere montaje completado)
- `Montado` → `En Desmontaje` (requiere evento finalizado)
- `En Desmontaje` → `Cerrado` (requiere desmontaje completado)
- `Agendado` o `En Montaje` → `Cancelado` (en cualquier momento)

### 3. Desmontaje solo de eventos montados
Solo se puede iniciar desmontaje para eventos con `montajeRealizado: true` y `desmontaljeRealizado: false`.

### 4. Inventario y consumibles
- Para equipos normales: al montar → estado cambia a `Reservado`; al desmontar → vuelve a `Disponible` (o `Dañado` si hubo daños)
- Para insumos consumibles (`esConsumible: true`): al montar → se descuenta la `cantidad`; al desmontar → NO se reintegra (ya se consumió)

### 5. RUT chileno
Siempre usar `/src/app/lib/rutUtils.ts` para formatear y validar RUTs.

### 6. Idioma
Todo el sistema está en español. Todos los textos de UI deben ser en español.

### 7. Panel de depuración
El `DesmontajePage.tsx` tiene un panel de depuración con bordes azules que muestra estados internos. **DEBE ELIMINARSE** de la UI de producción.

---

## DISEÑO Y ESTILOS

### Paleta de colores principal
- **Primario**: Púrpura (`purple-600`, `purple-700`, `purple-800`) + Índigo (`indigo-600`)
- **Header**: `bg-gradient-to-r from-purple-600 via-purple-800 to-gray-900 text-white`
- **Sidebar activo**: `bg-gradient-to-r from-purple-600 to-indigo-600 text-white`
- **Fondos**: `bg-gray-50` (página), `bg-white` (cards)
- **Éxito**: verde (`green-600`)
- **Alerta**: amarillo/naranja (`yellow-500`, `orange-500`)
- **Error/Crítico**: rojo (`red-600`)

### Badges de estado de eventos
```typescript
// Colores por estado (ya implementado en eventStateMachine.ts)
'Agendado':       'bg-blue-100 text-blue-800 border-blue-200'
'En Montaje':     'bg-yellow-100 text-yellow-800 border-yellow-200'
'Montado':        'bg-green-100 text-green-800 border-green-200'
'En Desmontaje':  'bg-orange-100 text-orange-800 border-orange-200'
'Cerrado':        'bg-gray-100 text-gray-800 border-gray-200'
'Cancelado':      'bg-red-100 text-red-800 border-red-200'
```

### Badges de estado de pago
```
'Pagado':           verde
'Abonado':          amarillo
'Pendiente de pago': rojo/naranja
```

### Tipografía
- No usar clases de Tailwind para font-size, font-weight ni line-height a menos que sea estrictamente necesario para diferenciar elementos
- Usar los estilos del tema en `/src/styles/theme.css`

### Responsividad
- Sidebar oculto en mobile (hamburger menu)
- Grids adaptativos: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Tablas con scroll horizontal en mobile

---

## COMPONENTES REUTILIZABLES YA CREADOS

### `AlertsPanel` (`/src/app/components/AlertsPanel.tsx`)
```typescript
<AlertsPanel alerts={StockAlert[]} />
// Muestra alertas agrupadas por gravedad: critica, alta, media, baja
// Si no hay alertas muestra mensaje de "Todo en orden"
```

### `AvailabilityChecker` (`/src/app/components/AvailabilityChecker.tsx`)
- Permite verificar disponibilidad de equipos para un rango de fechas
- Muestra conflictos de reserva con nombres de eventos

### `EventStateFlow` (`/src/app/components/EventStateFlow.tsx`)
- Visualizador visual del flujo de estados (progreso del evento)
- Muestra paso a paso: Agendado → En Montaje → Montado → En Desmontaje → Cerrado

### `RegistroSemanalHoras` (`/src/app/components/RegistroSemanalHoras.tsx`)
- Componente de registro de horas semanales para trabajadores
- Incluye días de la semana, horas de inicio/fin, descuento colación

---

## FASE 2 — LO QUE NECESITAS CONSTRUIR AHORA

### Tarea 1: Limpiar el panel de depuración de DesmontajePage

En `/src/app/pages/DesmontajePage.tsx`, eliminar completamente el bloque `<Card>` con `className="bg-blue-50 border-2 border-blue-300"` que contiene el "Panel de Depuración - Estado del Sistema". Este panel fue útil para desarrollo pero NO debe aparecer en producción.

---

### Tarea 2: Checklists editables para Montaje y Desmontaje

**Objetivo:** Agregar un sistema de checklist interactivo en los módulos de Montaje y Desmontaje para que el operador pueda confirmar ítems durante el proceso operativo.

#### Para Montaje (`MontajePage.tsx`):
Agregar una sección de "Checklist Pre-Salida" con ítems configurables como:
- [ ] Todos los equipos cargados en el vehículo
- [ ] Cables de alimentación incluidos
- [ ] Herramientas de montaje incluidas
- [ ] Documentación del evento impresa
- [ ] Comunicación con el cliente confirmada
- [ ] Ruta al evento planificada
- [ ] Equipos verificados funcionando
- [ ] Stock de consumibles incluido (DI boxes, baterías, cinta)

El checklist debe:
- Tener ítems predefinidos que el usuario puede marcar/desmarcar
- Permitir agregar ítems personalizados
- Mostrar contador de ítems completados vs total (ej: "5/8 completados")
- No bloquear el guardado del montaje si el checklist está incompleto (solo advertir)
- Los ítems personalizados deben persistir en localStorage con la clave `allegra_checklist_montaje`

#### Para Desmontaje (`DesmontajePage.tsx`):
Agregar una sección de "Checklist de Recepción":
- [ ] Todos los equipos contados y verificados
- [ ] Equipo dañado documentado con fotos/notas
- [ ] Equipos faltantes registrados
- [ ] Vehículo inspeccionado
- [ ] Chofer firmó recepción
- [ ] Bodega organizada
- [ ] Inventario actualizado
- [ ] Incidencias reportadas al supervisor

Mismo comportamiento que en montaje.

---

### Tarea 3: Sistema de Reportes Exportables

**Objetivo:** Agregar una página o sección de reportes que permita generar documentos imprimibles/exportables del sistema.

**Crear** `/src/app/pages/ReportesPage.tsx` y agregar la ruta `/reportes` al router.

**Reportes requeridos:**

#### 3.1 Reporte de Evento Individual (ya existe impresión en EventDetailPage, pero mejorar)
El botón "Imprimir" en `EventDetailPage.tsx` ya funciona pero el documento imprimible debe incluir:
- Información completa del evento
- Equipamiento asignado (lista completa)
- Trabajadores asignados
- Vehículo y chofer
- Estado de pago (SIN montos)
- Registro de montaje (si existe)
- Registro de desmontaje (si existe)
- Evaluación post-evento (si existe)
- Sección de firma del cliente

#### 3.2 Reporte de Inventario
Tabla completa del inventario actual con:
- Nombre, categoría, marca, modelo, cantidad, estado, ubicación
- Filtros aplicables: categoría, estado
- Total por categoría al final
- Fecha de generación del reporte

#### 3.3 Reporte de Eventos por Período
Lista de eventos en un rango de fechas seleccionable:
- Nombre del evento, cliente, tipo, fecha, estado, estado de pago
- Resumen: total eventos, desglose por tipo, desglose por estado de pago (SIN montos)
- Eventos ordenados por fecha

#### 3.4 Reporte de Trabajadores y Horas
Para un período seleccionable (semana/mes):
- Lista de trabajadores activos
- Total horas brutas y netas trabajadas en el período
- Descuento colación aplicado
- Eventos en los que participó cada trabajador
- Estado de aprobación de sus registros semanales

**Implementación técnica:**
- Usar `window.print()` para imprimir
- Cada reporte tiene vista de pantalla (previsualización) y versión imprimible limpia
- En la versión imprimible: sin sidebar, solo el documento con logo "ALLEGRA" en header
- Agregar `print:hidden` a todos los elementos de navegación/botones

#### 3.5 Reporte de Orden de Salida — Montaje (ya existe, mejorar formato)
El documento imprimible de montaje ya existe. Asegurarse de que incluya:
- Logo/nombre ALLEGRA bien centrado
- Número de orden (ID del montaje)
- Información del evento completa
- Lista de equipos con casilla de verificación física (para marcar manualmente)
- Sección de firmas: Responsable entrega / Responsable recepción
- Pie de página con fecha y hora de generación

#### 3.6 Reporte de Orden de Retorno — Desmontaje (nuevo)
Crear un documento imprimible para el desmontaje similar al de montaje, que incluya:
- Número de orden (ID del desmontaje)
- Referencia al montaje original
- Lista de equipos: cantidad salida vs cantidad retorno, estado
- Incidencias reportadas
- Sección de firmas

**Para la página de Reportes** (`/reportes`), mostrar una grilla de "tarjetas" por tipo de reporte, cada una con:
- Ícono descriptivo
- Nombre del reporte
- Descripción breve
- Controles de filtro (fechas, período) si aplica
- Botón "Generar Reporte" que abre vista previa imprimible

Agregar en `MainLayout.tsx` el link de navegación a Reportes con un ícono de `FileText` o `BarChart2`.

---

### Tarea 4: Mejoras al módulo de Montaje

**4.1 Pre-carga automática de equipamiento:**
Cuando el usuario selecciona un evento para montar, si el evento tiene `equipamientoAsignado` no vacío, precargar automáticamente esos equipos en `montajeItems` con cantidad `1` (o la cantidad disponible). El usuario puede ajustar las cantidades o agregar/eliminar equipos.

**4.2 Advertencia de disponibilidad:**
Al agregar un equipo que ya está reservado para otro evento en fechas cercanas, mostrar un `toast` de advertencia (no bloquear, solo advertir).

**4.3 Selector de Chofer mejorado:**
El selector de chofer debe mostrar solo trabajadores activos. Mostrar nombre completo + cargo. Al seleccionar, actualizar `choferId` y `choferNombre`.

**4.4 Campos faltantes en el formulario del Montaje:**
El formulario actual guarda el Montaje sin `choferId`, `choferNombre`, `vehiculoId`, `vehiculoNombre`. Corregir para que el objeto Montaje guardado en localStorage incluya estos campos cuando el evento los tenga asignados.

---

### Tarea 5: Mejoras al módulo de Desmontaje

**5.1 Eliminar panel de depuración** (ver Tarea 1).

**5.2 Vista imprimible del Desmontaje:**
Agregar botón "Imprimir" que genere el documento de Orden de Retorno (ver Reporte 3.6).

**5.3 Marcado rápido "Todo Correcto":**
Botón que marque todos los ítems como `confirmado: true` y `estadoRetorno: 'Correcto'` de una sola vez (útil cuando todo llegó bien).

**5.4 Resumen de incidencias:**
Al final del formulario de desmontaje, mostrar un resumen visual de:
- Equipos dañados (con observaciones)
- Equipos faltantes
- Total de incidencias registradas
- Estado general: Verde (todo OK), Amarillo (algún daño), Rojo (faltantes)

---

### Tarea 6: Mejoras al Dashboard

**6.1 Mini-calendario del mes:**
Agregar un mini-calendario visual en el Dashboard que muestre el mes actual con puntos de colores indicando qué días tienen eventos. Al hacer click en un día con eventos, mostrar un tooltip/popover con los eventos de ese día.

**6.2 Widget "Eventos en Curso":**
Mostrar una sección destacada con los eventos actualmente en estado `Montado` o `En Montaje` (los que están ocurriendo ahora). Mostrar nombre, cliente, dirección, hora de fin, estado.

**6.3 Actividad reciente:**
Una timeline o lista de las últimas 10 acciones del sistema (últimos eventos creados, montajes completados, desmontajes completados, ordenados por fecha).

---

### Tarea 7: Mejoras al módulo de Eventos

**7.1 Vista de Calendario:**
Agregar una segunda vista en `EventsPage.tsx` — actualmente solo existe vista de lista. Agregar botón para cambiar a "Vista Calendario" (mensual) donde:
- Cada día del mes muestra puntos o chips con los eventos que ocurren ese día
- Colores según estado del evento
- Click en un evento → navega a EventDetailPage
- Botones para navegar entre meses

**7.2 Filtros avanzados:**
En la vista de lista, agregar filtros adicionales:
- Por cliente (dropdown con todos los clientes)
- Por estado de pago
- Por rango de fechas (fecha inicio - fecha fin)
- Reset de filtros con un botón

**7.3 Transición de estados desde EventDetailPage:**
En `EventDetailPage.tsx`, agregar botones de acción para las transiciones de estado permitidas:
- Si `Agendado`: botón "Iniciar Montaje" → redirige a `/montaje` con el evento preseleccionado
- Si `Montado`: botón "Iniciar Desmontaje" → redirige a `/desmontaje` con el evento preseleccionado
- Si `En Desmontaje`: botón "Completar Desmontaje" → redirige a `/desmontaje`
- Mostrar el `EventStateFlow` con el estado actual resaltado

---

### Tarea 8: Testing y corrección de bugs conocidos

**Bug 1 — DesmontajePage no carga eventos correctamente a veces:**
El problema es que cuando se navega directamente a `/desmontaje`, los eventos se cargan de localStorage pero la comparación de `montajeRealizado && !desmontaljeRealizado` puede fallar si los eventos vienen del `INITIAL_EVENTS` (que tiene eventos con `montajeRealizado: true` hardcodeados). 

Solución: Al cargar datos en DesmontajePage, priorizar localStorage sobre INITIAL_EVENTS (ya está implementado parcialmente, verificar que funcione correctamente con los datos de ejemplo: el evento `event-003` tiene `montajeRealizado: true` y `desmontaljeRealizado: false`, estado `Montado`, y debería aparecer en "Pendientes de Desmontaje").

**Bug 2 — Campos de Montaje incompletos:**
El objeto Montaje que se guarda en `handleCompletarMontaje` tiene `choferId: ''`, `choferNombre: ''`, `vehiculoId: ''`, `vehiculoNombre: ''` porque el formulario actual no tiene esos campos o no los lee correctamente. Verificar y corregir.

**Bug 3 — Versioning inconsistente:**
Al incrementar versiones en `initialData.ts`, también actualizar las versiones de `CLIENTS_VERSION` y `MONTAJES_VERSION` y `DESMONTAJES_VERSION` si se agregan nuevos datos de ejemplo, y asegurarse de que `RootLayout.tsx` también limpie `allegra_clients`, `allegra_montajes`, `allegra_desmontajes` al detectar cambio de versión (actualmente solo limpia events, inventory, vehicles, workers).

---

## INSTRUCCIONES DE IMPLEMENTACIÓN

### Orden recomendado
1. **Primero**: Tarea 1 (eliminar panel debug) — es un fix rápido
2. **Segundo**: Tarea 4.4 y Bug 2 (corregir campos de Montaje) — son bugs críticos
3. **Tercero**: Tarea 5 (mejoras Desmontaje) — incluyendo eliminar panel debug
4. **Cuarto**: Tarea 2 (Checklists) — nueva feature visible
5. **Quinto**: Tarea 3 (Reportes) — la feature más compleja
6. **Sexto**: Tareas 6, 7, 8 (mejoras restantes)

### Patrones de código a seguir

**Para modales/dialogs**, usar `shadcn/ui Dialog`:
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Título</DialogTitle></DialogHeader>
    {/* contenido */}
  </DialogContent>
</Dialog>
```

**Para notificaciones**, usar `sonner`:
```typescript
import { toast } from 'sonner';
toast.success('Operación exitosa');
toast.error('Error al guardar');
toast.warning('Advertencia');
```

**Para navegación programática**:
```typescript
import { useNavigate } from 'react-router';
const navigate = useNavigate();
navigate('/eventos');
navigate(`/eventos/${eventoId}`);
```

**Para pasar datos entre páginas** (cuando no es via URL params):
```typescript
// Guardar antes de navegar
localStorage.setItem('montaje_evento_selected', JSON.stringify(evento));
navigate('/montaje');
// Leer al llegar a la página destino (y limpiar)
const saved = localStorage.getItem('montaje_evento_selected');
if (saved) {
  setEventoSeleccionado(JSON.parse(saved));
  localStorage.removeItem('montaje_evento_selected');
}
```

**Para fechas en Chile**:
```typescript
new Date(fecha).toLocaleDateString('es-CL')  // Formato DD/MM/YYYY
new Date(fecha).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
```

**Para IDs únicos de nuevos registros**:
```typescript
id: `MTJ-${Date.now()}` // para montajes
id: `DSM-${Date.now()}` // para desmontajes
id: `RPT-${Date.now()}` // para reportes
```

---

## RESTRICCIONES IMPORTANTES

1. **NO modificar** `/src/app/components/figma/ImageWithFallback.tsx` — archivo protegido
2. **NO modificar** `/pnpm-lock.yaml` — archivo protegido
3. **NO modificar** `/src/app/components/RootLayout.tsx` a menos que sea estrictamente necesario y manteniendo la arquitectura AuthProvider + AuthGuard
4. **NO instalar** `react-router-dom` — usar solo `react-router`
5. **NO mostrar** valores monetarios en la UI
6. **NO usar** `re-resizable` ni `react-resizable` — usar `re-resizable` si es necesario
7. **SIEMPRE** mantener el fallback a localStorage cuando el backend no esté disponible
8. **SIEMPRE** usar el mismo patrón de carga de datos descrito arriba
9. **SIEMPRE** escribir todo el texto de UI en español
10. La importación de imágenes del logo de Allegra usa el scheme especial: `import logo from 'figma:asset/d7d1b12b2bde115dd66c84ac6a4de6f408515848.png'` (ya existe en MainLayout.tsx)

---

## RESUMEN EJECUTIVO DEL ESTADO

El sistema Allegra está aproximadamente al **60% de desarrollo**. Todos los módulos principales existen y son funcionales en modo básico. Lo que falta es:

1. **Calidad de producción**: Eliminar panels de debug, mejorar UX en flujos críticos
2. **Checklists operativos**: Feature esencial para el día a día de los operadores
3. **Reportes**: Feature de alto valor para el administrador
4. **Vista calendario**: Mejora significativa en EventsPage
5. **Corrección de bugs**: Principalmente en Montaje/Desmontaje

El sistema ya maneja correctamente autenticación, persistencia local, datos de ejemplo, flujo de estados de eventos, alertas de inventario, y toda la estructura de navegación. La arquitectura es sólida — construye sobre ella.

---

*Fecha del sistema: 5 de marzo de 2026. Los datos de ejemplo están calibrados para que algunos eventos sean del pasado (febrero 2026), uno esté activo ahora (marzo 3-6 2026) y otros sean futuros (marzo 9 en adelante).*
