// Auth Types
export interface AdminProfile {
  username: string;
  email?: string;
  company: string;
  createdAt: string;
  lastPasswordChange?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  userId: string;
}

export interface LoginAttempt {
  timestamp: string;
  success: boolean;
  ip?: string;
}

// Event Types
export interface Event {
  id: string;
  nombre: string;
  cliente: string;
  contactoResponsable: string;
  telefono: string;
  email: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  direccion: string;
  tipoEvento: 'Corporativo' | 'Concierto' | 'Boda' | 'Fiesta en Domicilio' | 'Festival' | 'Teatro' | 'Otro';
  estado: 'Agendado' | 'En Montaje' | 'Montado' | 'En Desmontaje' | 'Cerrado' | 'Cancelado';
  equipamientoAsignado: string[]; // IDs de equipamiento
  vehiculosAsignados: string[]; // IDs de vehículos
  trabajadoresAsignados: string[]; // IDs de trabajadores
  choferId?: string;
  choferNombre?: string;
  vehiculoId?: string;
  vehiculoNombre?: string;
  valorTotal: number;
  estadoPago?: 'Pendiente de pago' | 'Abonado' | 'Pagado';
  montoPagado?: number;
  notas?: string;
  montajeRealizado: boolean;
  desmontaljeRealizado: boolean;
  evaluacion?: {
    calificacionGeneral?: number; // 1-5 estrellas
    aspectosPositivos?: string;
    aspectosAMejorar?: string;
    comentariosCliente?: string;
    desempenoEquipo?: number; // 1-5
    estadoEquipamiento?: number; // 1-5
    recomendaciones?: string;
    fechaEvaluacion?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
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
  esContenedor?: boolean; // Indica si es un contenedor/case
  contenidoInterno?: CaseContent; // Contenido detallado del case
  // Campos para insumos consumibles
  esConsumible?: boolean; // Indica si es un insumo consumible
  unidadMedida?: string; // unidades, litros, kg, metros, etc.
  stockMinimo?: number; // Stock mínimo antes de alertar
}

export interface CaseContent {
  microfonos?: CaseItem[];
  accesorios?: CaseItem[];
  cables?: CaseItem[];
  herramientas?: CaseItem[];
}

export interface CaseItem {
  nombre: string;
  cantidad: number;
  marca?: string;
  modelo?: string;
}

export interface UseHistory {
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

// Montaje/Desmontaje Types
export interface MontajeItem {
  equipoId: string;
  equipoNombre: string;
  cantidad: number;
}

export interface Montaje {
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

export interface DesmontaljeItem {
  equipoId: string;
  equipoNombre: string;
  cantidadSalida: number;
  cantidadRetorno: number;
  estadoRetorno: 'Correcto' | 'Dañado' | 'Faltante';
  observaciones?: string;
  confirmado: boolean;
}

export interface Desmontalje {
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

// Vehicle Types
export interface Vehicle {
  id: string;
  nombre: string;
  tipo: 'Camión' | 'Van' | 'Camioneta' | 'Auto' | 'Otro';
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  capacidadCarga: number; // kg
  estado: 'Disponible' | 'En Uso' | 'En Mantenimiento';
  conductorAsignado?: string;
  mantenimientos: Mantenimiento[];
  proximoMantenimiento?: string;
  historialUso: VehicleUseHistory[];
  anotaciones: VehicleAnotacion[];
  notas?: string;
}

export interface VehicleAnotacion {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: 'Mantenimiento' | 'Incidente' | 'General';
  usuario: string;
}

export interface Mantenimiento {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  costo: number;
  taller?: string;
}

export interface VehicleUseHistory {
  eventoId: string;
  eventoNombre: string;
  fecha: string;
  conductorId: string;
  conductorNombre: string;
  kilometraje?: number;
  observaciones?: string;
}

// Worker Types
export interface Worker {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
  cargo: string;
  habilidades: string[];
  especialidades: string[]; // Fuertes/especialidades
  disponibilidad: WeekAvailability;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
  fechaIngreso: string;
  historialEventos: WorkerEventHistory[];
  anotaciones: WorkerAnotacion[];
  registroSemanal: RegistroSemanal[]; // Nuevo: Registro de horas trabajadas
  notas?: string;
  imagenUrl?: string;
}

export interface RegistroSemanal {
  id: string;
  trabajadorId: string;
  semana: string; // Formato: "2026-W08" (año-semana ISO)
  fechaInicio: string; // Lunes de la semana
  fechaFin: string; // Domingo de la semana
  diasTrabajados: DiaTrabajoRegistro[];
  totalHoras: number;
  descuentoColacion: number; // En horas (ej: 0.5 = 30 min, 1 = 1 hora)
  totalHorasNetas: number; // totalHoras - descuentoColacion
  observaciones?: string;
  aprobado: boolean;
  fechaAprobacion?: string;
  aprobadoPor?: string;
}

export interface DiaTrabajoRegistro {
  fecha: string;
  diaNombre: string; // Lunes, Martes, etc.
  horaInicio: string;
  horaFin: string;
  horasTrabajadas: number;
  descuentoColacion: number; // Descuento en horas para este día específico
  horasNetas: number; // horasTrabajadas - descuentoColacion
  eventoId?: string;
  eventoNombre?: string;
  observaciones?: string;
}

export interface WorkerAnotacion {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: 'Desempeño' | 'Capacitación' | 'Incidente' | 'General';
  usuario: string;
}

export interface WeekAvailability {
  lunes: boolean;
  martes: boolean;
  miercoles: boolean;
  jueves: boolean;
  viernes: boolean;
  sabado: boolean;
  domingo: boolean;
}

export interface WorkerEventHistory {
  eventoId: string;
  eventoNombre: string;
  fecha: string;
  rol: string;
  horasTrabajadas?: number;
}

// Client Types
export interface Client {
  id: string;
  nombre: string; // Nombre de la empresa o persona
  tipoCliente: 'Empresa' | 'Persona';
  rut?: string;
  contactoResponsable: string;
  telefono: string;
  email: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  giro?: string; // Para empresas
  eventosRealizados: number;
  valorTotalEventos: number;
  ultimoEvento?: string;
  notas?: string;
  estado: 'Activo' | 'Inactivo';
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DashboardStats {
  totalEventos: number;
  eventosProximos: number;
  eventosCerrados: number;
  equipoDisponible: number;
}

export interface MonthlyEventStats {
  mes: string;
  cantidad: number;
  tipoEvento: { [key: string]: number };
}

export interface EquipmentUsageStats {
  equipoId: string;
  equipoNombre: string;
  vecesUsado: number;
  horasUso: number;
}