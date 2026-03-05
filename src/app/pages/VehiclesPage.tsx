import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Truck, Edit, Trash2, AlertCircle, CheckCircle, Clock, FileText, X, Calendar, RefreshCw } from 'lucide-react';
import { Vehicle, VehicleAnotacion, Event } from '../types/allegra';
import { vehiclesAPI, eventsAPI } from '../lib/api';
import { INITIAL_VEHICLES, VEHICLES_VERSION } from '../data/initialData';

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAnotacionesModal, setShowAnotacionesModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesData, eventsData] = await Promise.all([
        vehiclesAPI.getAll(),
        eventsAPI.getAll()
      ]);

      const loadedVehicles = vehiclesData && vehiclesData.length > 0
        ? vehiclesData
        : JSON.parse(localStorage.getItem('allegra_vehicles') || 'null') || INITIAL_VEHICLES;

      const loadedEvents = eventsData && eventsData.length > 0
        ? eventsData
        : JSON.parse(localStorage.getItem('allegra_events') || '[]');

      setVehicles(loadedVehicles);
      setEvents(loadedEvents);
      localStorage.setItem('allegra_vehicles', JSON.stringify(loadedVehicles));
    } catch (error) {
      console.log('Cargando vehículos desde almacenamiento local');
      const localVehicles = JSON.parse(localStorage.getItem('allegra_vehicles') || 'null') || INITIAL_VEHICLES;
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || '[]');
      
      setVehicles(localVehicles);
      setEvents(localEvents);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'mantenimientos' | 'historialUso' | 'anotaciones'>) => {
    const vehicle: Vehicle = editingVehicle
      ? {
          ...editingVehicle,
          ...vehicleData,
        }
      : {
          ...vehicleData,
          id: `VEH-${Date.now()}`,
          mantenimientos: [],
          historialUso: [],
          anotaciones: [],
        };

    const updatedVehicles = editingVehicle
      ? vehicles.map(v => v.id === editingVehicle.id ? vehicle : v)
      : [...vehicles, vehicle];

    setVehicles(updatedVehicles);
    localStorage.setItem('allegra_vehicles', JSON.stringify(updatedVehicles));

    try {
      await vehiclesAPI.save(updatedVehicles);
      console.log('✅ Vehículo guardado exitosamente');
    } catch (error) {
      console.log('💾 Vehículo guardado localmente');
    }

    setIsAddModalOpen(false);
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;

    const updatedVehicles = vehicles.filter(v => v.id !== id);
    setVehicles(updatedVehicles);
    localStorage.setItem('allegra_vehicles', JSON.stringify(updatedVehicles));

    try {
      await vehiclesAPI.save(updatedVehicles);
      console.log('✅ Vehículo eliminado exitosamente');
    } catch (error) {
      console.log('💾 Vehículo eliminado localmente');
    }
  };

  const handleAddAnotacion = async (vehicleId: string, descripcion: string, tipo: VehicleAnotacion['tipo']) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !descripcion.trim()) return;

    const nuevaAnotacion: VehicleAnotacion = {
      id: `ANT-${Date.now()}`,
      fecha: new Date().toISOString(),
      descripcion: descripcion.trim(),
      tipo,
      usuario: 'Administrador'
    };

    const updatedVehicle = {
      ...vehicle,
      anotaciones: [...(vehicle.anotaciones || []), nuevaAnotacion]
    };

    const updatedVehicles = vehicles.map(v => v.id === vehicleId ? updatedVehicle : v);
    setVehicles(updatedVehicles);
    localStorage.setItem('allegra_vehicles', JSON.stringify(updatedVehicles));

    try {
      await vehiclesAPI.save(updatedVehicles);
      console.log('✅ Anotación guardada exitosamente');
    } catch (error) {
      console.log('💾 Anotación guardada localmente');
    }

    setSelectedVehicle(updatedVehicle);
  };

  const handleDeleteAnotacion = async (vehicleId: string, anotacionId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const updatedVehicle = {
      ...vehicle,
      anotaciones: (vehicle.anotaciones || []).filter(a => a.id !== anotacionId)
    };

    const updatedVehicles = vehicles.map(v => v.id === vehicleId ? updatedVehicle : v);
    setVehicles(updatedVehicles);
    localStorage.setItem('allegra_vehicles', JSON.stringify(updatedVehicles));

    try {
      await vehiclesAPI.save(updatedVehicles);
      console.log('✅ Anotación eliminada exitosamente');
    } catch (error) {
      console.log('💾 Anotación eliminada localmente');
    }

    setSelectedVehicle(updatedVehicle);
  };

  // Get vehicle usage from events
  const getVehicleUsage = (vehicleId: string) => {
    return events.filter(e => 
      e.vehiculoId === vehicleId && 
      e.estado === 'Próximamente' &&
      new Date(e.fechaInicio) >= new Date()
    );
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      case 'En Uso':
        return 'bg-blue-100 text-blue-800';
      case 'En Mantenimiento':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: { [key: string]: string } = {
      'Camión': 'bg-purple-100 text-purple-800',
      'Van': 'bg-indigo-100 text-indigo-800',
      'Camioneta': 'bg-blue-100 text-blue-800',
      'Auto': 'bg-cyan-100 text-cyan-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando vehículos...</div>
      </div>
    );
  }

  const disponibles = vehicles.filter(v => v.estado === 'Disponible');
  const enUso = vehicles.filter(v => v.estado === 'En Uso');
  const enMantenimiento = vehicles.filter(v => v.estado === 'En Mantenimiento');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
          <p className="text-gray-600 mt-1">Control de flota y mantenimientos</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => {
              localStorage.removeItem('allegra_vehicles_version');
              loadData();
            }}
            title="Forzar actualización de vehículos"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Actualizar
          </Button>
          <Button size="lg" onClick={() => { setEditingVehicle(null); setIsAddModalOpen(true); }}>
            <Plus className="mr-2" />
            Registrar Vehículo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{vehicles.length}</div>
            <div className="text-sm text-gray-600">Total Vehículos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{disponibles.length}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{enUso.length}</div>
            <div className="text-sm text-gray-600">En Uso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{enMantenimiento.length}</div>
            <div className="text-sm text-gray-600">En Mantenimiento</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Flota de Vehículos ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No hay vehículos registrados. Agrega tu primer vehículo.
            </p>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => {
                const eventosAsignados = getVehicleUsage(vehicle.id);
                return (
                  <Card key={vehicle.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold">{vehicle.marca} {vehicle.modelo}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${getTipoColor(vehicle.tipo)}`}>
                                  {vehicle.tipo}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(vehicle.estado)}`}>
                                  {vehicle.estado}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {vehicle.año}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {vehicle.patente && (
                              <div>
                                <span className="text-gray-600">Patente:</span>
                                <span className="font-semibold ml-2">{vehicle.patente}</span>
                              </div>
                            )}
                            {vehicle.capacidadCarga > 0 && (
                              <div>
                                <span className="text-gray-600">Capacidad:</span>
                                <span className="font-semibold ml-2">{vehicle.capacidadCarga} kg</span>
                              </div>
                            )}
                            {vehicle.conductorAsignado && (
                              <div>
                                <span className="text-gray-600">Conductor:</span>
                                <span className="font-semibold ml-2">{vehicle.conductorAsignado}</span>
                              </div>
                            )}
                          </div>

                          {/* Eventos Asignados */}
                          {eventosAsignados.length > 0 && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-800 text-sm">
                                  Próximos Eventos Asignados ({eventosAsignados.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {eventosAsignados.slice(0, 2).map(evento => (
                                  <div key={evento.id} className="text-xs text-blue-700">
                                    • {evento.nombre} - {new Date(evento.fechaInicio).toLocaleDateString('es-CL')}
                                  </div>
                                ))}
                                {eventosAsignados.length > 2 && (
                                  <div className="text-xs text-blue-600 font-medium">
                                    + {eventosAsignados.length - 2} evento(s) más
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Anotaciones Recientes */}
                          {vehicle.anotaciones && vehicle.anotaciones.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-700 text-sm">
                                  Últimas Anotaciones
                                </span>
                              </div>
                              <div className="space-y-1">
                                {vehicle.anotaciones.slice(-2).reverse().map(anotacion => (
                                  <div key={anotacion.id} className="text-xs bg-gray-50 p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        anotacion.tipo === 'Mantenimiento' ? 'bg-orange-100 text-orange-800' :
                                        anotacion.tipo === 'Incidente' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {anotacion.tipo}
                                      </span>
                                      <span className="text-gray-600">
                                        {new Date(anotacion.fecha).toLocaleDateString('es-CL')}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 mt-1">{anotacion.descripcion}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {vehicle.notas && (
                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-yellow-800">{vehicle.notas}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowAnotacionesModal(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Anotaciones
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingVehicle(vehicle);
                              setIsAddModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Vehicle Modal */}
      {isAddModalOpen && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => { setIsAddModalOpen(false); setEditingVehicle(null); }}
          onSave={handleSaveVehicle}
        />
      )}

      {/* Anotaciones Modal */}
      {showAnotacionesModal && selectedVehicle && (
        <AnotacionesModal
          vehicle={selectedVehicle}
          onClose={() => { setShowAnotacionesModal(false); setSelectedVehicle(null); }}
          onAddAnotacion={handleAddAnotacion}
          onDeleteAnotacion={handleDeleteAnotacion}
        />
      )}
    </div>
  );
}

// Vehicle Form Modal Component
function VehicleFormModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id' | 'mantenimientos' | 'historialUso' | 'anotaciones'>) => void;
}) {
  const [formData, setFormData] = useState({
    tipo: vehicle?.tipo || 'Camión' as Vehicle['tipo'],
    patente: vehicle?.patente || '',
    marca: vehicle?.marca || '',
    modelo: vehicle?.modelo || '',
    año: vehicle?.año || new Date().getFullYear(),
    capacidadCarga: vehicle?.capacidadCarga || 0,
    notas: vehicle?.notas || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nombre: `${formData.marca} ${formData.modelo}`,
      tipo: formData.tipo,
      patente: formData.patente,
      marca: formData.marca,
      modelo: formData.modelo,
      año: formData.año,
      capacidadCarga: formData.capacidadCarga,
      estado: vehicle?.estado || 'Disponible',
      conductorAsignado: vehicle?.conductorAsignado,
      proximoMantenimiento: vehicle?.proximoMantenimiento,
      notas: formData.notas,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'año' || name === 'capacidadCarga' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {vehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Camión">Camión</option>
                  <option value="Van">Van</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Auto">Auto</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Patente</label>
                <input
                  type="text"
                  name="patente"
                  value={formData.patente}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="AA-BB-11 (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Marca *</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ej: Mercedes-Benz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ej: Sprinter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Año *</label>
                <input
                  type="number"
                  name="año"
                  value={formData.año}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Capacidad de Carga (kg)
                </label>
                <input
                  type="number"
                  name="capacidadCarga"
                  value={formData.capacidadCarga || ''}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                  placeholder="ej: 1500 (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">Notas</h3>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Información adicional sobre el vehículo..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {vehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Anotaciones Modal Component
function AnotacionesModal({
  vehicle,
  onClose,
  onAddAnotacion,
  onDeleteAnotacion,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onAddAnotacion: (vehicleId: string, descripcion: string, tipo: VehicleAnotacion['tipo']) => void;
  onDeleteAnotacion: (vehicleId: string, anotacionId: string) => void;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<VehicleAnotacion['tipo']>('General');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcion.trim()) {
      onAddAnotacion(vehicle.id, descripcion, tipo);
      setDescripcion('');
      setTipo('General');
    }
  };

  const getTipoColor = (tipo: VehicleAnotacion['tipo']) => {
    switch (tipo) {
      case 'Mantenimiento':
        return 'bg-orange-100 text-orange-800';
      case 'Incidente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-white z-10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Anotaciones</h2>
            <p className="text-sm text-gray-600 mt-1">
              {vehicle.nombre} - {vehicle.patente}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Add Anotacion Form */}
          <form onSubmit={handleSubmit} className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold mb-3">Nueva Anotación</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as VehicleAnotacion['tipo'])}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="General">General</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Incidente">Incidente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Describe la anotación..."
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Anotación
              </Button>
            </div>
          </form>

          {/* Anotaciones List */}
          <div>
            <h3 className="font-semibold mb-3">
              Historial de Anotaciones ({vehicle.anotaciones?.length || 0})
            </h3>
            {!vehicle.anotaciones || vehicle.anotaciones.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay anotaciones registradas para este vehículo
              </p>
            ) : (
              <div className="space-y-3">
                {vehicle.anotaciones.slice().reverse().map((anotacion) => (
                  <div key={anotacion.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getTipoColor(anotacion.tipo)}`}>
                            {anotacion.tipo}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(anotacion.fecha).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-800">{anotacion.descripcion}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Por: {anotacion.usuario}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta anotación?')) {
                            onDeleteAnotacion(vehicle.id, anotacion.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-white">
          <Button onClick={onClose} variant="outline" className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}