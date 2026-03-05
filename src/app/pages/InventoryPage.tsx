import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Trash2, Box, Pencil, AlertTriangle, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types/allegra';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { inventoryAPI } from '../lib/api';
import { INITIAL_INVENTORY, INVENTORY_VERSION } from '../data/initialData';

export function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      // SIEMPRE cargar de localStorage primero
      const localInventory = JSON.parse(localStorage.getItem('allegra_inventory') || 'null');
      
      // Intentar cargar del backend
      let backendInventory = null;
      try {
        backendInventory = await inventoryAPI.getAll();
      } catch (error) {
        console.log('Backend no disponible, usando datos locales');
      }
      
      // Decidir qué datos usar:
      const loadedInventory = 
        (backendInventory && backendInventory.length > 0) ? backendInventory :
        (localInventory && localInventory.length > 0) ? localInventory :
        (INITIAL_INVENTORY.length > 0) ? INITIAL_INVENTORY :
        [];
      
      console.log('🔍 InventoryPage - Datos cargados:', {
        backend: backendInventory?.length || 0,
        localStorage: localInventory?.length || 0,
        initial: INITIAL_INVENTORY.length,
        final: loadedInventory.length,
        source: (backendInventory && backendInventory.length > 0) ? 'backend' : 
                (localInventory && localInventory.length > 0) ? 'localStorage' : 
                'initial'
      });
      
      setInventory(loadedInventory);
      
      // Guardar en localStorage si hay datos
      if (loadedInventory.length > 0) {
        localStorage.setItem('allegra_inventory', JSON.stringify(loadedInventory));
      }
    } catch (error) {
      console.error('Error cargando inventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceReloadInitialData = () => {
    console.log('🔄 Limpiando datos...');
    localStorage.removeItem('allegra_inventory');
    localStorage.removeItem('allegra_inventory_version');
    console.log('✅ Datos limpiados. Recargando página...');
    window.location.reload();
  };

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id' | 'historialUso'>) => {
    const item: InventoryItem = {
      ...newItem,
      id: `INV-${Date.now()}`,
      historialUso: [],
    };

    const updatedInventory = [...inventory, item];
    setInventory(updatedInventory);
    localStorage.setItem('allegra_inventory', JSON.stringify(updatedInventory));

    try {
      await inventoryAPI.save(updatedInventory);
      console.log('✅ Equipo guardado exitosamente');
    } catch (error) {
      console.log('💾 Equipo guardado localmente');
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este equipo?')) return;

    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    localStorage.setItem('allegra_inventory', JSON.stringify(updatedInventory));

    try {
      await inventoryAPI.save(updatedInventory);
      console.log('✅ Equipo eliminado exitosamente');
    } catch (error) {
      console.log('💾 Cambios guardados localmente');
    }
  };

  const handleEditItem = async (updatedItem: InventoryItem) => {
    const updatedInventory = inventory.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setInventory(updatedInventory);
    localStorage.setItem('allegra_inventory', JSON.stringify(updatedInventory));

    try {
      await inventoryAPI.save(updatedInventory);
      console.log('✅ Equipo actualizado exitosamente');
    } catch (error) {
      console.log('💾 Cambios guardados localmente');
    }

    setEditingItem(null);
  };

  // Get unique categories
  const categorias = Array.from(new Set(inventory.map(item => item.categoria)));
  
  // Get consumables with low stock
  const consumiblesLowStock = inventory.filter(item => 
    item.esConsumible && 
    item.stockMinimo !== undefined && 
    item.cantidad < item.stockMinimo
  );
  
  const consumiblesCritical = consumiblesLowStock.filter(item => item.cantidad === 0);
  const consumiblesWarning = consumiblesLowStock.filter(item => item.cantidad > 0 && item.cantidad < (item.stockMinimo || 0));
  
  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = !filterCategoria || item.categoria === filterCategoria;
    const matchesEstado = !filterEstado || item.estado === filterEstado;
    
    return matchesSearch && matchesCategoria && matchesEstado;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventario General</h1>
          <p className="text-gray-600 mt-1">Control de equipamiento y stock</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={forceReloadInitialData}
            className="bg-yellow-50 border-2 border-yellow-500 text-yellow-900 hover:bg-yellow-100"
            title="Limpiar datos y recargar inventario inicial"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            🔄 Recargar Datos Iniciales
          </Button>
          <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2" />
            Agregar Equipo
          </Button>
        </div>
      </div>

      {/* Alertas de Stock Bajo - Insumos Consumibles */}
      {consumiblesLowStock.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Stock Crítico - Insumos Consumibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Critical Alerts (stock = 0) */}
              {consumiblesCritical.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-800 text-sm">
                    🔴 Stock Agotado ({consumiblesCritical.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {consumiblesCritical.map(item => (
                      <div
                        key={item.id}
                        className="bg-red-100 border-2 border-red-400 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-red-900">{item.nombre}</div>
                          <div className="text-sm text-red-700">
                            Stock: <span className="font-bold">0 {item.unidadMedida}</span>
                            {' '} | Mínimo: {item.stockMinimo} {item.unidadMedida}
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            ⚠️ REPOSICIÓN URGENTE REQUERIDA
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="ml-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                        >
                          Reponer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Alerts (stock > 0 but < min) */}
              {consumiblesWarning.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-yellow-800 text-sm">
                    🟡 Stock Bajo ({consumiblesWarning.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {consumiblesWarning.map(item => (
                      <div
                        key={item.id}
                        className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-900">{item.nombre}</div>
                          <div className="text-sm text-yellow-700">
                            Stock: <span className="font-bold">{item.cantidad} {item.unidadMedida}</span>
                            {' '} | Mínimo: {item.stockMinimo} {item.unidadMedida}
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            ⚡ Reposición recomendada
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="ml-3 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                        >
                          Reponer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {inventory.filter(i => i.estado === 'Disponible').reduce((sum, i) => sum + i.cantidad, 0)}
            </div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {inventory.filter(i => i.estado === 'Reservado').reduce((sum, i) => sum + i.cantidad, 0)}
            </div>
            <div className="text-sm text-gray-600">Reservados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {inventory.filter(i => i.estado === 'En Mantenimiento').reduce((sum, i) => sum + i.cantidad, 0)}
            </div>
            <div className="text-sm text-gray-600">En Mantenimiento</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {inventory.filter(i => i.estado === 'Dañado').reduce((sum, i) => sum + i.cantidad, 0)}
            </div>
            <div className="text-sm text-gray-600">Dañados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {inventory.filter(i => i.estado === 'Fuera de Servicio').reduce((sum, i) => sum + i.cantidad, 0)}
            </div>
            <div className="text-sm text-gray-600">Fuera de Servicio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar equipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full border rounded-lg px-4 py-2"
              />
            </div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="border rounded-lg px-4 py-2"
            >
              <option value="">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="En Mantenimiento">En Mantenimiento</option>
              <option value="Dañado">Dañado</option>
              <option value="Fuera de Servicio">Fuera de Servicio</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipos Registrados ({filteredInventory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No se encontraron equipos con los filtros seleccionados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Categoría</th>
                    <th className="text-left py-3 px-4">Marca/Modelo</th>
                    <th className="text-center py-3 px-4">Cantidad</th>
                    <th className="text-left py-3 px-4">Estado</th>
                    <th className="text-center py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const isExpanded = item.esContenedor && expandedCaseId === item.id && item.contenidoInterno;
                    
                    return [
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {item.esContenedor && (
                              <button
                                onClick={() => setExpandedCaseId(expandedCaseId === item.id ? null : item.id)}
                                className="text-indigo-600 hover:text-indigo-800"
                                title="Ver contenido del case"
                              >
                                <Box className="h-4 w-4" />
                              </button>
                            )}
                            <span className="font-medium">{item.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {item.marca} {item.modelo}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">
                          {item.cantidad}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                            item.estado === 'Reservado' ? 'bg-blue-100 text-blue-800' :
                            item.estado === 'En Mantenimiento' ? 'bg-orange-100 text-orange-800' :
                            item.estado === 'Fuera de Servicio' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-indigo-600 hover:text-indigo-800"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>,
                      
                      // Expanded Case Content Row
                      isExpanded ? (
                        <tr key={`${item.id}-expanded`} className="bg-indigo-50">
                          <td colSpan={6} className="py-4 px-4">
                            <div className="bg-white rounded-lg p-4 border border-indigo-200">
                              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                <Box className="h-5 w-5" />
                                Contenido del Case
                              </h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Micrófonos */}
                                {item.contenidoInterno?.microfonos && item.contenidoInterno.microfonos.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">🎤 Micrófonos</h5>
                                    <div className="space-y-1">
                                      {item.contenidoInterno.microfonos.map((mic, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">
                                            {mic.cantidad}x {mic.nombre}
                                            {mic.marca && <span className="text-gray-500 text-xs ml-1">({mic.marca})</span>}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Accesorios */}
                                {item.contenidoInterno?.accesorios && item.contenidoInterno.accesorios.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">🔧 Accesorios</h5>
                                    <div className="space-y-1">
                                      {item.contenidoInterno.accesorios.map((acc, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">
                                            {acc.cantidad}x {acc.nombre}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Cables */}
                                {item.contenidoInterno?.cables && item.contenidoInterno.cables.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">🔌 Cables</h5>
                                    <div className="space-y-1">
                                      {item.contenidoInterno.cables.map((cable, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">
                                            {cable.cantidad}x {cable.nombre}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Herramientas */}
                                {item.contenidoInterno?.herramientas && item.contenidoInterno.herramientas.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <h5 className="font-medium text-gray-700 mb-2 text-sm">🔧 Herramientas</h5>
                                    <div className="space-y-1">
                                      {item.contenidoInterno.herramientas.map((herr, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-700">
                                            {herr.cantidad}x {herr.nombre}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Total Count */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-sm font-semibold text-indigo-900">
                                  Total de items en el case: {
                                    (item.contenidoInterno?.microfonos?.reduce((sum, m) => sum + m.cantidad, 0) || 0) +
                                    (item.contenidoInterno?.accesorios?.reduce((sum, a) => sum + a.cantidad, 0) || 0) +
                                    (item.contenidoInterno?.cables?.reduce((sum, c) => sum + c.cantidad, 0) || 0) +
                                    (item.contenidoInterno?.herramientas?.reduce((sum, h) => sum + h.cantidad, 0) || 0)
                                  }
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <AddInventoryModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddItem}
          categorias={categorias}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditInventoryModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditItem}
          categorias={categorias}
        />
      )}
    </div>
  );
}

// Add Inventory Modal Component
function AddInventoryModal({ 
  onClose, 
  onAdd,
  categorias
}: { 
  onClose: () => void; 
  onAdd: (item: Omit<InventoryItem, 'id' | 'historialUso'>) => void;
  categorias: string[];
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    marca: '',
    modelo: '',
    cantidad: 1,
    numeroSerie: '',
    estado: 'Disponible' as InventoryItem['estado'],
    ubicacion: '',
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    notas: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Agregar Nuevo Equipo</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: Consola Yamaha M7CL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: Yamaha"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Modelo *
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: M7CL-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
                min="1"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                name="numeroSerie"
                value={formData.numeroSerie}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Disponible">Disponible</option>
                <option value="Reservado">Reservado</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Dañado">Dañado</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de Adquisición *
              </label>
              <input
                type="date"
                name="fechaAdquisicion"
                value={formData.fechaAdquisicion}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

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
              placeholder="Información adicional sobre el equipo..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Equipo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Inventory Modal Component
function EditInventoryModal({ 
  item, 
  onClose, 
  onSave,
  categorias
}: { 
  item: InventoryItem; 
  onClose: () => void; 
  onSave: (item: InventoryItem) => void;
  categorias: string[];
}) {
  const [formData, setFormData] = useState({
    nombre: item.nombre || '',
    categoria: item.categoria || '',
    marca: item.marca || '',
    modelo: item.modelo || '',
    cantidad: item.cantidad || 0,
    numeroSerie: item.numeroSerie || '',
    estado: item.estado || 'Disponible',
    ubicacion: item.ubicacion || '',
    fechaAdquisicion: item.fechaAdquisicion || '',
    notas: item.notas || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...item, ...formData });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad' ? Number(value) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Editar Equipo</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: Consola Yamaha M7CL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría *
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Seleccionar...</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: Yamaha"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Modelo *
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
                placeholder="ej: M7CL-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                required
                min="1"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                name="numeroSerie"
                value={formData.numeroSerie}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="Disponible">Disponible</option>
                <option value="Reservado">Reservado</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Dañado">Dañado</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de Adquisición *
              </label>
              <input
                type="date"
                name="fechaAdquisicion"
                value={formData.fechaAdquisicion}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

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
              placeholder="Información adicional sobre el equipo..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Pencil className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}