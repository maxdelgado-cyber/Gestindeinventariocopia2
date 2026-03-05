import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Calendar, MapPin, User, Phone, PackageCheck, PackageX, ChevronRight, AlertCircle, X, Truck, FileText, Star, DollarSign } from 'lucide-react';
import { Event, Worker, Vehicle, Client } from '../types/allegra';
import { eventsAPI, workersAPI, vehiclesAPI, clientsAPI } from '../lib/api';
import { INITIAL_EVENTS, EVENTS_VERSION, INITIAL_WORKERS, WORKERS_VERSION, INITIAL_VEHICLES, VEHICLES_VERSION } from '../data/initialData';
import { INITIAL_CLIENTS, CLIENTS_VERSION } from '../data/clientsData';
import { useNavigate } from 'react-router';

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
    
    // Recargar eventos cuando la ventana vuelve a estar visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Página visible - Recargando eventos...');
        loadEvents();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // SIEMPRE cargar de localStorage primero
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || 'null');
      
      // Intentar cargar del backend
      let backendEvents = null;
      try {
        backendEvents = await eventsAPI.getAll();
      } catch (error) {
        console.log('Backend no disponible, usando datos locales');
      }
      
      // Decidir qué datos usar:
      // 1. Si hay datos en backend, usarlos
      // 2. Si no hay backend pero hay localStorage, usar localStorage
      // 3. Si no hay ninguno pero hay INITIAL_EVENTS, usar INITIAL_EVENTS
      const loadedEvents = 
        (backendEvents && backendEvents.length > 0) ? backendEvents :
        (localEvents && localEvents.length > 0) ? localEvents :
        (INITIAL_EVENTS.length > 0) ? INITIAL_EVENTS :
        [];
      
      console.log('🔍 EventsPage - Datos cargados:', {
        backend: backendEvents?.length || 0,
        localStorage: localEvents?.length || 0,
        initial: INITIAL_EVENTS.length,
        final: loadedEvents.length,
        source: (backendEvents && backendEvents.length > 0) ? 'backend' : 
                (localEvents && localEvents.length > 0) ? 'localStorage' : 
                'initial'
      });
      
      setEvents(loadedEvents);
      
      // Guardar en localStorage si hay datos
      if (loadedEvents.length > 0) {
        localStorage.setItem('allegra_events', JSON.stringify(loadedEvents));
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceReloadInitialData = () => {
    console.log('🔄 Forzando recarga de datos iniciales...');
    setEvents(INITIAL_EVENTS);
    localStorage.setItem('allegra_events', JSON.stringify(INITIAL_EVENTS));
    console.log('✅ Datos iniciales cargados:', INITIAL_EVENTS);
  };

  const handleAddEvent = async (newEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const evento: Event = {
      ...newEvent,
      id: `EVT-${Date.now()}`,
      estado: 'Agendado', // Nuevo evento siempre comienza como Agendado
      montajeRealizado: false,
      desmontaljeRealizado: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedEvents = [...events, evento];
    setEvents(updatedEvents);
    localStorage.setItem('allegra_events', JSON.stringify(updatedEvents));

    try {
      await eventsAPI.save(updatedEvents);
      console.log('✅ Evento guardado exitosamente');
    } catch (error) {
      console.log('💾 Evento guardado localmente');
    }

    setIsAddModalOpen(false);
  };

  const handleIniciarMontaje = (evento: Event) => {
    // Save selected event to localStorage
    localStorage.setItem('montaje_evento_selected', JSON.stringify(evento));
    navigate('/montaje');
  };

  const handleIniciarDesmontaje = (evento: Event) => {
    // Save selected event to localStorage
    localStorage.setItem('desmontaje_evento_selected', JSON.stringify(evento));
    navigate('/desmontaje');
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Agendado':
      case 'Próximamente':
        return 'bg-blue-100 text-blue-800';
      case 'En Montaje':
        return 'bg-orange-100 text-orange-800';
      case 'Montado':
        return 'bg-purple-100 text-purple-800';
      case 'En Desmontaje':
        return 'bg-indigo-100 text-indigo-800';
      case 'Cerrado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tipoEventoColors: Record<string, string> = {
    'Corporativo': 'bg-purple-100 text-purple-800',
    'Concierto': 'bg-pink-100 text-pink-800',
    'Boda': 'bg-rose-100 text-rose-800',
    'Fiesta en Domicilio': 'bg-indigo-100 text-indigo-800',
    'Festival': 'bg-orange-100 text-orange-800',
    'Teatro': 'bg-teal-100 text-teal-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando eventos...</div>
      </div>
    );
  }

  // Group events by status
  const eventosAgendados = events.filter(e => e.estado === 'Agendado');
  const eventosEnMontaje = events.filter(e => e.estado === 'En Montaje');
  const eventosMontados = events.filter(e => e.estado === 'Montado');
  const eventosEnDesmontaje = events.filter(e => e.estado === 'En Desmontaje');
  const eventosCerrados = events.filter(e => e.estado === 'Cerrado');
  
  // Compatibilidad con eventos antiguos que usan "Próximamente"
  const eventosProximos = events.filter(e => e.estado === 'Próximamente' || e.estado === 'Agendado');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Eventos</h1>
          <p className="text-gray-600 mt-1">Planificación y agenda de eventos</p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" variant="outline" onClick={forceReloadInitialData}>
            🔄 Recargar Datos Demo
          </Button>
          <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{eventosProximos.length}</div>
            <div className="text-sm text-gray-600">Eventos Próximos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {eventosProximos.filter(e => !e.montajeRealizado).length}
            </div>
            <div className="text-sm text-gray-600">Pendientes de Montaje</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {eventosProximos.filter(e => e.montajeRealizado && !e.desmontaljeRealizado).length}
            </div>
            <div className="text-sm text-gray-600">Pendientes de Desmontaje</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos Próximos ({eventosProximos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosProximos.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No hay eventos próximos programados
            </p>
          ) : (
            <div className="space-y-4">
              {eventosProximos.map((evento) => (
                <Card key={evento.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold">{evento.nombre}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${tipoEventoColors[evento.tipoEvento]}`}>
                                {evento.tipoEvento}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(evento.estado)}`}>
                                {evento.estado}
                              </span>
                              {/* Estado de Pago Badge */}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                                evento.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' :
                                evento.estadoPago === 'Abonado' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                <DollarSign className="h-3 w-3" />
                                {evento.estadoPago || 'Pendiente de pago'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(evento.fechaInicio).toLocaleDateString('es-CL')}
                              {evento.horaInicio && ` - ${evento.horaInicio}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{evento.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{evento.direccion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{evento.telefono}</span>
                          </div>
                        </div>

                        {/* Montaje/Desmontaje Status */}
                        <div className="flex gap-4 pt-2">
                          <div className="flex items-center gap-2">
                            <PackageCheck className={`h-4 w-4 ${evento.montajeRealizado ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-sm ${evento.montajeRealizado ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              Montaje {evento.montajeRealizado ? 'Completado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PackageX className={`h-4 w-4 ${evento.desmontaljeRealizado ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-sm ${evento.desmontaljeRealizado ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              Desmontaje {evento.desmontaljeRealizado ? 'Completado' : 'Pendiente'}
                            </span>
                          </div>
                        </div>

                        {/* Estado de Pago Detalle - REMOVIDO: no mostrar montos */}

                        {evento.notas && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">{evento.notas}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between gap-2 min-w-[180px]">
                        <div className="space-y-2">
                          {!evento.montajeRealizado && (
                            <Button 
                              className="w-full"
                              onClick={() => handleIniciarMontaje(evento)}
                            >
                              <PackageCheck className="mr-2 h-4 w-4" />
                              Iniciar Montaje
                            </Button>
                          )}
                          
                          {evento.montajeRealizado && !evento.desmontaljeRealizado && (
                            <Button 
                              className="w-full"
                              variant="outline"
                              onClick={() => handleIniciarDesmontaje(evento)}
                            >
                              <PackageX className="mr-2 h-4 w-4" />
                              Iniciar Desmontaje
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Events */}
      {eventosCerrados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos Cerrados ({eventosCerrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventosCerrados.map((evento) => (
                <Card key={evento.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold">{evento.nombre}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${tipoEventoColors[evento.tipoEvento]}`}>
                                {evento.tipoEvento}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(evento.estado)}`}>
                                {evento.estado}
                              </span>
                              {/* Estado de Pago Badge */}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                                evento.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' :
                                evento.estadoPago === 'Abonado' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                <DollarSign className="h-3 w-3" />
                                {evento.estadoPago || 'Pendiente de pago'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(evento.fechaInicio).toLocaleDateString('es-CL')}
                              {evento.horaInicio && ` - ${evento.horaInicio}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{evento.cliente}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="truncate">{evento.direccion}</span>
                          </div>
                          {evento.telefono && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{evento.telefono}</span>
                            </div>
                          )}
                        </div>

                        {/* Estado de Pago Detalle */}
                        {evento.valorTotal && evento.valorTotal > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-900">
                                  Valor: ${evento.valorTotal.toLocaleString('es-CL')}
                                </span>
                              </div>
                              <span className="text-xs text-green-700">
                                Pagado: ${(evento.montoPagado || 0).toLocaleString('es-CL')}
                              </span>
                            </div>
                            {/* Mini barra de progreso */}
                            <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  evento.estadoPago === 'Pagado' ? 'bg-green-600' :
                                  evento.estadoPago === 'Abonado' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${((evento.montoPagado || 0) / evento.valorTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Evaluación si existe */}
                        {evento.evaluacion && evento.evaluacion.calificacionGeneral > 0 && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-purple-900">
                              Calificación: {evento.evaluacion.calificacionGeneral}/5
                            </span>
                            {evento.evaluacion.comentariosCliente && (
                              <span className="text-xs text-purple-600 ml-2 truncate">
                                "{evento.evaluacion.comentariosCliente}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-start gap-2 min-w-[140px]">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/eventos/${evento.id}`)}
                          className="w-full"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Ficha
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <AddEventModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEvent}
        />
      )}
    </div>
  );
}

// Add Event Modal Component
function AddEventModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    cliente: '',
    contactoResponsable: '',
    telefono: '',
    email: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    direccion: '',
    tipoEvento: 'Corporativo' as Event['tipoEvento'],
    estado: 'Próximamente' as Event['estado'],
    equipamientoAsignado: [] as string[],
    vehiculosAsignados: [] as string[],
    trabajadoresAsignados: [] as string[],
    choferId: '',
    choferNombre: '',
    vehiculoId: '',
    vehiculoNombre: '',
    valorTotal: 0,
    estadoPago: 'Pendiente de pago' as Event['estadoPago'],
    montoPagado: 0,
    notas: '',
    montajeRealizado: false,
    desmontaljeRealizado: false,
    evaluacion: {
      calificacionGeneral: 0,
      aspectosPositivos: '',
      aspectosAMejorar: '',
      comentariosCliente: '',
      desempenoEquipo: 0,
      estadoEquipamiento: 0,
      recomendaciones: '',
      fechaEvaluacion: ''
    }
  });

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [usarClienteRegistrado, setUsarClienteRegistrado] = useState(false);

  useEffect(() => {
    // Load workers
    const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || 'null');
    const loadedWorkers = (localWorkers && localWorkers.length > 0) ? localWorkers : INITIAL_WORKERS;
    setWorkers(loadedWorkers);

    // Load vehicles
    const localVehicles = JSON.parse(localStorage.getItem('allegra_vehicles') || 'null');
    const loadedVehicles = (localVehicles && localVehicles.length > 0) ? localVehicles : INITIAL_VEHICLES;
    setVehicles(loadedVehicles);

    // Load clients
    const localClients = JSON.parse(localStorage.getItem('allegra_clients') || 'null');
    const loadedClients = (localClients && localClients.length > 0) ? localClients : INITIAL_CLIENTS;
    setClients(loadedClients);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Agendar Nuevo Evento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica del Evento */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Información del Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ej: Concierto Sinfónico Primavera"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de Evento *
                </label>
                <select
                  name="tipoEvento"
                  value={formData.tipoEvento}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Corporativo">Corporativo</option>
                  <option value="Concierto">Concierto</option>
                  <option value="Boda">Boda</option>
                  <option value="Fiesta en Domicilio">Fiesta en Domicilio</option>
                  <option value="Festival">Festival</option>
                  <option value="Teatro">Teatro</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Información del Contacto
            </h3>

            {/* Toggle */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
              <button
                type="button"
                onClick={() => {
                  setUsarClienteRegistrado(false);
                  setFormData(prev => ({ ...prev, cliente: '', contactoResponsable: '', telefono: '', email: '' }));
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  !usarClienteRegistrado
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white text-gray-600 border hover:bg-gray-100'
                }`}
              >
                Persona / Contacto nuevo
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsarClienteRegistrado(true);
                  setFormData(prev => ({ ...prev, cliente: '', contactoResponsable: '', telefono: '', email: '' }));
                }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  usarClienteRegistrado
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white text-gray-600 border hover:bg-gray-100'
                }`}
              >
                Cliente registrado
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usarClienteRegistrado ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Seleccionar Cliente *
                  </label>
                  <select
                    name="cliente"
                    value={formData.cliente}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.nombre === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        cliente: e.target.value,
                        contactoResponsable: selectedClient ? selectedClient.contactoResponsable : '',
                        telefono: selectedClient ? selectedClient.telefono : '',
                        email: selectedClient ? selectedClient.email : '',
                      }));
                    }}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(client => (
                      <option key={client.nombre} value={client.nombre}>
                        {client.nombre}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No hay clientes registrados</p>
                  )}
                  {/* Datos autocompletados del cliente */}
                  {formData.cliente && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                      {formData.contactoResponsable && (
                        <div>
                          <span className="text-gray-500">Contacto:</span>
                          <span className="font-medium ml-1">{formData.contactoResponsable}</span>
                        </div>
                      )}
                      {formData.telefono && (
                        <div>
                          <span className="text-gray-500">Teléfono:</span>
                          <span className="font-medium ml-1">{formData.telefono}</span>
                        </div>
                      )}
                      {formData.email && (
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium ml-1">{formData.email}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Nombre del contacto / persona *
                    </label>
                    <input
                      type="text"
                      name="cliente"
                      value={formData.cliente}
                      onChange={handleChange}
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="ej: Juan Pérez o Empresa XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contacto Responsable
                    </label>
                    <input
                      type="text"
                      name="contactoResponsable"
                      value={formData.contactoResponsable}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Nombre del responsable"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      required
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="contacto@email.com"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Fecha y Hora */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Fecha y Hora del Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Ubicación
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                Dirección del Evento *
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Calle, número, comuna, ciudad"
              />
            </div>
          </div>

          {/* Logística - Chofer y Vehículo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Logística - Transporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Chofer Asignado
                </label>
                <select
                  name="choferId"
                  value={formData.choferId}
                  onChange={(e) => {
                    const selectedWorker = workers.find(w => w.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      choferId: e.target.value,
                      choferNombre: selectedWorker ? `${selectedWorker.nombre} ${selectedWorker.apellido}` : ''
                    }));
                  }}
                  className="w-full border rounded-lg px-3 py-2">
                  <option value="">Seleccionar chofer...</option>
                  {workers.filter(w => w.estado === 'Activo').map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.nombre} {worker.apellido} - {worker.cargo}
                    </option>
                  ))}
                </select>
                {workers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay trabajadores registrados
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Vehículo Asignado
                </label>
                <select
                  name="vehiculoId"
                  value={formData.vehiculoId}
                  onChange={(e) => {
                    const selectedVehicle = vehicles.find(v => v.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      vehiculoId: e.target.value,
                      vehiculoNombre: selectedVehicle ? `${selectedVehicle.nombre} (${selectedVehicle.patente})` : ''
                    }));
                  }}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar vehículo...</option>
                  {vehicles.filter(v => v.estado === 'Disponible').map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nombre} - {vehicle.patente} ({vehicle.tipo})
                    </option>
                  ))}
                </select>
                {vehicles.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No hay vehículos registrados
                  </p>
                )}
              </div>
            </div>
            {(formData.choferId || formData.vehiculoId) && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>Asignación de Transporte:</strong>
                  {formData.choferNombre && <div className="mt-1">• Chofer: {formData.choferNombre}</div>}
                  {formData.vehiculoNombre && <div className="mt-1">• Vehículo: {formData.vehiculoNombre}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Estado de Pago */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estado de Pago
            </h3>
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-1">
                Estado de Pago *
              </label>
              <select
                name="estadoPago"
                value={formData.estadoPago}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Pendiente de pago">Pendiente de pago</option>
                <option value="Abonado">Abonado</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Notas e Indicaciones
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1">
                Notas Adicionales
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Requerimientos especiales, indicaciones importantes, etc."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Agendar Evento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}