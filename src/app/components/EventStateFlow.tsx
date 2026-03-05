import { Event } from '../types/allegra';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  getStateColor, 
  getStateIcon, 
  getStateDescription, 
  getEventProgress,
  getPossibleTransitions,
  validateTransitionConditions,
  EventState,
  StateTransition
} from '../lib/eventStateMachine';
import { CheckCircle2, Circle, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface EventStateFlowProps {
  event: Event;
  montajeCompletado?: boolean;
  desmontaljeCompletado?: boolean;
  onStateTransition?: (targetState: EventState) => void;
  readOnly?: boolean;
}

export function EventStateFlow({ 
  event, 
  montajeCompletado = false,
  desmontaljeCompletado = false,
  onStateTransition,
  readOnly = false,
}: EventStateFlowProps) {
  const allStates: EventState[] = ['Agendado', 'En Montaje', 'Montado', 'En Desmontaje', 'Cerrado'];
  const currentStateIndex = allStates.indexOf(event.estado);
  const progress = getEventProgress(event.estado);
  const possibleTransitions = getPossibleTransitions(event.estado);

  const handleTransition = (targetState: EventState) => {
    if (onStateTransition && !readOnly) {
      onStateTransition(targetState);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Flujo del Evento
          </span>
          <Badge className={getStateColor(event.estado)}>
            {getStateIcon(event.estado)} {event.estado}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de Progreso General */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso del Evento</span>
            <span className="text-sm font-semibold text-purple-600">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {getStateDescription(event.estado)}
          </p>
        </div>

        {/* Timeline Visual */}
        <div className="relative">
          <div className="flex justify-between items-start">
            {allStates.map((state, index) => {
              const isCompleted = index < currentStateIndex;
              const isCurrent = index === currentStateIndex;
              const isFuture = index > currentStateIndex;
              
              return (
                <div key={state} className="flex flex-col items-center flex-1">
                  {/* Icono de Estado */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${isCompleted ? 'bg-green-600 border-green-600' : ''}
                    ${isCurrent ? 'bg-purple-600 border-purple-600 ring-4 ring-purple-100' : ''}
                    ${isFuture ? 'bg-gray-200 border-gray-300' : ''}
                    transition-all duration-300
                  `}>
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-white" />}
                    {isCurrent && <div className="text-white text-lg">{getStateIcon(state)}</div>}
                    {isFuture && <Circle className="h-5 w-5 text-gray-400" />}
                  </div>
                  
                  {/* Etiqueta */}
                  <div className="mt-2 text-center">
                    <p className={`
                      text-xs font-medium
                      ${isCompleted ? 'text-green-700' : ''}
                      ${isCurrent ? 'text-purple-700 font-bold' : ''}
                      ${isFuture ? 'text-gray-500' : ''}
                    `}>
                      {state}
                    </p>
                  </div>

                  {/* Línea conectora */}
                  {index < allStates.length - 1 && (
                    <div className={`
                      absolute top-5 h-0.5 transition-all duration-300
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                    `} style={{
                      left: `${(index / (allStates.length - 1)) * 100 + 10}%`,
                      width: `${(1 / (allStates.length - 1)) * 100 - 20}%`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado Cancelado (si aplica) */}
        {event.estado === 'Cancelado' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Evento Cancelado</AlertTitle>
            <AlertDescription>
              Este evento ha sido cancelado y no continuará con el flujo normal.
            </AlertDescription>
          </Alert>
        )}

        {/* Acciones Posibles (Transiciones) */}
        {!readOnly && possibleTransitions.length > 0 && event.estado !== 'Cerrado' && event.estado !== 'Cancelado' && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Acciones Disponibles
            </h4>
            
            {possibleTransitions.map((transition) => {
              const validation = validateTransitionConditions(
                event,
                transition.to,
                montajeCompletado,
                desmontaljeCompletado
              );

              return (
                <div key={`${transition.from}-${transition.to}`} className="space-y-2">
                  <Button
                    onClick={() => handleTransition(transition.to)}
                    disabled={!validation.valid}
                    className="w-full justify-between"
                    variant={validation.valid ? 'default' : 'outline'}
                  >
                    <span className="flex items-center gap-2">
                      {getStateIcon(transition.to)}
                      {transition.label}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {/* Descripción de la transición */}
                  <p className="text-xs text-gray-600 px-1">
                    {transition.description}
                  </p>

                  {/* Condiciones requeridas */}
                  {transition.requiredConditions.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        Requisitos:
                      </p>
                      <ul className="space-y-1">
                        {transition.requiredConditions.map((condition, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Condiciones faltantes */}
                  {!validation.valid && validation.missingConditions.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Condiciones pendientes</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-1 space-y-1">
                          {validation.missingConditions.map((condition, index) => (
                            <li key={index} className="text-xs">
                              • {condition}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mensaje de evento completado */}
        {event.estado === 'Cerrado' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Evento Completado</AlertTitle>
            <AlertDescription className="text-green-700">
              Este evento ha sido cerrado exitosamente. Todos los equipos han sido reintegrados al inventario.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
