import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, UserPlus, Phone, Mail, Briefcase, Calendar, Edit, MessageSquarePlus, User, AlertCircle, X, Star, Users, StickyNote, Trash2, Clock } from 'lucide-react';
import { Worker, WorkerAnotacion, RegistroSemanal, Event } from '../types/allegra';
import { workersAPI, eventsAPI } from '../lib/api';
import { toast } from 'sonner';
import { INITIAL_WORKERS, WORKERS_VERSION } from '../data/initialData';
import { RegistroSemanalHoras } from '../components/RegistroSemanalHoras';
import { formatRut } from '../lib/rutUtils';

export function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [eventos, setEventos] = useState<Event[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [anotacionDialogOpen, setAnotacionDialogOpen] = useState(false);
  const [registroHorasDialogOpen, setRegistroHorasDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rut, setRut] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('');
  const [especialidadesInput, setEspecialidadesInput] = useState('');
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [notas, setNotas] = useState('');

  // Anotación state
  const [nuevaAnotacion, setNuevaAnotacion] = useState('');
  const [tipoAnotacion, setTipoAnotacion] = useState<'Desempeño' | 'Capacitación' | 'Incidente' | 'General'>('General');

  useEffect(() => {
    loadWorkers();
    loadEvents();
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await workersAPI.getAll();
      const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || 'null');
      
      // Si localStorage está vacío pero INITIAL_WORKERS tiene datos, usar INITIAL_WORKERS
      const shouldUseInitial = (!localWorkers || localWorkers.length === 0) && INITIAL_WORKERS.length > 0;
      
      const loadedWorkers = data && data.length > 0
        ? data
        : shouldUseInitial
          ? INITIAL_WORKERS
          : (localWorkers || []);

      console.log('🔍 WorkersPage - Datos cargados:', {
        backend: data?.length || 0,
        localStorage: localWorkers?.length || 0,
        initial: INITIAL_WORKERS.length,
        final: loadedWorkers.length,
        shouldUseInitial
      });

      setWorkers(loadedWorkers);
      localStorage.setItem('allegra_workers', JSON.stringify(loadedWorkers));
    } catch (error) {
      console.log('Cargando trabajadores desde almacenamiento local');
      const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || 'null');
      const shouldUseInitial = (!localWorkers || localWorkers.length === 0) && INITIAL_WORKERS.length > 0;
      const loadedWorkers = shouldUseInitial ? INITIAL_WORKERS : (localWorkers || []);
      setWorkers(loadedWorkers);
      localStorage.setItem('allegra_workers', JSON.stringify(loadedWorkers));
    }
  };

  const loadEvents = async () => {
    try {
      const data = await eventsAPI.getAll();
      setEventos(data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      toast.error('Por favor completa los campos obligatorios (Nombre, Apellido, Teléfono)');
      return;
    }

    const workerData: Omit<Worker, 'id' | 'fechaIngreso' | 'historialEventos' | 'anotaciones'> = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rut: rut.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      cargo: cargo.trim(),
      habilidades: [],
      especialidades,
      disponibilidad: {
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: true,
        domingo: false,
      },
      estado: 'Activo',
      notas: notas.trim(),
      imagenUrl: undefined,
    };

    try {
      if (editingWorker) {
        await workersAPI.update(editingWorker.id, workerData);
        toast.success('Trabajador actualizado exitosamente');
      } else {
        await workersAPI.create(workerData);
        toast.success('Trabajador registrado exitosamente');
      }
      
      resetForm();
      setDialogOpen(false);
      loadWorkers();
    } catch (error) {
      toast.error('Error al guardar trabajador');
      console.error('Error:', error);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setNombre(worker.nombre);
    setApellido(worker.apellido);
    setRut(worker.rut);
    setTelefono(worker.telefono);
    setEmail(worker.email);
    setCargo(worker.cargo);
    setEspecialidades(worker.especialidades || []);
    setNotas(worker.notas || '');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este trabajador?')) {
      try {
        await workersAPI.delete(id);
        toast.success('Trabajador eliminado exitosamente');
        loadWorkers();
      } catch (error) {
        toast.error('Error al eliminar trabajador');
        console.error('Error:', error);
      }
    }
  };

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setRut('');
    setTelefono('');
    setEmail('');
    setCargo('');
    setEspecialidadesInput('');
    setEspecialidades([]);
    setNotas('');
    setEditingWorker(null);
  };

  const handleAddEspecialidad = () => {
    if (especialidadesInput.trim() && !especialidades.includes(especialidadesInput.trim())) {
      setEspecialidades([...especialidades, especialidadesInput.trim()]);
      setEspecialidadesInput('');
    }
  };

  const handleRemoveEspecialidad = (especialidad: string) => {
    setEspecialidades(especialidades.filter(e => e !== especialidad));
  };

  const handleAddAnotacion = async () => {
    if (!nuevaAnotacion.trim() || !selectedWorker) return;

    const anotacion: WorkerAnotacion = {
      id: `ANOT-${Date.now()}`,
      fecha: new Date().toISOString(),
      descripcion: nuevaAnotacion.trim(),
      tipo: tipoAnotacion,
      usuario: 'Administrador',
    };

    try {
      const updatedWorker = {
        ...selectedWorker,
        anotaciones: [...(selectedWorker.anotaciones || []), anotacion],
      };
      
      await workersAPI.update(selectedWorker.id, updatedWorker);
      toast.success('Anotación agregada exitosamente');
      setNuevaAnotacion('');
      setTipoAnotacion('General');
      loadWorkers();
      
      // Update selected worker
      const updated = await workersAPI.getAll();
      const worker = updated.find(w => w.id === selectedWorker.id);
      if (worker) setSelectedWorker(worker);
    } catch (error) {
      toast.error('Error al agregar anotación');
      console.error('Error:', error);
    }
  };

  const handleUpdateRegistroSemanal = async (registros: RegistroSemanal[]) => {
    if (!selectedWorker) return;

    try {
      const updatedWorker = {
        ...selectedWorker,
        registroSemanal: registros,
      };
      
      await workersAPI.update(selectedWorker.id, updatedWorker);
      toast.success('Registro semanal actualizado exitosamente');
      loadWorkers();
      
      // Update selected worker
      const updated = await workersAPI.getAll();
      const worker = updated.find(w => w.id === selectedWorker.id);
      if (worker) setSelectedWorker(worker);
    } catch (error) {
      toast.error('Error al actualizar registro semanal');
      console.error('Error:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-gray-100 text-gray-800';
      case 'Vacaciones': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoAnotacionColor = (tipo: string) => {
    switch (tipo) {
      case 'Desempeño': return 'bg-green-100 text-green-800';
      case 'Capacitación': return 'bg-blue-100 text-blue-800';
      case 'Incidente': return 'bg-red-100 text-red-800';
      case 'General': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Trabajadores</h1>
          <p className="text-gray-600 mt-1">Personal, contacto y especialidades</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2" />
              Registrar Trabajador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}</DialogTitle>
              <DialogDescription>
                Registra la información del trabajador y sus especialidades
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    value={rut}
                    onChange={(e) => setRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    maxLength={12}
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono / Contacto *</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trabajador@allegra.cl"
                  />
                </div>
                <div>
                  <Label htmlFor="cargo">Cargo / Rol</Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Técnico de Sonido"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="especialidades">Especialidades / Fuertes</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="especialidades"
                    value={especialidadesInput}
                    onChange={(e) => setEspecialidadesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEspecialidad())}
                    placeholder="Ej: Iluminación, Sonido, Montaje..."
                  />
                  <Button type="button" onClick={handleAddEspecialidad}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {especialidades.map((esp) => (
                    <Badge key={esp} variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      {esp}
                      <button
                        type="button"
                        onClick={() => handleRemoveEspecialidad(esp)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notas">Notas / Observaciones</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Información adicional sobre el trabajador..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
                {editingWorker ? 'Actualizar' : 'Registrar'} Trabajador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipo de Trabajo ({workers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No hay trabajadores registrados. Comienza registrando tu equipo de trabajo.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker) => (
                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {worker.nombre} {worker.apellido}
                          </h3>
                          {worker.cargo && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {worker.cargo}
                            </p>
                          )}
                        </div>
                        <Badge className={getEstadoColor(worker.estado)}>
                          {worker.estado}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          {worker.telefono}
                        </div>
                        {worker.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {worker.email}
                          </div>
                        )}
                        {worker.rut && (
                          <div className="text-gray-600">
                            RUT: {worker.rut}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(worker.fechaIngreso).toLocaleDateString('es-CL')}
                        </div>
                      </div>

                      {worker.especialidades && worker.especialidades.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Especialidades:</p>
                          <div className="flex flex-wrap gap-1">
                            {worker.especialidades.map((esp) => (
                              <Badge key={esp} variant="outline" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {worker.notas && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                          <p className="text-gray-700">{worker.notas}</p>
                        </div>
                      )}

                      {worker.anotaciones && worker.anotaciones.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <StickyNote className="h-3 w-3 inline mr-1" />
                          {worker.anotaciones.length} anotación(es)
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(worker)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setRegistroHorasDialogOpen(true);
                          }}
                          title="Registro de Horas"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWorker(worker);
                            setAnotacionDialogOpen(true);
                          }}
                          title="Anotaciones"
                        >
                          <StickyNote className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(worker.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anotaciones Dialog */}
      <Dialog open={anotacionDialogOpen} onOpenChange={setAnotacionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Anotaciones - {selectedWorker?.nombre} {selectedWorker?.apellido}
            </DialogTitle>
            <DialogDescription>
              Registro de desempeño, capacitaciones e incidentes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nueva anotación */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Nueva Anotación</h4>
              <div>
                <Label htmlFor="tipoAnotacion">Tipo</Label>
                <Select value={tipoAnotacion} onValueChange={(value: any) => setTipoAnotacion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Desempeño">Desempeño</SelectItem>
                    <SelectItem value="Capacitación">Capacitación</SelectItem>
                    <SelectItem value="Incidente">Incidente</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nuevaAnotacion">Descripción</Label>
                <Textarea
                  id="nuevaAnotacion"
                  value={nuevaAnotacion}
                  onChange={(e) => setNuevaAnotacion(e.target.value)}
                  placeholder="Escribe aquí la anotación..."
                  rows={3}
                />
              </div>
              <Button onClick={handleAddAnotacion} className="w-full bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Anotación
              </Button>
            </div>

            {/* Historial de anotaciones */}
            <div>
              <h4 className="font-semibold mb-3">Historial de Anotaciones</h4>
              {(!selectedWorker?.anotaciones || selectedWorker.anotaciones.length === 0) ? (
                <p className="text-gray-500 text-center py-8">No hay anotaciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {selectedWorker.anotaciones
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((anotacion) => (
                      <div key={anotacion.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start">
                          <Badge className={getTipoAnotacionColor(anotacion.tipo)}>
                            {anotacion.tipo}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {new Date(anotacion.fecha).toLocaleDateString('es-CL')} {new Date(anotacion.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm">{anotacion.descripcion}</p>
                        <p className="text-xs text-gray-600">Por: {anotacion.usuario}</p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registro Semanal de Horas Dialog */}
      <Dialog open={registroHorasDialogOpen} onOpenChange={setRegistroHorasDialogOpen}>
        <DialogContent className="w-[98vw] max-w-[1600px] h-[95vh] max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Registro Semanal de Horas - {selectedWorker?.nombre} {selectedWorker?.apellido}
              </DialogTitle>
              <DialogDescription>
                Gestiona las horas trabajadas por semana con descuento de colación
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="m-[0px] px-[24px] pt-[0px] pb-[24px]">
            {selectedWorker && (
              <RegistroSemanalHoras
                trabajador={selectedWorker}
                onUpdate={handleUpdateRegistroSemanal}
                eventos={eventos}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}