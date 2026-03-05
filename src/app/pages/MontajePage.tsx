import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PackageOpen, Calendar, User, MapPin, Check, AlertCircle, ArrowLeft, Printer, FileText, Edit, Clock, Trash2, X, Plus, Truck, PackageCheck, Search } from 'lucide-react';
import { Event, InventoryItem, Montaje, MontajeItem, Worker, Vehicle } from '../types/allegra';
import { eventsAPI, inventoryAPI, montajesAPI, workersAPI, vehiclesAPI } from '../lib/api';
import { INITIAL_INVENTORY, INITIAL_EVENTS } from '../data/initialData';
import { useNavigate } from 'react-router';

export function MontajePage() {
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Event | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [montajeItems, setMontajeItems] = useState<MontajeItem[]>([]);
  const [responsable, setResponsable] = useState('');
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split('T')[0]);
  const [horaSalida, setHoraSalida] = useState(new Date().toTimeString().slice(0, 5));
  const [observaciones, setObservaciones] = useState('');
  const [showAddEquipo, setShowAddEquipo] = useState(false);
  const [montajeCompletado, setMontajeCompletado] = useState<Montaje | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPreviewOnly, setShowPreviewOnly] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventos, setEventos] = useState<Event[]>([]);
  const [montajes, setMontajes] = useState<Montaje[]>([]);
  const [montajeIdEditing, setMontajeIdEditing] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [choferId, setChoferId] = useState('');
  const [vehiculoId, setVehiculoId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Check if there's a selected event from navigation
    const savedEvent = localStorage.getItem('montaje_evento_selected');
    if (savedEvent) {
      const evento = JSON.parse(savedEvent);
      setEventoSeleccionado(evento);
      localStorage.removeItem('montaje_evento_selected'); // Clean up
    }

    // Load inventory
    try {
      const data = await inventoryAPI.getAll();
      const loadedInventory = data && data.length > 0
        ? data
        : JSON.parse(localStorage.getItem('allegra_inventory') || 'null') || INITIAL_INVENTORY;
      setInventory(loadedInventory);
    } catch (error) {
      const localInventory = JSON.parse(localStorage.getItem('allegra_inventory') || 'null') || INITIAL_INVENTORY;
      setInventory(localInventory);
    }

    // Load events
    try {
      const data = await eventsAPI.getAll();
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || 'null');
      const shouldUseInitial = (!localEvents || localEvents.length === 0) && INITIAL_EVENTS.length > 0;
      
      const loadedEvents = data && data.length > 0
        ? data
        : shouldUseInitial
          ? INITIAL_EVENTS
          : (localEvents || []);
      
      console.log('🔍 MontajePage - Eventos cargados:', {
        backend: data?.length || 0,
        localStorage: localEvents?.length || 0,
        initial: INITIAL_EVENTS.length,
        final: loadedEvents.length,
        shouldUseInitial
      });
      
      setEventos(loadedEvents);
    } catch (error) {
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || 'null');
      const shouldUseInitial = (!localEvents || localEvents.length === 0) && INITIAL_EVENTS.length > 0;
      const loadedEvents = shouldUseInitial ? INITIAL_EVENTS : (localEvents || []);
      setEventos(loadedEvents);
    }

    // Load montajes
    try {
      const data = await montajesAPI.getAll();
      setMontajes(data);
    } catch (error) {
      const localMontajes = JSON.parse(localStorage.getItem('allegra_montajes') || '[]');
      setMontajes(localMontajes);
    }

    // Load workers
    try {
      const data = await workersAPI.getAll();
      setWorkers(data);
    } catch (error) {
      const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || '[]');
      setWorkers(localWorkers);
    }

    // Load vehicles
    try {
      const data = await vehiclesAPI.getAll();
      setVehicles(data);
    } catch (error) {
      const localVehicles = JSON.parse(localStorage.getItem('allegra_vehicles') || '[]');
      setVehicles(localVehicles);
    }
  };

  const handleAddEquipo = (equipo: InventoryItem) => {
    const existingItem = montajeItems.find(item => item.equipoId === equipo.id);
    
    if (existingItem) {
      alert('Este equipo ya está en la lista');
      return;
    }

    const newItem: MontajeItem = {
      equipoId: equipo.id,
      equipoNombre: equipo.nombre,
      cantidad: 1,
    };

    setMontajeItems([...montajeItems, newItem]);
    setShowAddEquipo(false);
  };

  const handleUpdateCantidad = (equipoId: string, value: number) => {
    setMontajeItems(montajeItems.map(item => 
      item.equipoId === equipoId 
        ? { ...item, cantidad: Math.max(0, value) }
        : item
    ));
  };

  const handleToggleConfirmado = (equipoId: string) => {
    // Función removida - ya no se usa confirmación
  };

  const handleRemoveEquipo = (equipoId: string) => {
    setMontajeItems(montajeItems.filter(item => item.equipoId !== equipoId));
  };

  const handleCompletarMontaje = async () => {
    console.log('🔍 Iniciando handleCompletarMontaje');
    console.log('Evento seleccionado:', eventoSeleccionado);
    console.log('Montaje items:', montajeItems);
    console.log('Responsable:', responsable);
    
    if (!eventoSeleccionado) {
      alert('No hay evento seleccionado');
      return;
    }

    if (montajeItems.length === 0) {
      alert('Debe agregar al menos un equipo');
      return;
    }

    if (!responsable.trim()) {
      alert('Debe indicar el responsable de entrega');
      return;
    }

    // Validar que todos los equipos tengan cantidad mayor a 0
    const equiposSinCantidad = montajeItems.filter(item => item.cantidad <= 0);
    if (equiposSinCantidad.length > 0) {
      alert('Todos los equipos deben tener una cantidad mayor a 0');
      return;
    }

    console.log('✅ Todas las validaciones pasaron');

    const montaje: Montaje = {
      id: `MTJ-${Date.now()}`,
      eventoId: eventoSeleccionado.id,
      items: montajeItems,
      responsableEntrega: responsable,
      fechaSalida,
      horaSalida,
      observaciones,
      completado: true,
    };

    console.log('📦 Montaje creado:', montaje);

    // Save montaje
    try {
      console.log('💾 Guardando montaje...');
      const existingMontajes = JSON.parse(localStorage.getItem('allegra_montajes') || '[]');
      const updatedMontajes = [...existingMontajes, montaje];
      localStorage.setItem('allegra_montajes', JSON.stringify(updatedMontajes));
      console.log('✅ Montaje guardado en localStorage');
      
      await montajesAPI.save(updatedMontajes).catch(() => {
        console.log('💾 Montaje guardado localmente');
      });

      console.log('📝 Actualizando estado del evento...');
      // Update event status
      const events = JSON.parse(localStorage.getItem('allegra_events') || '[]');
      console.log('📋 Eventos antes de actualizar:', events);
      console.log('🎯 Evento a actualizar ID:', eventoSeleccionado.id);
      
      const updatedEvents = events.map((e: Event) => 
        e.id === eventoSeleccionado.id 
          ? { ...e, montajeRealizado: true, estado: 'Montado' as const }
          : e
      );
      
      console.log('📋 Eventos después de actualizar:', updatedEvents);
      console.log('✅ Evento encontrado y actualizado:', updatedEvents.find((e: Event) => e.id === eventoSeleccionado.id));
      
      localStorage.setItem('allegra_events', JSON.stringify(updatedEvents));
      console.log('✅ Evento actualizado en localStorage');
      
      await eventsAPI.save(updatedEvents).catch(() => {
        console.log('💾 Eventos actualizados localmente');
      });

      console.log('📦 Actualizando inventario...');
      // Update inventory status
      const updatedInventory = inventory.map(item => {
        const montajeItem = montajeItems.find(mi => mi.equipoId === item.id);
        if (montajeItem) {
          // Para insumos consumibles: descontar cantidad
          // Para equipos normales: solo cambiar estado a Reservado
          if (item.esConsumible) {
            return {
              ...item,
              cantidad: item.cantidad - montajeItem.cantidad,
              historialUso: [
                ...item.historialUso,
                {
                  eventoId: eventoSeleccionado.id,
                  eventoNombre: eventoSeleccionado.nombre,
                  fechaSalida,
                  estadoSalida: 'Disponible',
                  cantidadSalida: montajeItem.cantidad,
                }
              ]
            };
          } else {
            return {
              ...item,
              estado: 'Reservado' as const,
              historialUso: [
                ...item.historialUso,
                {
                  eventoId: eventoSeleccionado.id,
                  eventoNombre: eventoSeleccionado.nombre,
                  fechaSalida,
                  estadoSalida: 'Disponible',
                  cantidadSalida: montajeItem.cantidad,
                }
              ]
            };
          }
        }
        return item;
      });
      localStorage.setItem('allegra_inventory', JSON.stringify(updatedInventory));
      console.log('✅ Inventario actualizado');
      
      await inventoryAPI.save(updatedInventory).catch(() => {
        console.log('💾 Inventario actualizado localmente');
      });

      console.log('🎉 Montaje completado exitosamente');
      
      // Update local state
      setMontajes([...montajes, montaje]);
      setInventory(updatedInventory);
      
      // Show success message
      alert('✅ Montaje completado exitosamente!\n\nSe ha guardado el registro y actualizado el inventario.');
      
      // Show print preview
      setMontajeCompletado(montaje);
      setShowPrintPreview(true);
      
    } catch (error) {
      console.error('❌ Error al guardar montaje:', error);
      alert('Error al guardar el montaje: ' + error);
    }
  };

  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setShowPreviewOnly(false);
    setMontajeCompletado(null);
    setEventoSeleccionado(null);
    setMontajeItems([]);
    setResponsable('');
    setObservaciones('');
    navigate('/eventos');
  };

  const handleClosePreviewOnly = () => {
    setShowPreviewOnly(false);
    setMontajeCompletado(null);
  };

  const handleShowPreview = () => {
    if (!eventoSeleccionado) {
      alert('No hay evento seleccionado');
      return;
    }

    if (montajeItems.length === 0) {
      alert('Debe agregar al menos un equipo');
      return;
    }

    if (!responsable.trim()) {
      alert('Debe indicar el responsable de entrega');
      return;
    }

    const montajePreview: Montaje = {
      id: `PREVIEW-${Date.now()}`,
      eventoId: eventoSeleccionado.id,
      items: montajeItems,
      responsableEntrega: responsable,
      fechaSalida,
      horaSalida,
      observaciones,
      completado: false,
    };

    setMontajeCompletado(montajePreview);
    setShowPreviewOnly(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const availableInventory = inventory.filter(item => 
    item.estado === 'Disponible' && !montajeItems.some(mi => mi.equipoId === item.id)
  );

  // Get unique categories from available inventory
  const availableCategories = Array.from(new Set(availableInventory.map(item => item.categoria)));

  // Filter by category
  const filteredAvailableInventory = filterCategoria
    ? availableInventory.filter(item => item.categoria === filterCategoria)
    : availableInventory;

  // Print Preview Modal
  if (showPrintPreview && montajeCompletado && eventoSeleccionado) {
    return (
      <>
        {/* Screen only buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-3 print:hidden">
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleClosePrintPreview} variant="outline" size="lg">
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </div>

        {/* Printable Document */}
        <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center border-b-4 border-purple-600 pb-6 mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">ALLEGRA</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Orden de Salida - Montaje</h2>
            <p className="text-gray-600 mt-2">ID: {montajeCompletado.id}</p>
          </div>

          {/* Event Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
              Información del Evento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre del Evento</p>
                <p className="font-semibold text-lg">{eventoSeleccionado.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Evento</p>
                <p className="font-semibold">{eventoSeleccionado.tipoEvento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold">{eventoSeleccionado.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacto Responsable</p>
                <p className="font-semibold">{eventoSeleccionado.contactoResponsable}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-semibold">{eventoSeleccionado.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{eventoSeleccionado.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Dirección del Evento</p>
                <p className="font-semibold">{eventoSeleccionado.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha del Evento</p>
                <p className="font-semibold">
                  {new Date(eventoSeleccionado.fechaInicio).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Horario del Evento</p>
                <p className="font-semibold">{eventoSeleccionado.horaInicio} - {eventoSeleccionado.horaFin}</p>
              </div>
            </div>
          </div>

          {/* Montaje Information */}
          <div className="mb-8 bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Montaje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Responsable de Entrega</p>
                <p className="font-semibold text-lg">{montajeCompletado.responsableEntrega}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha y Hora de Salida</p>
                <p className="font-semibold text-lg">
                  {new Date(montajeCompletado.fechaSalida).toLocaleDateString('es-CL')} - {montajeCompletado.horaSalida}
                </p>
              </div>
              {eventoSeleccionado.choferNombre && (
                <div>
                  <p className="text-sm text-gray-600">Chofer Asignado</p>
                  <p className="font-semibold text-lg">{eventoSeleccionado.choferNombre}</p>
                </div>
              )}
              {eventoSeleccionado.vehiculoNombre && (
                <div>
                  <p className="text-sm text-gray-600">Vehículo Asignado</p>
                  <p className="font-semibold text-lg">{eventoSeleccionado.vehiculoNombre}</p>
                </div>
              )}
            </div>
            {montajeCompletado.observaciones && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Observaciones</p>
                <p className="font-semibold">{montajeCompletado.observaciones}</p>
              </div>
            )}
          </div>

          {/* Equipment List */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
              Equipamiento Solicitado
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Equipo</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Cantidad</th>
                  <th className="border border-gray-300 px-4 py-3 text-center w-20">✓</th>
                </tr>
              </thead>
              <tbody>
                {montajeCompletado.items.map((item, index) => (
                  <tr key={item.equipoId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{item.equipoNombre}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{item.cantidad}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-block w-5 h-5 border-2 border-gray-400 rounded"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-purple-100 font-semibold">
                  <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right">
                    TOTAL DE EQUIPOS:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {montajeCompletado.items.reduce((sum, item) => sum + item.cantidad, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes Section */}
          {eventoSeleccionado.notas && (
            <div className="mb-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Notas Importantes del Evento
              </h3>
              <p className="text-gray-800">{eventoSeleccionado.notas}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-sm text-gray-600 mb-8">Entregado por:</p>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">{montajeCompletado.responsableEntrega}</p>
                  <p className="text-sm text-gray-600">Firma y Fecha</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-8">Recibido por:</p>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">{eventoSeleccionado.contactoResponsable}</p>
                  <p className="text-sm text-gray-600">Firma y Fecha</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 border-t pt-4">
            <p>Documento generado el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString('es-CL')}</p>
            <p className="mt-1">ALLEGRA - Productora de Audio Profesional</p>
          </div>
        </div>
      </>
    );
  }

  if (showPreviewOnly && montajeCompletado && eventoSeleccionado) {
    return (
      <>
        {/* Screen only buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-3 print:hidden">
          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleClosePreviewOnly} variant="outline" size="lg">
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </div>

        {/* Printable Document */}
        <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center border-b-4 border-purple-600 pb-6 mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">ALLEGRA</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Orden de Salida - Montaje</h2>
            <p className="text-gray-600 mt-2">ID: {montajeCompletado.id}</p>
          </div>

          {/* Event Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
              Información del Evento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre del Evento</p>
                <p className="font-semibold text-lg">{eventoSeleccionado.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Evento</p>
                <p className="font-semibold">{eventoSeleccionado.tipoEvento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold">{eventoSeleccionado.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacto Responsable</p>
                <p className="font-semibold">{eventoSeleccionado.contactoResponsable}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-semibold">{eventoSeleccionado.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{eventoSeleccionado.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Dirección del Evento</p>
                <p className="font-semibold">{eventoSeleccionado.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha del Evento</p>
                <p className="font-semibold">
                  {new Date(eventoSeleccionado.fechaInicio).toLocaleDateString('es-CL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Horario del Evento</p>
                <p className="font-semibold">{eventoSeleccionado.horaInicio} - {eventoSeleccionado.horaFin}</p>
              </div>
            </div>
          </div>

          {/* Montaje Information */}
          <div className="mb-8 bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Montaje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Responsable de Entrega</p>
                <p className="font-semibold text-lg">{montajeCompletado.responsableEntrega}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha y Hora de Salida</p>
                <p className="font-semibold text-lg">
                  {new Date(montajeCompletado.fechaSalida).toLocaleDateString('es-CL')} - {montajeCompletado.horaSalida}
                </p>
              </div>
              {eventoSeleccionado.choferNombre && (
                <div>
                  <p className="text-sm text-gray-600">Chofer Asignado</p>
                  <p className="font-semibold text-lg">{eventoSeleccionado.choferNombre}</p>
                </div>
              )}
              {eventoSeleccionado.vehiculoNombre && (
                <div>
                  <p className="text-sm text-gray-600">Vehículo Asignado</p>
                  <p className="font-semibold text-lg">{eventoSeleccionado.vehiculoNombre}</p>
                </div>
              )}
            </div>
            {montajeCompletado.observaciones && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Observaciones</p>
                <p className="font-semibold">{montajeCompletado.observaciones}</p>
              </div>
            )}
          </div>

          {/* Equipment List */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
              Equipamiento Solicitado
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Equipo</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">Cantidad</th>
                  <th className="border border-gray-300 px-4 py-3 text-center w-20">✓</th>
                </tr>
              </thead>
              <tbody>
                {montajeCompletado.items.map((item, index) => (
                  <tr key={item.equipoId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{item.equipoNombre}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{item.cantidad}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className="inline-block w-5 h-5 border-2 border-gray-400 rounded"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-purple-100 font-semibold">
                  <td colSpan={3} className="border border-gray-300 px-4 py-3 text-right">
                    TOTAL DE EQUIPOS:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    {montajeCompletado.items.reduce((sum, item) => sum + item.cantidad, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes Section */}
          {eventoSeleccionado.notas && (
            <div className="mb-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Notas Importantes del Evento
              </h3>
              <p className="text-gray-800">{eventoSeleccionado.notas}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="text-sm text-gray-600 mb-8">Entregado por:</p>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">{montajeCompletado.responsableEntrega}</p>
                  <p className="text-sm text-gray-600">Firma y Fecha</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-8">Recibido por:</p>
                <div className="border-t-2 border-gray-400 pt-2">
                  <p className="font-semibold">{eventoSeleccionado.contactoResponsable}</p>
                  <p className="text-sm text-gray-600">Firma y Fecha</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500 border-t pt-4">
            <p>Documento generado el {new Date().toLocaleDateString('es-CL')} a las {new Date().toLocaleTimeString('es-CL')}</p>
            <p className="mt-1">ALLEGRA - Productora de Audio Profesional</p>
          </div>
        </div>
      </>
    );
  }

  if (!eventoSeleccionado) {
    const handleIniciarMontaje = (evento: Event) => {
      setEventoSeleccionado(evento);
    };

    const handleEditarMontaje = (montaje: Montaje) => {
      const evento = eventos.find(e => e.id === montaje.eventoId);
      if (evento) {
        setEventoSeleccionado(evento);
        setMontajeItems(montaje.items);
        setResponsable(montaje.responsableEntrega);
        setFechaSalida(montaje.fechaSalida);
        setHoraSalida(montaje.horaSalida);
        setObservaciones(montaje.observaciones || '');
        setMontajeIdEditing(montaje.id);
      }
    };

    const eventosConMontaje = eventos.filter(e => e.montajeRealizado);
    const eventosSinMontaje = eventos.filter(e => !e.montajeRealizado && new Date(e.fechaInicio) >= new Date());

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Módulo de Montaje</h1>
          <p className="text-gray-600 mt-1">Gestión de salida de equipos para eventos</p>
        </div>

        {/* Eventos Pendientes de Montaje */}
        {eventosSinMontaje.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Eventos Pendientes de Montaje ({eventosSinMontaje.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventosSinMontaje.map((evento) => (
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
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{evento.direccion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{evento.horaInicio} - {evento.horaFin}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleIniciarMontaje(evento)}>
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Iniciar Montaje
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Eventos con Montaje Realizado */}
        {eventosConMontaje.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-green-600" />
                Montajes Realizados ({eventosConMontaje.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventosConMontaje.map((evento) => {
                  const montaje = montajes.find(m => m.eventoId === evento.id);
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
                            {montaje && (
                              <>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-700">Responsable: {montaje.responsableEntrega}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <PackageCheck className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-700">{montaje.items.length} equipos</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => montaje && handleEditarMontaje(montaje)}
                          disabled={!montaje}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modificar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {eventosSinMontaje.length === 0 && eventosConMontaje.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <PackageCheck className="h-16 w-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">No hay eventos agendados</h3>
                  <p className="text-gray-500 mt-2">
                    Crea eventos desde la página de Eventos para gestionar montajes
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
      </div>
    );
  }

  const allConfirmed = montajeItems.length > 0 && montajeItems.every(item => item.confirmado);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Módulo de Montaje</h1>
          <p className="text-gray-600 mt-1">Salida de equipos para eventos</p>
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
            {eventoSeleccionado.notas && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 text-sm">Notas del Evento</div>
                    <p className="text-sm text-yellow-700 mt-1">{eventoSeleccionado.notas}</p>
                  </div>
                </div>
              </div>
            )}
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

      {/* Montaje Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Montaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Responsable de Entrega *</label>
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
              <label className="block text-sm font-medium mb-1">Fecha de Salida *</label>
              <input
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Salida *</label>
              <input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Notas adicionales sobre el montaje..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Equipment Checklist */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Listado de Equipos ({montajeItems.length})
            </CardTitle>
            <Button onClick={() => setShowAddEquipo(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Equipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {montajeItems.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No hay equipos en el checklist. Agrega equipos para continuar.
            </p>
          ) : (
            <div className="space-y-3">
              {montajeItems.map((item) => {
                const equipoInventory = inventory.find(inv => inv.id === item.equipoId);
                const stockDisponible = equipoInventory?.cantidad || 0;
                
                return (
                  <div
                    key={item.equipoId}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{item.equipoNombre}</div>
                        {equipoInventory && (
                          <div className="text-xs text-gray-500 mt-1">
                            {equipoInventory.marca} {equipoInventory.modelo}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div>
                          <label className="text-xs text-gray-600">
                            Cantidad 
                            <span className="ml-1 text-purple-600 font-semibold">
                              (Stock: {stockDisponible})
                            </span>
                          </label>
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              if (value > stockDisponible) {
                                alert(`Stock máximo disponible: ${stockDisponible} unidades`);
                                return;
                              }
                              handleUpdateCantidad(item.equipoId, value);
                            }}
                            className="w-20 border rounded px-2 py-1 text-center"
                            min="0"
                            max={stockDisponible}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveEquipo(item.equipoId)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {montajeItems.length > 0 && (
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEventoSeleccionado(null);
                  setMontajeItems([]);
                  navigate('/eventos');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleShowPreview}
                disabled={montajeItems.length === 0 || !responsable.trim()}
                variant="outline"
              >
                <Printer className="mr-2 h-4 w-4" />
                Vista Previa / Imprimir
              </Button>
              <Button
                onClick={() => {
                  console.log('🖱️ Botón clickeado');
                  console.log('Items en montaje:', montajeItems.length);
                  console.log('Responsable:', responsable);
                  console.log('¿Botón deshabilitado?', montajeItems.length === 0 || !responsable.trim());
                  handleCompletarMontaje();
                }}
                disabled={montajeItems.length === 0 || !responsable.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Completar Montaje
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Equipment Modal */}
      {showAddEquipo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold mb-4">Seleccionar Equipo</h2>
              
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border rounded-lg pl-10 pr-3 py-2.5"
                  placeholder="Buscar equipo por nombre..."
                />
              </div>
              
              {/* Category Filter */}
              {availableCategories.length > 0 && (
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Todas las categorías ({availableInventory.length} equipos)</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat} ({availableInventory.filter(i => i.categoria === cat).length})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {filteredAvailableInventory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {filterCategoria ? `No hay equipos disponibles en la categoría "${filterCategoria}"` : 'No hay equipos disponibles'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableInventory
                    .filter(equipo => equipo.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((equipo) => (
                    <button
                      key={equipo.id}
                      onClick={() => {
                        handleAddEquipo(equipo);
                        setFilterCategoria(''); // Reset filter after adding
                      }}
                      className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{equipo.nombre}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {equipo.marca} {equipo.modelo}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {equipo.categoria}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Cant: {equipo.cantidad}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end bg-white">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddEquipo(false);
                  setFilterCategoria(''); // Reset filter when closing
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}