import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PackageX, Calendar, User, MapPin, Check, AlertCircle, ArrowLeft, FileText, Edit, Clock, Trash2, Plus, Truck } from 'lucide-react';
import { Event, Montaje, Desmontaje, DesmontaljeItem, InventoryItem } from '../types/allegra';
import { eventsAPI, inventoryAPI, desmontajesAPI, montajesAPI } from '../lib/api';
import { useNavigate } from 'react-router';

export function DesmontajePage() {
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Event | null>(null);
  const [montajeRelacionado, setMontajeRelacionado] = useState<Montaje | null>(null);
  const [desmontaljeItems, setDesmontaljeItems] = useState<DesmontaljeItem[]>([]);
  const [responsable, setResponsable] = useState('');
  const [fechaRetorno, setFechaRetorno] = useState(new Date().toISOString().split('T')[0]);
  const [horaRetorno, setHoraRetorno] = useState(new Date().toTimeString().slice(0, 5));
  const [incidencias, setIncidencias] = useState<string[]>([]);
  const [nuevaIncidencia, setNuevaIncidencia] = useState('');
  const [eventos, setEventos] = useState<Event[]>([]);
  const [montajes, setMontajes] = useState<Montaje[]>([]);
  const [desmontajes, setDesmontajes] = useState<Desmontaje[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🔄 [DESMONTAJE] Cargando datos...');
    
    // Check if there's a selected event from navigation
    const savedEvent = localStorage.getItem('desmontaje_evento_selected');
    if (savedEvent) {
      const evento = JSON.parse(savedEvent);
      setEventoSeleccionado(evento);
      localStorage.removeItem('desmontaje_evento_selected');

      // Find related montaje
      const montajes = JSON.parse(localStorage.getItem('allegra_montajes') || '[]');
      const montaje = montajes.find((m: Montaje) => m.eventoId === evento.id);
      
      if (montaje) {
        setMontajeRelacionado(montaje);
        
        // Initialize desmontaje items from montaje
        const items: DesmontaljeItem[] = montaje.items.map(item => ({
          equipoId: item.equipoId,
          equipoNombre: item.equipoNombre,
          cantidadSalida: item.cantidad,
          cantidadRetorno: item.cantidad,
          estadoRetorno: 'Correcto',
          observaciones: '',
          confirmado: false,
        }));
        setDesmontaljeItems(items);
      }
    }

    // Load all events con fallback a localStorage
    try {
      const data = await eventsAPI.getAll();
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || 'null');
      const loadedEvents =
        (data && data.length > 0) ? data :
        (localEvents && localEvents.length > 0) ? localEvents :
        [];
      console.log('📋 [DESMONTAJE] Eventos cargados:', loadedEvents.length, 'fuente:', data?.length > 0 ? 'backend' : 'localStorage');
      setEventos(loadedEvents);
    } catch (error) {
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || '[]');
      console.log('📋 [DESMONTAJE] Eventos desde localStorage (catch):', localEvents.length);
      setEventos(localEvents);
    }

    // Load montajes con fallback
    try {
      const data = await montajesAPI.getAll();
      const localMontajes = JSON.parse(localStorage.getItem('allegra_montajes') || '[]');
      const loadedMontajes =
        (data && data.length > 0) ? data :
        (localMontajes && localMontajes.length > 0) ? localMontajes :
        [];
      console.log('📦 [DESMONTAJE] Montajes cargados:', loadedMontajes.length);
      setMontajes(loadedMontajes);
    } catch (error) {
      const localMontajes = JSON.parse(localStorage.getItem('allegra_montajes') || '[]');
      setMontajes(localMontajes);
    }

    // Load desmontajes con fallback
    try {
      const data = await desmontajesAPI.getAll();
      const localDesmontajes = JSON.parse(localStorage.getItem('allegra_desmontajes') || '[]');
      const loadedDesmontajes =
        (data && data.length > 0) ? data :
        (localDesmontajes && localDesmontajes.length > 0) ? localDesmontajes :
        [];
      console.log('🔙 [DESMONTAJE] Desmontajes cargados:', loadedDesmontajes.length);
      setDesmontajes(loadedDesmontajes);
    } catch (error) {
      const localDesmontajes = JSON.parse(localStorage.getItem('allegra_desmontajes') || '[]');
      setDesmontajes(localDesmontajes);
    }
  };

  const handleUpdateCantidadRetorno = (equipoId: string, value: number) => {
    setDesmontaljeItems(desmontaljeItems.map(item =>
      item.equipoId === equipoId
        ? { ...item, cantidadRetorno: Math.max(0, value) }
        : item
    ));
  };

  const handleUpdateEstado = (equipoId: string, estado: DesmontaljeItem['estadoRetorno']) => {
    setDesmontaljeItems(desmontaljeItems.map(item =>
      item.equipoId === equipoId
        ? { ...item, estadoRetorno: estado }
        : item
    ));
  };

  const handleUpdateObservaciones = (equipoId: string, observaciones: string) => {
    setDesmontaljeItems(desmontaljeItems.map(item =>
      item.equipoId === equipoId
        ? { ...item, observaciones }
        : item
    ));
  };

  const handleToggleConfirmado = (equipoId: string) => {
    setDesmontaljeItems(desmontaljeItems.map(item =>
      item.equipoId === equipoId
        ? { ...item, confirmado: !item.confirmado }
        : item
    ));
  };

  const handleAgregarIncidencia = () => {
    if (nuevaIncidencia.trim()) {
      setIncidencias([...incidencias, nuevaIncidencia.trim()]);
      setNuevaIncidencia('');
    }
  };

  const handleEliminarIncidencia = (index: number) => {
    setIncidencias(incidencias.filter((_, i) => i !== index));
  };

  const handleCompletarDesmontaje = async () => {
    if (!eventoSeleccionado || !montajeRelacionado) {
      alert('No hay evento o montaje seleccionado');
      return;
    }

    if (!responsable.trim()) {
      alert('⚠️ Debe indicar el responsable de recepción');
      return;
    }

    const allConfirmed = desmontaljeItems.every(item => item.confirmado);
    if (!allConfirmed) {
      const pendientes = desmontaljeItems.filter(item => !item.confirmado);
      alert(`⚠️ Debe confirmar todos los equipos antes de completar el desmontaje.\n\nEquipos pendientes:\n${pendientes.map(p => `• ${p.equipoNombre}`).join('\n')}`);
      return;
    }

    const desmontaje: Desmontaje = {
      id: `DSM-${Date.now()}`,
      eventoId: eventoSeleccionado.id,
      montajeId: montajeRelacionado.id,
      items: desmontaljeItems,
      responsableRecepcion: responsable,
      fechaRetorno,
      horaRetorno,
      incidencias,
      completado: true,
    };

    try {
      console.log('💾 Guardando desmontaje:', desmontaje);
      
      // Save desmontaje
      const existingDesmontajes = JSON.parse(localStorage.getItem('allegra_desmontajes') || '[]');
      const updatedDesmontajes = [...existingDesmontajes, desmontaje];
      localStorage.setItem('allegra_desmontajes', JSON.stringify(updatedDesmontajes));
      
      await desmontajesAPI.save(updatedDesmontajes).catch((error) => {
        console.log('💾 Desmontaje guardado localmente', error);
      });

      // Update event status
      const events = JSON.parse(localStorage.getItem('allegra_events') || '[]');
      const updatedEvents = events.map((e: Event) =>
        e.id === eventoSeleccionado.id
          ? { ...e, desmontaljeRealizado: true, estado: 'Cerrado' as const }
          : e
      );
      localStorage.setItem('allegra_events', JSON.stringify(updatedEvents));
      
      await eventsAPI.save(updatedEvents).catch((error) => {
        console.log('💾 Eventos actualizados localmente', error);
      });

      // Update inventory
      const inventory = JSON.parse(localStorage.getItem('allegra_inventory') || '[]');
      const updatedInventory = inventory.map((item: any) => {
        const desmontaljeItem = desmontaljeItems.find(di => di.equipoId === item.id);
        if (desmontaljeItem) {
          // Para insumos consumibles: NO reintegrar cantidad (ya se consumieron)
          // Para equipos normales: Cambiar estado y actualizar historial
          
          // Determine new estado based on return condition (solo para equipos normales)
          let nuevoEstado = item.estado;
          if (!item.esConsumible) {
            if (desmontaljeItem.estadoRetorno === 'Dañado') {
              nuevoEstado = 'Dañado';
            } else if (desmontaljeItem.cantidadRetorno < desmontaljeItem.cantidadSalida) {
              nuevoEstado = 'Disponible'; // Partial return
            } else {
              nuevoEstado = 'Disponible'; // Full return in good condition
            }
          }

          // Update history
          const updatedHistorial = item.historialUso.map((h: any) => {
            if (h.eventoId === eventoSeleccionado.id && !h.fechaRetorno) {
              return {
                ...h,
                fechaRetorno,
                estadoRetorno: desmontaljeItem.estadoRetorno,
                cantidadRetorno: desmontaljeItem.cantidadRetorno,
                observaciones: desmontaljeItem.observaciones,
              };
            }
            return h;
          });

          // Los insumos consumibles solo actualizan historial, no cambian estado
          return {
            ...item,
            estado: nuevoEstado,
            historialUso: updatedHistorial,
          };
        }
        return item;
      });
      
      localStorage.setItem('allegra_inventory', JSON.stringify(updatedInventory));
      await inventoryAPI.save(updatedInventory).catch((error) => {
        console.log('💾 Inventario actualizado localmente', error);
      });

      console.log('✅ Desmontaje completado exitosamente');
      alert('✅ Desmontaje completado exitosamente');
      
      // Reset and navigate to event detail
      const eventoId = eventoSeleccionado.id;
      setEventoSeleccionado(null);
      setMontajeRelacionado(null);
      setDesmontaljeItems([]);
      setResponsable('');
      setIncidencias([]);
      navigate(`/eventos/${eventoId}`);
      
    } catch (error) {
      console.error('❌ Error al guardar desmontaje:', error);
      alert(`❌ Error al guardar el desmontaje: ${error}`);
    }
  };

  if (!eventoSeleccionado || !montajeRelacionado) {
    const handleIniciarDesmontaje = (evento: Event) => {
      const montaje = montajes.find(m => m.eventoId === evento.id);
      if (montaje) {
        setEventoSeleccionado(evento);
        setMontajeRelacionado(montaje);
        
        // Initialize desmontaje items from montaje
        const items: DesmontaljeItem[] = montaje.items.map(item => ({
          equipoId: item.equipoId,
          equipoNombre: item.equipoNombre,
          cantidadSalida: item.cantidad,
          cantidadRetorno: item.cantidad,
          estadoRetorno: 'Correcto',
          observaciones: '',
          confirmado: false,
        }));
        setDesmontaljeItems(items);
      }
    };

    const handleEditarDesmontaje = (desmontaje: Desmontaje) => {
      const evento = eventos.find(e => e.id === desmontaje.eventoId);
      const montaje = montajes.find(m => m.id === desmontaje.montajeId);
      if (evento && montaje) {
        setEventoSeleccionado(evento);
        setMontajeRelacionado(montaje);
        setDesmontaljeItems(desmontaje.items);
        setResponsable(desmontaje.responsableRecepcion);
        setFechaRetorno(desmontaje.fechaRetorno);
        setHoraRetorno(desmontaje.horaRetorno);
        setIncidencias(desmontaje.incidencias || []);
      }
    };

    const eventosConDesmontaje = eventos.filter(e => e.desmontaljeRealizado);
    const eventosPendientesDesmontaje = eventos.filter(e => 
      e.montajeRealizado && 
      !e.desmontaljeRealizado
    );

    console.log('🔍 [DESMONTAJE] Eventos pendientes filtrados:', eventosPendientesDesmontaje);
    console.log('🔍 [DESMONTAJE] Total eventos:', eventos.length);
    console.log('🔍 [DESMONTAJE] Estados de eventos:', eventos.map(e => ({ id: e.id, nombre: e.nombre, estado: e.estado, montajeRealizado: e.montajeRealizado, desmontaljeRealizado: e.desmontaljeRealizado })));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Módulo de Desmontaje</h1>
          <p className="text-gray-600 mt-1">Gestión de reintegro de equipos</p>
        </div>

        {/* Eventos Pendientes de Desmontaje */}
        {eventosPendientesDesmontaje.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Eventos Pendientes de Desmontaje ({eventosPendientesDesmontaje.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventosPendientesDesmontaje.map((evento) => {
                  const montaje = montajes.find(m => m.eventoId === evento.id);
                  return (
                    <div
                      key={evento.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{evento.nombre}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{evento.cliente}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(evento.fechaInicio).toLocaleDateString('es-CL')}</span>
                            </div>
                            {montaje && (
                              <>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-700">Montaje: {montaje.responsableEntrega}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PackageX className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-700">{montaje.items.length} equipos en campo</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Button onClick={() => handleIniciarDesmontaje(evento)}>
                          <PackageX className="mr-2 h-4 w-4" />
                          Iniciar Desmontaje
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eventos con Desmontaje Completado */}
        {eventosConDesmontaje.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Desmontajes Completados ({eventosConDesmontaje.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventosConDesmontaje.map((evento) => {
                  const desmontaje = desmontajes.find(d => d.eventoId === evento.id);
                  return (
                    <div
                      key={evento.id}
                      className="border rounded-lg p-4 bg-green-50 border-green-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{evento.nombre}</h3>
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Completado</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{evento.cliente}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(evento.fechaInicio).toLocaleDateString('es-CL')}</span>
                            </div>
                            {desmontaje && (
                              <>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">Recepción: {desmontaje.responsableRecepcion}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PackageX className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700">{desmontaje.items.length} equipos devueltos</span>
                                </div>
                                {desmontaje.incidencias && desmontaje.incidencias.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span className="text-orange-700">{desmontaje.incidencias.length} incidencias</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => desmontaje && handleEditarDesmontaje(desmontaje)}
                          disabled={!desmontaje}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {eventosPendientesDesmontaje.length === 0 && eventosConDesmontaje.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <PackageX className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">No hay eventos para desmontaje</h3>
                  <p className="text-gray-500 mt-2">
                    Los eventos con montaje completado aparecerán aquí para su desmontaje
                  </p>
                </div>
                <Button onClick={() => navigate('/eventos')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ir a Eventos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Panel de Depuración */}
        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader>
            <CardTitle className="text-blue-900">🔍 Panel de Depuración - Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-blue-900">Total de eventos en el sistema:</strong> {eventos.length}
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">Desglose de eventos:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {eventos.map(e => (
                    <li key={e.id} className="text-xs">
                      <strong>{e.nombre}</strong> - 
                      Estado: <span className={`font-semibold ${
                        e.estado === 'Montado' ? 'text-green-600' : 
                        e.estado === 'En Montaje' ? 'text-blue-600' :
                        e.estado === 'Agendado' ? 'text-gray-600' : 'text-purple-600'
                      }`}>{e.estado}</span> - 
                      Montaje: {e.montajeRealizado ? '✅' : '❌'} - 
                      Desmontaje: {e.desmontaljeRealizado ? '✅' : '❌'}
                    </li>
                  ))}
                  {eventos.length === 0 && (
                    <li className="text-red-600">❌ No hay eventos en el sistema</li>
                  )}
                </ul>
              </div>

              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">Eventos que califican para desmontaje:</strong>
                <div className="mt-2 text-xs">
                  <p className="text-gray-600 mb-2">Condiciones: montajeRealizado=true AND desmontaljeRealizado=false AND estado='Montado'</p>
                  {eventosPendientesDesmontaje.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {eventosPendientesDesmontaje.map(e => (
                        <li key={e.id} className="text-green-700">
                          ✅ {e.nombre} - Estado: {e.estado}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-orange-600">⚠️ No hay eventos que cumplan las condiciones</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">Montajes registrados:</strong> {montajes.length}
                {montajes.length > 0 && (
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    {montajes.map(m => {
                      const evento = eventos.find(e => e.id === m.eventoId);
                      return (
                        <li key={m.id}>
                          Montaje {m.id} - Evento: {evento?.nombre || m.eventoId} - Equipos: {m.items.length}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                <strong className="text-yellow-900">💡 Para que un evento aparezca aquí:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-xs text-yellow-800">
                  <li>El evento debe tener <code className="bg-yellow-200 px-1 rounded">montajeRealizado = true</code></li>
                  <li>El evento debe tener <code className="bg-yellow-200 px-1 rounded">desmontaljeRealizado = false</code></li>
                  <li>El evento debe estar en estado <code className="bg-yellow-200 px-1 rounded">"Montado"</code></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allConfirmed = desmontaljeItems.every(item => item.confirmado);
  const hasProblems = desmontaljeItems.some(
    item => item.estadoRetorno !== 'Correcto' || item.cantidadRetorno < item.cantidadSalida
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Módulo de Desmontaje</h1>
          <p className="text-gray-600 mt-1">Reintegro de equipos</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/eventos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Eventos
        </Button>
      </div>

      {/* Event Info */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-bold">{eventoSeleccionado.nombre}</h3>
              <div className="space-y-2 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{eventoSeleccionado.cliente}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    {new Date(eventoSeleccionado.fechaInicio).toLocaleDateString('es-CL')}
                    {eventoSeleccionado.horaInicio && ` - ${eventoSeleccionado.horaInicio}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{eventoSeleccionado.direccion}</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800 text-sm">Montaje Realizado</div>
                  <p className="text-sm text-blue-700 mt-1">
                    Responsable: {montajeRelacionado.responsableEntrega}<br />
                    Salida: {new Date(montajeRelacionado.fechaSalida).toLocaleDateString('es-CL')} {montajeRelacionado.horaSalida}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Logística - Transporte */}
          {(eventoSeleccionado.choferNombre || eventoSeleccionado.vehiculoNombre) && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-purple-700 mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Logística - Transporte
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eventoSeleccionado.choferNombre && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs text-purple-600 font-medium">Chofer Asignado</div>
                    <div className="text-sm font-semibold text-purple-900 mt-1">
                      {eventoSeleccionado.choferNombre}
                    </div>
                  </div>
                )}
                {eventoSeleccionado.vehiculoNombre && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs text-purple-600 font-medium">Vehículo Asignado</div>
                    <div className="text-sm font-semibold text-purple-900 mt-1">
                      {eventoSeleccionado.vehiculoNombre}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desmontaje Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Desmontaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Responsable de Recepción *</label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Nombre del responsable"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Retorno *</label>
              <input
                type="date"
                value={fechaRetorno}
                onChange={(e) => setFechaRetorno(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Retorno *</label>
              <input
                type="time"
                value={horaRetorno}
                onChange={(e) => setHoraRetorno(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            Checklist de Retorno ({desmontaljeItems.length} equipos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {desmontaljeItems.map((item) => (
              <div
                key={item.equipoId}
                className={`border rounded-lg p-4 ${
                  item.confirmado
                    ? item.estadoRetorno === 'Correcto'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-yellow-50 border-yellow-200'
                    : 'bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleConfirmado(item.equipoId)}
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-1 ${
                          item.confirmado
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {item.confirmado && <Check className="h-4 w-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="font-medium">{item.equipoNombre}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Cantidad salida: {item.cantidadSalida}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Cantidad Retorno</label>
                        <input
                          type="number"
                          value={item.cantidadRetorno}
                          onChange={(e) => handleUpdateCantidadRetorno(item.equipoId, parseInt(e.target.value) || 0)}
                          className="w-20 border rounded px-2 py-1 text-center"
                          min="0"
                          max={item.cantidadSalida}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Estado</label>
                        <select
                          value={item.estadoRetorno}
                          onChange={(e) => handleUpdateEstado(item.equipoId, e.target.value as DesmontaljeItem['estadoRetorno'])}
                          className="border rounded px-3 py-1"
                        >
                          <option value="Correcto">Correcto</option>
                          <option value="Dañado">Dañado</option>
                          <option value="Faltante">Faltante</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {(item.estadoRetorno !== 'Correcto' || item.cantidadRetorno < item.cantidadSalida) && (
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Observaciones</label>
                      <input
                        type="text"
                        value={item.observaciones}
                        onChange={(e) => handleUpdateObservaciones(item.equipoId, e.target.value)}
                        className="w-full border rounded px-3 py-1 text-sm"
                        placeholder="Describe el problema o faltante..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incidencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Incidencias Generales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaIncidencia}
                onChange={(e) => setNuevaIncidencia(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAgregarIncidencia()}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Agregar incidencia general..."
              />
              <Button onClick={handleAgregarIncidencia}>Agregar</Button>
            </div>

            {incidencias.length > 0 && (
              <div className="space-y-2">
                {incidencias.map((incidencia, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="text-sm text-red-800">{incidencia}</span>
                    <button
                      onClick={() => handleEliminarIncidencia(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning if problems */}
      {hasProblems && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-orange-800">Atención: Se detectaron problemas</div>
                <p className="text-sm text-orange-700 mt-1">
                  Hay equipos con daños o faltantes. Asegúrate de documentar todas las observaciones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setEventoSeleccionado(null);
            setMontajeRelacionado(null);
            navigate('/eventos');
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCompletarDesmontaje}
          disabled={!allConfirmed || !responsable.trim()}
          className={allConfirmed && responsable.trim() ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <PackageX className="mr-2 h-4 w-4" />
          Completar Desmontaje
        </Button>
      </div>

      {/* Debug Info - Remove after testing */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p><strong>🔍 Estado de Validación:</strong></p>
            <p>✓ Responsable: {responsable.trim() ? `"${responsable}"` : '❌ VACÍO'}</p>
            <p> Todos confirmados: {allConfirmed ? '✅ SÍ' : '❌ NO'}</p>
            <p>✓ Equipos pendientes: {desmontaljeItems.filter(i => !i.confirmado).length}</p>
            {!allConfirmed && (
              <div className="mt-2 p-2 bg-yellow-100 rounded">
                <p className="font-semibold">Equipos sin confirmar:</p>
                <ul className="list-disc list-inside">
                  {desmontaljeItems.filter(i => !i.confirmado).map(item => (
                    <li key={item.equipoId}>{item.equipoNombre}</li>
                  ))}
                </ul>
              </div>
            )}
            <p>✓ Botón habilitado: {allConfirmed && responsable.trim() ? '✅ SÍ' : '❌ NO'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}