import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Activity, Package, Truck, Users, Filter, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, TrendingUp, DollarSign, Box } from 'lucide-react';
import { Event, InventoryItem, Vehicle, Worker, Montaje, Desmontalje } from '../types/allegra';
import { eventsAPI, inventoryAPI, vehiclesAPI, workersAPI, montajesAPI, desmontajesAPI } from '../lib/api';
import { INITIAL_EVENTS, INITIAL_INVENTORY, INITIAL_VEHICLES, INITIAL_WORKERS, INITIAL_MONTAJES, INITIAL_DESMONTAJES } from '../data/initialData';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertsPanel } from '../components/AlertsPanel';
import { generarAlertasStock } from '../lib/availabilityEngine';
import { Link } from 'react-router';

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [montajes, setMontajes] = useState<Montaje[]>([]);
  const [desmontajes, setDesmontajes] = useState<Desmontalje[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para filtro de mes
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, inventoryData, vehiclesData, workersData, montajesData, desmontajesData] = await Promise.all([
        eventsAPI.getAll().catch(() => null),
        inventoryAPI.getAll().catch(() => null),
        vehiclesAPI.getAll().catch(() => null),
        workersAPI.getAll().catch(() => null),
        montajesAPI.getAll().catch(() => null),
        desmontajesAPI.getAll().catch(() => null),
      ]);

      const loadedEvents = eventsData && eventsData.length > 0 
        ? eventsData 
        : JSON.parse(localStorage.getItem('allegra_events') || 'null') || INITIAL_EVENTS;
      
      const loadedInventory = inventoryData && inventoryData.length > 0
        ? inventoryData
        : JSON.parse(localStorage.getItem('allegra_inventory') || 'null') || INITIAL_INVENTORY;
      
      const loadedVehicles = vehiclesData && vehiclesData.length > 0
        ? vehiclesData
        : JSON.parse(localStorage.getItem('allegra_vehicles') || 'null') || INITIAL_VEHICLES;
      
      const loadedWorkers = workersData && workersData.length > 0
        ? workersData
        : JSON.parse(localStorage.getItem('allegra_workers') || 'null') || INITIAL_WORKERS;

      const loadedMontajes = montajesData && montajesData.length > 0
        ? montajesData
        : JSON.parse(localStorage.getItem('allegra_montajes') || 'null') || INITIAL_MONTAJES;

      const loadedDesmontajes = desmontajesData && desmontajesData.length > 0
        ? desmontajesData
        : JSON.parse(localStorage.getItem('allegra_desmontajes') || 'null') || INITIAL_DESMONTAJES;

      setEvents(loadedEvents);
      setInventory(loadedInventory);
      setVehicles(loadedVehicles);
      setWorkers(loadedWorkers);
      setMontajes(loadedMontajes);
      setDesmontajes(loadedDesmontajes);

      localStorage.setItem('allegra_events', JSON.stringify(loadedEvents));
      localStorage.setItem('allegra_inventory', JSON.stringify(loadedInventory));
      localStorage.setItem('allegra_vehicles', JSON.stringify(loadedVehicles));
      localStorage.setItem('allegra_workers', JSON.stringify(loadedWorkers));
      localStorage.setItem('allegra_montajes', JSON.stringify(loadedMontajes));
      localStorage.setItem('allegra_desmontajes', JSON.stringify(loadedDesmontajes));

    } catch (error: any) {
      if (error.message !== 'BACKEND_OFFLINE') {
        console.error('Error cargando datos del dashboard:', error);
      }
      
      const localEvents = JSON.parse(localStorage.getItem('allegra_events') || 'null') || INITIAL_EVENTS;
      const localInventory = JSON.parse(localStorage.getItem('allegra_inventory') || 'null') || INITIAL_INVENTORY;
      const localVehicles = JSON.parse(localStorage.getItem('allegra_vehicles') || 'null') || INITIAL_VEHICLES;
      const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || 'null') || INITIAL_WORKERS;
      const localMontajes = JSON.parse(localStorage.getItem('allegra_montajes') || 'null') || INITIAL_MONTAJES;
      const localDesmontajes = JSON.parse(localStorage.getItem('allegra_desmontajes') || 'null') || INITIAL_DESMONTAJES;
      
      setEvents(localEvents);
      setInventory(localInventory);
      setVehicles(localVehicles);
      setWorkers(localWorkers);
      setMontajes(localMontajes);
      setDesmontajes(localDesmontajes);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para navegar entre meses
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filtrar eventos por mes seleccionado
  const eventosDelMes = events.filter(event => {
    const fechaEvento = new Date(event.fechaInicio);
    return fechaEvento.getMonth() === selectedMonth && fechaEvento.getFullYear() === selectedYear;
  });

  // Calcular estadísticas del mes
  const statsDelMes = {
    totalEventos: eventosDelMes.length,
    eventosCerrados: eventosDelMes.filter(e => e.estado === 'Cerrado').length,
    eventosEnCurso: eventosDelMes.filter(e => e.estado === 'Montado' || e.estado === 'En Montaje').length,
    eventosProximos: eventosDelMes.filter(e => e.estado === 'Agendado').length,
    
    // Solo contadores de estado de pago (sin montos)
    eventosPagados: eventosDelMes.filter(e => e.estadoPago === 'Pagado').length,
    eventosAbonados: eventosDelMes.filter(e => e.estadoPago === 'Abonado').length,
    eventosPendientes: eventosDelMes.filter(e => e.estadoPago === 'Pendiente de pago' || !e.estadoPago).length,
  };

  // Estadísticas generales (sin filtro)
  const hoy = new Date().toISOString().split('T')[0];
  const statsGenerales = {
    equipoDisponible: inventory.filter(i => i.estado === 'Disponible').reduce((sum, i) => sum + i.cantidad, 0),
    equipoReservado: inventory.filter(i => i.estado === 'Reservado').reduce((sum, i) => sum + i.cantidad, 0),
    equipoDañado: inventory.filter(i => i.estado === 'Dañado').reduce((sum, i) => sum + i.cantidad, 0),
    equipoMantenimiento: inventory.filter(i => i.estado === 'En Mantenimiento').reduce((sum, i) => sum + i.cantidad, 0),
    vehiculosDisponibles: vehicles.filter(v => v.estado === 'Disponible').length,
    vehiculosTotal: vehicles.length,
    trabajadoresActivos: workers.filter(w => w.estado === 'Activo').length,
    trabajadoresTotal: workers.length,
    
    // Próximos eventos (próximos 7 días)
    eventosProximos7Dias: events.filter(e => {
      const fecha = new Date(e.fechaInicio);
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      return fecha >= new Date(hoy) && fecha <= limite && e.estado !== 'Cancelado' && e.estado !== 'Cerrado';
    }).length,
  };

  // Eventos por tipo del mes
  const eventosPorTipo = eventosDelMes.reduce((acc, event) => {
    if (!acc[event.tipoEvento]) {
      acc[event.tipoEvento] = { 
        total: 0, 
        pagados: 0, 
        abonados: 0, 
        pendientes: 0 
      };
    }
    acc[event.tipoEvento].total += 1;
    if (event.estadoPago === 'Pagado') acc[event.tipoEvento].pagados += 1;
    else if (event.estadoPago === 'Abonado') acc[event.tipoEvento].abonados += 1;
    else acc[event.tipoEvento].pendientes += 1;
    return acc;
  }, {} as Record<string, { total: number; pagados: number; abonados: number; pendientes: number }>);

  const totalEquipo = statsGenerales.equipoDisponible + statsGenerales.equipoReservado + statsGenerales.equipoDañado + statsGenerales.equipoMantenimiento;
  const capacidadOperativa = totalEquipo > 0 ? Math.round((statsGenerales.equipoDisponible / totalEquipo) * 100) : 0;

  // Generar alertas
  const alerts = generarAlertasStock(inventory, events, montajes);

  // Próximos eventos (próximos 7 días)
  const proximosEventos = events
    .filter(e => {
      const fecha = new Date(e.fechaInicio);
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      return fecha >= new Date(hoy) && fecha <= limite && e.estado !== 'Cancelado' && e.estado !== 'Cerrado';
    })
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control Estratégico</h1>
          <p className="text-gray-600 mt-1">Sistema de Gestión Integral - Allegra Producciones</p>
        </div>
      </div>

      {/* Filtro de Mes */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-6 w-6" />
              <span className="text-sm font-medium">Análisis Mensual</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePreviousMonth}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {meses[selectedMonth]} {selectedYear}
                </div>
                <div className="text-xs opacity-90">
                  {eventosDelMes.length} evento{eventosDelMes.length !== 1 ? 's' : ''} programados
                </div>
              </div>
              
              <Button
                onClick={handleNextMonth}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Clave del Mes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Eventos
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsDelMes.totalEventos}</div>
            <p className="text-xs text-gray-600 mt-1">
              {statsDelMes.eventosCerrados} cerrados • {statsDelMes.eventosEnCurso} en curso • {statsDelMes.eventosProximos} próximos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estados de Pago
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Pagados:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {statsDelMes.eventosPagados}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Abonados:</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {statsDelMes.eventosAbonados}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Pendientes:</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {statsDelMes.eventosPendientes}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Capacidad Operativa
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacidadOperativa}%</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600" 
                style={{ width: `${capacidadOperativa}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {statsGenerales.equipoDisponible} de {totalEquipo} unidades disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recursos Activos
            </CardTitle>
            <Box className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Vehículos:</span>
                <span className="font-semibold">{statsGenerales.vehiculosDisponibles}/{statsGenerales.vehiculosTotal}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Trabajadores:</span>
                <span className="font-semibold">{statsGenerales.trabajadoresActivos}/{statsGenerales.trabajadoresTotal}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Próximos 7 días:</span>
                <span className="font-semibold text-purple-600">{statsGenerales.eventosProximos7Dias} eventos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eventos por Tipo */}
      {Object.keys(eventosPorTipo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Evento - {meses[selectedMonth]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(eventosPorTipo)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([tipo, stats]) => (
                  <div key={tipo}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-semibold">{tipo}</span>
                        <span className="text-sm text-gray-600 ml-2">({stats.total} eventos)</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {stats.pagados} pagados
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {stats.abonados} abonados
                        </Badge>
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {stats.pendientes} pendientes
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${(stats.pagados / stats.total) * 100}%` }}
                        />
                        <div 
                          className="bg-yellow-500" 
                          style={{ width: `${(stats.abonados / stats.total) * 100}%` }}
                        />
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${(stats.pendientes / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Eventos y Alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Próximos 7 Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosEventos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay eventos programados en los próximos 7 días
              </div>
            ) : (
              <div className="space-y-3">
                {proximosEventos.map(evento => (
                  <Link
                    key={evento.id}
                    to={`/eventos/${evento.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{evento.nombre}</h4>
                        <p className="text-sm text-gray-600">{evento.cliente}</p>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {evento.estado}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>📅 {new Date(evento.fechaInicio).toLocaleDateString('es-ES')}</span>
                      <span>🎭 {evento.tipoEvento}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas del Sistema */}
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
