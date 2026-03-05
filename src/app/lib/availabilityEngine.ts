/**
 * Motor de Disponibilidad de Inventario
 * Gestiona la disponibilidad de equipamiento por fechas y detecta conflictos
 */

import { Event, InventoryItem, Montaje } from '../types/allegra';

export interface AvailabilityCheck {
  equipoId: string;
  equipoNombre: string;
  cantidadDisponible: number;
  cantidadTotal: number;
  cantidadReservada: number;
  conflictos: ConflictoReserva[];
  disponible: boolean;
}

export interface ConflictoReserva {
  eventoId: string;
  eventoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadReservada: number;
}

export interface StockAlert {
  equipoId: string;
  equipoNombre: string;
  tipo: 'STOCK_BAJO' | 'SIN_STOCK' | 'CONFLICTO_RESERVA';
  mensaje: string;
  gravedad: 'baja' | 'media' | 'alta' | 'critica';
  fechaDeteccion: string;
}

/**
 * Verifica si dos rangos de fechas se superponen
 */
function fechasSeSuperponen(
  inicio1: string,
  fin1: string,
  inicio2: string,
  fin2: string
): boolean {
  const start1 = new Date(inicio1);
  const end1 = new Date(fin1);
  const start2 = new Date(inicio2);
  const end2 = new Date(fin2);

  return start1 <= end2 && start2 <= end1;
}

/**
 * Calcula la disponibilidad de un equipo en un rango de fechas
 */
export function calcularDisponibilidad(
  equipoId: string,
  fechaInicio: string,
  fechaFin: string,
  cantidadRequerida: number,
  inventory: InventoryItem[],
  events: Event[],
  montajes: Montaje[],
  eventoExcluirId?: string // Para edición de eventos existentes
): AvailabilityCheck {
  // Buscar el item en inventario
  const item = inventory.find(i => i.id === equipoId);
  
  if (!item) {
    return {
      equipoId,
      equipoNombre: 'Equipo no encontrado',
      cantidadDisponible: 0,
      cantidadTotal: 0,
      cantidadReservada: 0,
      conflictos: [],
      disponible: false,
    };
  }

  // Solo contar equipos disponibles (no fuera de servicio, dañados, etc.)
  const cantidadTotal = item.estado === 'Disponible' || item.estado === 'Reservado' 
    ? item.cantidad 
    : 0;

  // Buscar eventos que se superpongan con las fechas
  const eventosSuperpuestos = events.filter(event => {
    if (event.id === eventoExcluirId) return false; // Excluir evento actual en edición
    if (event.estado === 'Cancelado' || event.estado === 'Cerrado') return false;
    
    return fechasSeSuperponen(
      fechaInicio,
      fechaFin,
      event.fechaInicio,
      event.fechaFin
    );
  });

  // Calcular cantidad reservada y conflictos
  const conflictos: ConflictoReserva[] = [];
  let cantidadReservada = 0;

  for (const evento of eventosSuperpuestos) {
    // Buscar montaje asociado al evento
    const montaje = montajes.find(m => m.eventoId === evento.id);
    
    if (montaje) {
      // Buscar el item específico en el montaje
      const montajeItem = montaje.items.find(mi => mi.equipoId === equipoId);
      
      if (montajeItem) {
        cantidadReservada += montajeItem.cantidad;
        conflictos.push({
          eventoId: evento.id,
          eventoNombre: evento.nombre,
          fechaInicio: evento.fechaInicio,
          fechaFin: evento.fechaFin,
          cantidadReservada: montajeItem.cantidad,
        });
      }
    } else {
      // Si no hay montaje pero el equipo está asignado en el evento
      if (evento.equipamientoAsignado?.includes(equipoId)) {
        // Asumir 1 unidad si no hay montaje registrado
        cantidadReservada += 1;
        conflictos.push({
          eventoId: evento.id,
          eventoNombre: evento.nombre,
          fechaInicio: evento.fechaInicio,
          fechaFin: evento.fechaFin,
          cantidadReservada: 1,
        });
      }
    }
  }

  const cantidadDisponible = Math.max(0, cantidadTotal - cantidadReservada);
  const disponible = cantidadDisponible >= cantidadRequerida;

  return {
    equipoId: item.id,
    equipoNombre: item.nombre,
    cantidadDisponible,
    cantidadTotal,
    cantidadReservada,
    conflictos,
    disponible,
  };
}

/**
 * Verifica disponibilidad para múltiples equipos
 */
export function verificarDisponibilidadMultiple(
  equiposRequeridos: { equipoId: string; cantidad: number }[],
  fechaInicio: string,
  fechaFin: string,
  inventory: InventoryItem[],
  events: Event[],
  montajes: Montaje[],
  eventoExcluirId?: string
): AvailabilityCheck[] {
  return equiposRequeridos.map(req => 
    calcularDisponibilidad(
      req.equipoId,
      fechaInicio,
      fechaFin,
      req.cantidad,
      inventory,
      events,
      montajes,
      eventoExcluirId
    )
  );
}

