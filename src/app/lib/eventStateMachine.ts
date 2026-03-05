/**
 * Máquina de Estados para Eventos
 * Gestiona las transiciones de estado y reglas de negocio
 */

import { Event } from '../types/allegra';

export type EventState = 'Agendado' | 'En Montaje' | 'Montado' | 'En Desmontaje' | 'Cerrado' | 'Cancelado';

export interface StateTransition {
  from: EventState;
  to: EventState;
  label: string;
  description: string;
  requiredConditions: string[];
  action?: string;
}

/**
 * Definición de transiciones válidas
 */
export const STATE_TRANSITIONS: StateTransition[] = [
  {
    from: 'Agendado',
    to: 'En Montaje',
    label: 'Iniciar Montaje',
    description: 'Comienza el proceso de montaje del evento',
    requiredConditions: [
      'Equipamiento asignado',
      'Vehículo asignado',
      'Trabajadores asignados',
    ],
    action: 'create_montaje',
  },
  {
    from: 'Agendado',
    to: 'Cancelado',
    label: 'Cancelar Evento',
    description: 'Cancela el evento antes del montaje',
    requiredConditions: [],
    action: 'cancel_event',
  },
  {
    from: 'En Montaje',
    to: 'Montado',
    label: 'Completar Montaje',
    description: 'Finaliza el montaje, evento listo para ejecutarse',
    requiredConditions: [
      'Montaje completado',
      'Checklist de montaje verificado',
    ],
    action: 'complete_montaje',
  },
  {
    from: 'En Montaje',
    to: 'Cancelado',
    label: 'Cancelar Evento',
    description: 'Cancela el evento durante el montaje',
    requiredConditions: [],
    action: 'cancel_event',
  },
  {
    from: 'Montado',
    to: 'En Desmontaje',
    label: 'Iniciar Desmontaje',
    description: 'Comienza el proceso de desmontaje y retiro de equipos',
    requiredConditions: [
      'Evento finalizado',
    ],
    action: 'create_desmontaje',
  },
  {
    from: 'En Desmontaje',
    to: 'Cerrado',
    label: 'Cerrar Evento',
    description: 'Finaliza el evento, todo el equipo reintegrado',
    requiredConditions: [
      'Desmontaje completado',
      'Checklist de desmontaje verificado',
      'Equipos reintegrados al inventario',
    ],
    action: 'complete_desmontaje',
  },
];

/**
 * Obtiene las transiciones posibles desde un estado
 */
export function getPossibleTransitions(currentState: EventState): StateTransition[] {
  return STATE_TRANSITIONS.filter(t => t.from === currentState);
}

/**
 * Verifica si una transición es válida
 */
export function isValidTransition(from: EventState, to: EventState): boolean {
  return STATE_TRANSITIONS.some(t => t.from === from && t.to === to);
}

/**
 * Obtiene información de una transición específica
 */
export function getTransition(from: EventState, to: EventState): StateTransition | undefined {
  return STATE_TRANSITIONS.find(t => t.from === from && t.to === to);
}

/**
 * Valida las condiciones para una transición
 */
export function validateTransitionConditions(
  event: Event,
  targetState: EventState,
  montajeCompletado: boolean = false,
  desmontaljeCompletado: boolean = false
): {
  valid: boolean;
  missingConditions: string[];
} {
  const transition = getTransition(event.estado, targetState);
  
  if (!transition) {
    return {
      valid: false,
      missingConditions: ['Transición no válida'],
    };
  }

  const missingConditions: string[] = [];

  // Verificar condiciones según la transición
  if (transition.from === 'Agendado' && transition.to === 'En Montaje') {
    if (!event.equipamientoAsignado || event.equipamientoAsignado.length === 0) {
      missingConditions.push('Debe asignar equipamiento');
    }
    if (!event.vehiculoId) {
      missingConditions.push('Debe asignar un vehículo');
    }
    if (!event.trabajadoresAsignados || event.trabajadoresAsignados.length === 0) {
      missingConditions.push('Debe asignar trabajadores');
    }
  }

  if (transition.from === 'En Montaje' && transition.to === 'Montado') {
    if (!montajeCompletado) {
      missingConditions.push('El montaje debe estar completado');
    }
  }

  if (transition.from === 'En Desmontaje' && transition.to === 'Cerrado') {
    if (!desmontaljeCompletado) {
      missingConditions.push('El desmontaje debe estar completado');
    }
  }

  return {
    valid: missingConditions.length === 0,
    missingConditions,
  };
}

/**
 * Aplica una transición de estado
 */
export function applyStateTransition(
  event: Event,
  targetState: EventState
): Event {
  const now = new Date().toISOString();
  
  const updatedEvent: Event = {
    ...event,
    estado: targetState,
    updatedAt: now,
  };

  // Lógica adicional según la transición
  if (targetState === 'En Montaje') {
    updatedEvent.montajeRealizado = false;
  }

  if (targetState === 'Montado') {
    updatedEvent.montajeRealizado = true;
  }

  if (targetState === 'En Desmontaje') {
    updatedEvent.desmontaljeRealizado = false;
  }

  if (targetState === 'Cerrado') {
    updatedEvent.desmontaljeRealizado = true;
  }

  return updatedEvent;
}

/**
 * Obtiene el color del estado para UI
 */
export function getStateColor(state: EventState): string {
  const colors: Record<EventState, string> = {
    'Agendado': 'bg-blue-100 text-blue-800 border-blue-200',
    'En Montaje': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Montado': 'bg-green-100 text-green-800 border-green-200',
    'En Desmontaje': 'bg-orange-100 text-orange-800 border-orange-200',
    'Cerrado': 'bg-gray-100 text-gray-800 border-gray-200',
    'Cancelado': 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[state] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtiene el icono emoji del estado
 */
export function getStateIcon(state: EventState): string {
  const icons: Record<EventState, string> = {
    'Agendado': '📅',
    'En Montaje': '🔧',
    'Montado': '✅',
    'En Desmontaje': '📦',
    'Cerrado': '🏁',
    'Cancelado': '❌',
  };
  return icons[state] || '📋';
}

/**
 * Obtiene la descripción del estado
 */
export function getStateDescription(state: EventState): string {
  const descriptions: Record<EventState, string> = {
    'Agendado': 'Evento programado, pendiente de montaje',
    'En Montaje': 'Equipos en proceso de instalación',
    'Montado': 'Equipos instalados, evento listo para ejecutarse',
    'En Desmontaje': 'Equipos en proceso de retiro',
    'Cerrado': 'Evento finalizado, equipos reintegrados',
    'Cancelado': 'Evento cancelado',
  };
  return descriptions[state] || 'Estado desconocido';
}

/**
 * Calcula el progreso del evento (0-100%)
 */
export function getEventProgress(state: EventState): number {
  const progress: Record<EventState, number> = {
    'Agendado': 0,
    'En Montaje': 25,
    'Montado': 50,
    'En Desmontaje': 75,
    'Cerrado': 100,
    'Cancelado': 0,
  };
  return progress[state] || 0;
}

/**
 * Obtiene el siguiente estado sugerido
 */
export function getNextSuggestedState(currentState: EventState): EventState | null {
  const nextStates: Record<EventState, EventState | null> = {
    'Agendado': 'En Montaje',
    'En Montaje': 'Montado',
    'Montado': 'En Desmontaje',
    'En Desmontaje': 'Cerrado',
    'Cerrado': null,
    'Cancelado': null,
  };
  return nextStates[currentState] || null;
}
