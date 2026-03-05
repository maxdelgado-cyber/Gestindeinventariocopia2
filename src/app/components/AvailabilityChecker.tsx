import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle2, AlertCircle, AlertTriangle, Calendar, Package } from 'lucide-react';
import { AvailabilityCheck, verificarDisponibilidadMultiple } from '../lib/availabilityEngine';
import { Event, InventoryItem, Montaje } from '../types/allegra';
import { ScrollArea } from './ui/scroll-area';

interface AvailabilityCheckerProps {
  equiposRequeridos: { equipoId: string; cantidad: number }[];
  fechaInicio: string;
  fechaFin: string;
  inventory: InventoryItem[];
  events: Event[];
  montajes: Montaje[];
  eventoExcluirId?: string;
  onAvailabilityChange?: (disponible: boolean) => void;
}

export function AvailabilityChecker({
  equiposRequeridos,
  fechaInicio,
  fechaFin,
  inventory,
  events,
  montajes,
  eventoExcluirId,
  onAvailabilityChange,
}: AvailabilityCheckerProps) {
  const [disponibilidad, setDisponibilidad] = useState<AvailabilityCheck[]>([]);

  useEffect(() => {
    if (equiposRequeridos.length > 0 && fechaInicio && fechaFin) {
      const resultado = verificarDisponibilidadMultiple(
        equiposRequeridos,
        fechaInicio,
        fechaFin,
        inventory,
        events,
        montajes,
        eventoExcluirId
      );
      setDisponibilidad(resultado);

      // Notificar si hay disponibilidad
      const todoDisponible = resultado.every(d => d.disponible);
      if (onAvailabilityChange) {
        onAvailabilityChange(todoDisponible);
      }
    } else {
      setDisponibilidad([]);
      if (onAvailabilityChange) {
        onAvailabilityChange(true);
      }
    }
  }, [equiposRequeridos, fechaInicio, fechaFin, inventory, events, montajes, eventoExcluirId]);

  if (equiposRequeridos.length === 0 || !fechaInicio || !fechaFin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Verificación de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500 text-sm">
            Seleccione equipos y fechas para verificar disponibilidad
          </div>
        </CardContent>
      </Card>
    );
  }

  const equiposDisponibles = disponibilidad.filter(d => d.disponible);
  const equiposNoDisponibles = disponibilidad.filter(d => !d.disponible);
  const totalConflictos = disponibilidad.reduce((sum, d) => sum + d.conflictos.length, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Verificación de Disponibilidad
          </CardTitle>
          {equiposNoDisponibles.length === 0 ? (
            <Badge className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Todo Disponible
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {equiposNoDisponibles.length} Conflicto{equiposNoDisponibles.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {/* Resumen General */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Período:</span>
                  <p className="font-semibold">
                    {new Date(fechaInicio).toLocaleDateString('es-ES')} - {new Date(fechaFin).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Total Equipos:</span>
                  <p className="font-semibold">{disponibilidad.length} items</p>
                </div>
                <div>
                  <span className="text-gray-600">Disponibles:</span>
                  <p className="font-semibold text-green-700">{equiposDisponibles.length}</p>
                </div>
                <div>
                  <span className="text-gray-600">No Disponibles:</span>
                  <p className="font-semibold text-red-700">{equiposNoDisponibles.length}</p>
                </div>
              </div>
            </div>

            {/* Equipos No Disponibles (Alertas) */}
            {equiposNoDisponibles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Equipos con Conflictos
                </h4>
                {equiposNoDisponibles.map((item, index) => (
                  <Alert key={index} variant="destructive">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <AlertTitle className="text-sm mb-1">
                            {item.equipoNombre}
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            Solicitado: {equiposRequeridos.find(e => e.equipoId === item.equipoId)?.cantidad} unidades
                          </AlertDescription>
                        </div>
                        <Package className="h-4 w-4 mt-1" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs bg-white/10 p-2 rounded">
                        <div>
                          <span className="text-white/80">Total:</span>
                          <p className="font-semibold">{item.cantidadTotal}</p>
                        </div>
                        <div>
                          <span className="text-white/80">Reservado:</span>
                          <p className="font-semibold">{item.cantidadReservada}</p>
                        </div>
                        <div>
                          <span className="text-white/80">Disponible:</span>
                          <p className="font-semibold">{item.cantidadDisponible}</p>
                        </div>
                      </div>

                      {item.conflictos.length > 0 && (
                        <div className="bg-white/10 p-2 rounded">
                          <p className="text-xs font-semibold mb-1 text-white/90">
                            Eventos en conflicto:
                          </p>
                          <ul className="space-y-1">
                            {item.conflictos.map((conflicto, cIndex) => (
                              <li key={cIndex} className="text-xs">
                                • <span className="font-medium">{conflicto.eventoNombre}</span>
                                <br />
                                <span className="text-white/70 ml-3">
                                  {new Date(conflicto.fechaInicio).toLocaleDateString('es-ES')} - {new Date(conflicto.fechaFin).toLocaleDateString('es-ES')}
                                  {' '}({conflicto.cantidadReservada} unidades)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            {/* Equipos Disponibles */}
            {equiposDisponibles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Equipos Disponibles ({equiposDisponibles.length})
                </h4>
                <div className="space-y-2">
                  {equiposDisponibles.map((item, index) => (
                    <div 
                      key={index} 
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {item.equipoNombre}
                          </p>
                          <p className="text-xs text-gray-600">
                            Solicitado: {equiposRequeridos.find(e => e.equipoId === item.equipoId)?.cantidad} unidades
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2 bg-white p-2 rounded">
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="font-semibold text-gray-900">{item.cantidadTotal}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Reservado:</span>
                          <p className="font-semibold text-gray-900">{item.cantidadReservada}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Disponible:</span>
                          <p className="font-semibold text-green-700">{item.cantidadDisponible}</p>
                        </div>
                      </div>

                      {item.conflictos.length > 0 && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 p-2 rounded">
                          <p className="text-xs text-yellow-800 font-medium mb-1">
                            ℹ️ Otros eventos en estas fechas:
                          </p>
                          <ul className="space-y-1">
                            {item.conflictos.map((conflicto, cIndex) => (
                              <li key={cIndex} className="text-xs text-yellow-700">
                                • {conflicto.eventoNombre} ({conflicto.cantidadReservada} unidades)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