/**
 * Genera alertas de stock automáticas
 */
export function generarAlertasStock(
  inventory: InventoryItem[],
  events: Event[],
  montajes: Montaje[]
): StockAlert[] {
  const alerts: StockAlert[] = [];
  const hoy = new Date().toISOString().split('T')[0];

  for (const item of inventory) {
    // Alerta de stock bajo (consumibles)
    if (item.esConsumible && item.stockMinimo) {
      if (item.cantidad <= item.stockMinimo) {
        alerts.push({
          equipoId: item.id,
          equipoNombre: item.nombre,
          tipo: 'STOCK_BAJO',
          mensaje: `Stock bajo: ${item.cantidad} ${item.unidadMedida || 'unidades'} (mínimo: ${item.stockMinimo})`,
          gravedad: item.cantidad === 0 ? 'critica' : item.cantidad <= item.stockMinimo / 2 ? 'alta' : 'media',
          fechaDeteccion: hoy,
        });
      }
    }

    // Alerta de sin stock disponible
    if (item.cantidad === 0 && item.estado !== 'Fuera de Servicio') {
      alerts.push({
        equipoId: item.id,
        equipoNombre: item.nombre,
        tipo: 'SIN_STOCK',
        mensaje: 'Sin unidades disponibles',
        gravedad: 'critica',
        fechaDeteccion: hoy,
      });
    }

    // Verificar próximos eventos (próximos 30 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 30);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const eventosProximos = events.filter(e => 
      e.fechaInicio >= hoy && 
      e.fechaInicio <= fechaLimiteStr &&
      e.estado !== 'Cancelado' &&
      e.estado !== 'Cerrado' &&
      e.equipamientoAsignado?.includes(item.id)
    );

    for (const evento of eventosProximos) {
      const disponibilidad = calcularDisponibilidad(
        item.id,
        evento.fechaInicio,
        evento.fechaFin,
        1,
        inventory,
        events,
        montajes
      );

      if (!disponibilidad.disponible && disponibilidad.conflictos.length > 1) {
        alerts.push({
          equipoId: item.id,
          equipoNombre: item.nombre,
          tipo: 'CONFLICTO_RESERVA',
          mensaje: `Conflicto de reserva para evento "${evento.nombre}" el ${new Date(evento.fechaInicio).toLocaleDateString('es-ES')}`,
          gravedad: 'alta',
          fechaDeteccion: hoy,
        });
      }
    }
  }

  return alerts;
}

/**
 * Obtiene equipos disponibles para un rango de fechas
 */
export function obtenerEquiposDisponibles(
  fechaInicio: string,
  fechaFin: string,
  inventory: InventoryItem[],
  events: Event[],
  montajes: Montaje[],
  categoriaFiltro?: string
): AvailabilityCheck[] {
  let itemsFiltrados = inventory.filter(
    item => item.estado === 'Disponible' || item.estado === 'Reservado'
  );

  if (categoriaFiltro) {
    itemsFiltrados = itemsFiltrados.filter(
      item => item.categoria === categoriaFiltro
    );
  }

  return itemsFiltrados.map(item => 
    calcularDisponibilidad(
      item.id,
      fechaInicio,
      fechaFin,
      1,
      inventory,
      events,
      montajes
    )
  );
}

/**
 * Calcula estadísticas de uso de un equipo
 */
export function calcularEstadisticasUso(
  equipoId: string,
  events: Event[],
  montajes: Montaje[]
): {
  vecesUsado: number;
  proximoUso?: string;
  ultimoUso?: string;
  tasaUso: number; // Porcentaje de eventos donde se usa
} {
  const montajesEquipo = montajes.filter(m => 
    m.items.some(item => item.equipoId === equipoId)
  );

  const vecesUsado = montajesEquipo.length;
  const totalEventos = events.filter(e => e.estado !== 'Cancelado').length;
  const tasaUso = totalEventos > 0 ? (vecesUsado / totalEventos) * 100 : 0;

  // Encontrar próximo uso
  const hoy = new Date().toISOString().split('T')[0];
  const eventosProximos = events
    .filter(e => 
      e.fechaInicio >= hoy &&
      e.estado !== 'Cancelado' &&
      e.equipamientoAsignado?.includes(equipoId)
    )
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));

  const proximoUso = eventosProximos.length > 0 ? eventosProximos[0].fechaInicio : undefined;

  // Encontrar último uso
  const eventosPasados = events
    .filter(e => 
      e.fechaFin < hoy &&
      e.equipamientoAsignado?.includes(equipoId)
    )
    .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));

  const ultimoUso = eventosPasados.length > 0 ? eventosPasados[0].fechaFin : undefined;

  return {
    vecesUsado,
    proximoUso,
    ultimoUso,
    tasaUso,
  };
}
