import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Building2, User, Phone, Mail, MapPin, Edit, Trash2, X, Search } from 'lucide-react';
import { Client } from '../types/allegra';
import { clientsAPI } from '../lib/api';
import { INITIAL_CLIENTS, CLIENTS_VERSION } from '../data/clientsData';
import { formatRut } from '../lib/rutUtils';

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Empresa' | 'Persona'>('Todos');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientsAPI.getAll();
      const localClients = JSON.parse(localStorage.getItem('allegra_clients') || 'null');
      
      // Si localStorage está vacío pero INITIAL_CLIENTS tiene datos, usar INITIAL_CLIENTS
      const shouldUseInitial = (!localClients || localClients.length === 0) && INITIAL_CLIENTS.length > 0;
      
      const loadedClients = data && data.length > 0
        ? data
        : shouldUseInitial
          ? INITIAL_CLIENTS
          : (localClients || []);
      
      console.log('🔍 ClientsPage - Datos cargados:', {
        backend: data?.length || 0,
        localStorage: localClients?.length || 0,
        initial: INITIAL_CLIENTS.length,
        final: loadedClients.length,
        shouldUseInitial
      });
      
      setClients(loadedClients);
      localStorage.setItem('allegra_clients', JSON.stringify(loadedClients));
    } catch (error) {
      console.log('Cargando clientes desde almacenamiento local');
      const localClients = JSON.parse(localStorage.getItem('allegra_clients') || 'null');
      const shouldUseInitial = (!localClients || localClients.length === 0) && INITIAL_CLIENTS.length > 0;
      const loadedClients = shouldUseInitial ? INITIAL_CLIENTS : (localClients || []);
      setClients(loadedClients);
      localStorage.setItem('allegra_clients', JSON.stringify(loadedClients));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (newClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const client: Client = {
      ...newClient,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedClients = [...clients, client];
    setClients(updatedClients);
    localStorage.setItem('allegra_clients', JSON.stringify(updatedClients));

    try {
      await clientsAPI.save(updatedClients);
      console.log('✅ Cliente guardado exitosamente');
    } catch (error) {
      console.log('💾 Cliente guardado localmente');
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    const updatedClients = clients.filter(c => c.id !== id);
    setClients(updatedClients);
    localStorage.setItem('allegra_clients', JSON.stringify(updatedClients));

    try {
      await clientsAPI.save(updatedClients);
      console.log('✅ Cliente eliminado exitosamente');
    } catch (error) {
      console.log('💾 Cliente eliminado localmente');
    }
  };

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactoResponsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipo === 'Todos' || client.tipoCliente === filterTipo;
    
    return matchesSearch && matchesTipo;
  });

  const activeClients = filteredClients.filter(c => c.estado === 'Activo');
  const empresas = activeClients.filter(c => c.tipoCliente === 'Empresa');
  const personas = activeClients.filter(c => c.tipoCliente === 'Persona');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
          <p className="text-gray-600 mt-1">Administra tu cartera de clientes</p>
        </div>
        <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{activeClients.length}</div>
            <div className="text-sm text-gray-600">Clientes Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{empresas.length}</div>
            <div className="text-sm text-gray-600">Empresas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">{personas.length}</div>
            <div className="text-sm text-gray-600">Personas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, contacto o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterTipo === 'Todos' ? 'default' : 'outline'}
                onClick={() => setFilterTipo('Todos')}
              >
                Todos
              </Button>
              <Button
                variant={filterTipo === 'Empresa' ? 'default' : 'outline'}
                onClick={() => setFilterTipo('Empresa')}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Empresas
              </Button>
              <Button
                variant={filterTipo === 'Persona' ? 'default' : 'outline'}
                onClick={() => setFilterTipo('Persona')}
              >
                <User className="h-4 w-4 mr-1" />
                Personas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${client.tipoCliente === 'Empresa' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {client.tipoCliente === 'Empresa' ? (
                      <Building2 className="h-5 w-5 text-purple-600" />
                    ) : (
                      <User className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{client.nombre}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      client.tipoCliente === 'Empresa' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {client.tipoCliente}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClient(client.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{client.contactoResponsable}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{client.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.direccion && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{client.direccion}</span>
                  </div>
                )}
              </div>

              {client.giro && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs text-gray-500">Giro: {client.giro}</span>
                </div>
              )}

              {client.notas && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 italic">{client.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No se encontraron clientes</p>
          </CardContent>
        </Card>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <AddClientModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddClient}
        />
      )}
    </div>
  );
}

// Add Client Modal Component
function AddClientModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoCliente: 'Empresa' as Client['tipoCliente'],
    rut: '',
    contactoResponsable: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    region: '',
    giro: '',
    eventosRealizados: 0,
    valorTotalEventos: 0,
    notas: '',
    estado: 'Activo' as Client['estado'],
  });

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
      [name]: name === 'rut' ? formatRut(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo de Cliente *
            </label>
            <select
              name="tipoCliente"
              value={formData.tipoCliente}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="Empresa">Empresa</option>
              <option value="Persona">Persona</option>
            </select>
          </div>

          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                {formData.tipoCliente === 'Empresa' ? 'Nombre de la Empresa' : 'Nombre Completo'} *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder={formData.tipoCliente === 'Empresa' ? 'ej: Productora XYZ Ltda.' : 'ej: Juan Pérez'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="12.345.678-9"
                maxLength={12}
              />
            </div>

            {formData.tipoCliente === 'Empresa' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giro
                </label>
                <input
                  type="text"
                  name="giro"
                  value={formData.giro}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ej: Producción de Eventos"
                />
              </div>
            )}
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Contacto Responsable *
                </label>
                <input
                  type="text"
                  name="contactoResponsable"
                  value={formData.contactoResponsable}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nombre del contacto principal"
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
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="contacto@email.com"
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-600">
              Dirección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Calle, número"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Santiago"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Región
                </label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar región...</option>
                  <option value="Arica y Parinacota">Arica y Parinacota</option>
                  <option value="Tarapacá">Tarapacá</option>
                  <option value="Antofagasta">Antofagasta</option>
                  <option value="Atacama">Atacama</option>
                  <option value="Coquimbo">Coquimbo</option>
                  <option value="Valparaíso">Valparaíso</option>
                  <option value="Metropolitana">Metropolitana</option>
                  <option value="O'Higgins">O'Higgins</option>
                  <option value="Maule">Maule</option>
                  <option value="Ñuble">Ñuble</option>
                  <option value="Biobío">Biobío</option>
                  <option value="La Araucanía">La Araucanía</option>
                  <option value="Los Ríos">Los Ríos</option>
                  <option value="Los Lagos">Los Lagos</option>
                  <option value="Aysén">Aysén</option>
                  <option value="Magallanes">Magallanes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Información adicional sobre el cliente..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}