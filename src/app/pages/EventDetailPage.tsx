import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, User, MapPin, Package, PackageOpen, PackageX, Printer, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Truck, Star, DollarSign } from 'lucide-react';
import { Event, Montaje, Desmontaje } from '../types/allegra';
import { eventsAPI, montajesAPI, desmontajesAPI } from '../lib/api';
import { useNavigate, useParams } from 'react-router';

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [evento, setEvento] = useState<Event | null>(null);
  const [montaje, setMontaje] = useState<Montaje | null>(null);
  const [desmontaje, setDesmontaje] = useState<Desmontaje | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    if (!eventId) return;

    const events = await eventsAPI.getAll();
    const foundEvent = events.find(e => e.id === eventId);
    setEvento(foundEvent || null);

    const montajes = await montajesAPI.getAll();
    const foundMontaje = montajes.find(m => m.eventoId === eventId);
    setMontaje(foundMontaje || null);

    const desmontajes = await desmontajesAPI.getAll();
    const foundDesmontaje = desmontajes.find(d => d.eventoId === eventId);
    setDesmontaje(foundDesmontaje || null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!evento) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Cargando información del evento...</p>
        </div>
      </div>
    );
  }

  if (showPrintView) {
    return (
      <div className="print:block">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        
        <div className="no-print mb-4 flex justify-between items-center">
          <Button variant="outline" onClick={() => setShowPrintView(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>

        <div ref={printRef} className="print-content min-h-screen bg-white p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center border-b-4 border-purple-600 pb-6 mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">ALLEGRA</h1>
            <h2 className="text-2xl font-semibold text-gray-800">Ficha Completa del Evento</h2>
            <p className="text-gray-600 mt-2">ID: {evento.id}</p>
          </div>

          {/* Event Information */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Evento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre del Evento</p>
                <p className="font-semibold text-lg">{evento.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`font-semibold inline-block px-3 py-1 rounded ${
                  evento.estado === 'Cerrado' ? 'bg-gray-200 text-gray-800' :
                  evento.estado === 'En Proceso' ? 'bg-blue-200 text-blue-800' :
                  'bg-green-200 text-green-800'
                }`}>
                  {evento.estado}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Evento</p>
                <p className="font-semibold">{evento.tipoEvento}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold">{evento.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha del Evento</p>
                <p className="font-semibold">
                  {new Date(evento.fechaInicio).toLocaleDateString('es-CL')}
                  {evento.horaInicio && ` - ${evento.horaInicio}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ubicación</p>
                <p className="font-semibold">{evento.direccion}</p>
              </div>
              {evento.contacto && (
                <div>
                  <p className="text-sm text-gray-600">Contacto</p>
                  <p className="font-semibold">{evento.contacto}</p>
                </div>
              )}
              {evento.telefono && (
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-semibold">{evento.telefono}</p>
                </div>
              )}
            </div>
            {evento.notas && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-gray-600 font-medium">Notas del Evento</p>
                <p className="font-semibold mt-1">{evento.notas}</p>
              </div>
            )}

            {/* Logística - Transporte */}
            {(evento.choferNombre || evento.vehiculoNombre) && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-sm text-purple-700 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Logística - Transporte
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {evento.choferNombre && (
                    <div>
                      <p className="text-sm text-gray-600">Chofer Asignado</p>
                      <p className="font-semibold text-purple-900">{evento.choferNombre}</p>
                    </div>
                  )}
                  {evento.vehiculoNombre && (
                    <div>
                      <p className="text-sm text-gray-600">Vehículo Asignado</p>
                      <p className="font-semibold text-purple-900">{evento.vehiculoNombre}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Montaje Information */}
          {montaje && (
            <div className="mb-8 bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-green-300 pb-2 flex items-center gap-2">
                <PackageOpen className="h-5 w-5 text-green-600" />
                Información del Montaje
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">ID Montaje</p>
                  <p className="font-semibold">{montaje.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responsable de Entrega</p>
                  <p className="font-semibold">{montaje.responsableEntrega}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Salida</p>
                  <p className="font-semibold">
                    {new Date(montaje.fechaSalida).toLocaleDateString('es-CL')} - {montaje.horaSalida}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="font-semibold text-green-700">Completado</p>
                </div>
              </div>
              {montaje.observaciones && (
                <div className="mb-4 bg-white p-3 rounded border border-green-200">
                  <p className="text-sm text-gray-600 font-medium">Observaciones</p>
                  <p className="font-semibold mt-1">{montaje.observaciones}</p>
                </div>
              )}
              
              <h4 className="font-semibold text-gray-800 mb-3">Equipamiento Entregado</h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Equipo</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Solicitada</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Confirmada</th>
                  </tr>
                </thead>
                <tbody>
                  {montaje.items.map((item, index) => (
                    <tr key={item.equipoId} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{item.equipoNombre}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.cantidadSolicitada}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{item.cantidadConfirmada}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-200 font-semibold">
                    <td colSpan={2} className="border border-gray-300 px-4 py-2 text-right">TOTAL:</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {montaje.items.reduce((sum, item) => sum + item.cantidadSolicitada, 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {montaje.items.reduce((sum, item) => sum + item.cantidadConfirmada, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Desmontaje Information */}
          {desmontaje && (
            <div className="mb-8 bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-300 pb-2 flex items-center gap-2">
                <PackageX className="h-5 w-5 text-blue-600" />
                Información del Desmontaje
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">ID Desmontaje</p>
                  <p className="font-semibold">{desmontaje.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Responsable de Recepción</p>
                  <p className="font-semibold">{desmontaje.responsableRecepcion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Retorno</p>
                  <p className="font-semibold">
                    {new Date(desmontaje.fechaRetorno).toLocaleDateString('es-CL')} - {desmontaje.horaRetorno}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className="font-semibold text-blue-700">Completado</p>
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 mb-3">Equipamiento Devuelto</h4>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Equipo</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Salida</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Retorno</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Estado</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {desmontaje.items.map((item, index) => (
                    <tr key={item.equipoId} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{item.equipoNombre}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.cantidadSalida}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{item.cantidadRetorno}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          item.estadoRetorno === 'Correcto' ? 'bg-green-200 text-green-800' :
                          item.estadoRetorno === 'Dañado' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {item.estadoRetorno === 'Correcto' ? <CheckCircle className="h-3 w-3" /> :
                           item.estadoRetorno === 'Dañado' ? <XCircle className="h-3 w-3" /> :
                           <AlertTriangle className="h-3 w-3" />}
                          {item.estadoRetorno}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{item.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-200 font-semibold">
                    <td colSpan={2} className="border border-gray-300 px-4 py-2 text-right">TOTAL:</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {desmontaje.items.reduce((sum, item) => sum + item.cantidadSalida, 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {desmontaje.items.reduce((sum, item) => sum + item.cantidadRetorno, 0)}
                    </td>
                    <td colSpan={2} className="border border-gray-300 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>

              {desmontaje.incidencias && desmontaje.incidencias.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Incidencias Reportadas
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {desmontaje.incidencias.map((incidencia, index) => (
                      <li key={index} className="text-sm text-red-700">{incidencia}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="border-t-2 border-gray-300 pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Equipos Entregados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {montaje?.items.reduce((sum, item) => sum + item.cantidadConfirmada, 0) || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <PackageX className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Equipos Devueltos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {desmontaje?.items.reduce((sum, item) => sum + item.cantidadRetorno, 0) || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Estado Final</p>
                <p className="text-2xl font-bold text-green-600">{evento.estado}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>Documento generado por ALLEGRA - Sistema de Gestión de Eventos</p>
            <p className="mt-1">Fecha de generación: {new Date().toLocaleDateString('es-CL')} {new Date().toLocaleTimeString('es-CL')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Button variant="outline" onClick={() => navigate('/eventos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Eventos
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold whitespace-nowrap">Detalle del Evento</h1>
          <p className="text-gray-600 mt-1">Información completa del evento cerrado</p>
          <div className="mt-3">
            <Button onClick={() => setShowPrintView(true)} className="bg-purple-600 hover:bg-purple-700">
              <Printer className="mr-2 h-4 w-4" />
              Ver Ficha e Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Event Status Banner */}
      <Card className={`border-l-4 ${
        evento.estado === 'Cerrado' ? 'border-l-gray-500 bg-gray-50' :
        evento.estado === 'En Proceso' ? 'border-l-blue-500 bg-blue-50' :
        'border-l-green-500 bg-green-50'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{evento.nombre}</h2>
              <p className="text-gray-600 mt-1">
                {new Date(evento.fechaInicio).toLocaleDateString('es-CL')} - {evento.cliente}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Estado del Evento</p>
              <p className={`text-xl font-bold ${
                evento.estado === 'Cerrado' ? 'text-gray-700' :
                evento.estado === 'En Proceso' ? 'text-blue-700' :
                'text-green-700'
              }`}>
                {evento.estado}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Información General del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Tipo de Evento</h4>
              <p className="text-lg">{evento.tipoEvento}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Cliente</h4>
              <p className="text-lg">{evento.cliente}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Fecha y Hora</h4>
              <p className="text-lg">
                {new Date(evento.fechaInicio).toLocaleDateString('es-CL')}
                {evento.horaInicio && ` - ${evento.horaInicio}`}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Ubicación</h4>
              <p className="text-lg">{evento.direccion}</p>
            </div>
            {evento.contacto && (
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Contacto</h4>
                <p className="text-lg">{evento.contacto}</p>
              </div>
            )}
            {evento.telefono && (
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Teléfono</h4>
                <p className="text-lg">{evento.telefono}</p>
              </div>
            )}
          </div>

          {evento.notas && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Notas del Evento</h4>
              <p>{evento.notas}</p>
            </div>
          )}

          {/* Logística - Transporte */}
          {(evento.choferNombre || evento.vehiculoNombre) && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Logística - Transporte
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evento.choferNombre && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-purple-600 mb-1">Chofer Asignado</h4>
                    <p className="text-lg font-semibold text-purple-900">{evento.choferNombre}</p>
                  </div>
                )}
                {evento.vehiculoNombre && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-purple-600 mb-1">Vehículo Asignado</h4>
                    <p className="text-lg font-semibold text-purple-900">{evento.vehiculoNombre}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estado de Pago */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <DollarSign className="h-5 w-5" />
            Estado de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-lg border-2 text-lg font-bold ${
            evento.estadoPago === 'Pagado' ? 'bg-green-50 border-green-400 text-green-700' :
            evento.estadoPago === 'Abonado' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
            'bg-red-50 border-red-400 text-red-700'
          }`}>
            <DollarSign className="h-6 w-6" />
            {evento.estadoPago || 'Pendiente de pago'}
          </div>
        </CardContent>
      </Card>

      {/* Montaje Card */}
      {montaje && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <PackageOpen className="h-5 w-5" />
              Montaje - Salida de Equipos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Responsable</h4>
                <p className="text-lg">{montaje.responsableEntrega}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Fecha de Salida</h4>
                <p className="text-lg">
                  {new Date(montaje.fechaSalida).toLocaleDateString('es-CL')} - {montaje.horaSalida}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Total Equipos</h4>
                <p className="text-lg font-bold text-green-600">
                  {montaje.items.reduce((sum, item) => sum + item.cantidadConfirmada, 0)} unidades
                </p>
              </div>
            </div>

            {montaje.observaciones && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Observaciones</h4>
                <p>{montaje.observaciones}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Equipo</th>
                    <th className="border px-4 py-2 text-center">Solicitada</th>
                    <th className="border px-4 py-2 text-center">Confirmada</th>
                  </tr>
                </thead>
                <tbody>
                  {montaje.items.map((item) => (
                    <tr key={item.equipoId}>
                      <td className="border px-4 py-2">{item.equipoNombre}</td>
                      <td className="border px-4 py-2 text-center">{item.cantidadSolicitada}</td>
                      <td className="border px-4 py-2 text-center font-semibold">{item.cantidadConfirmada}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desmontaje Card */}
      {desmontaje && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <PackageX className="h-5 w-5" />
              Desmontaje - Retorno de Equipos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Responsable</h4>
                <p className="text-lg">{desmontaje.responsableRecepcion}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Fecha de Retorno</h4>
                <p className="text-lg">
                  {new Date(desmontaje.fechaRetorno).toLocaleDateString('es-CL')} - {desmontaje.horaRetorno}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Total Devuelto</h4>
                <p className="text-lg font-bold text-blue-600">
                  {desmontaje.items.reduce((sum, item) => sum + item.cantidadRetorno, 0)} unidades
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Equipo</th>
                    <th className="border px-4 py-2 text-center">Salida</th>
                    <th className="border px-4 py-2 text-center">Retorno</th>
                    <th className="border px-4 py-2 text-center">Estado</th>
                    <th className="border px-4 py-2 text-left">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {desmontaje.items.map((item) => (
                    <tr key={item.equipoId}>
                      <td className="border px-4 py-2">{item.equipoNombre}</td>
                      <td className="border px-4 py-2 text-center">{item.cantidadSalida}</td>
                      <td className="border px-4 py-2 text-center font-semibold">{item.cantidadRetorno}</td>
                      <td className="border px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          item.estadoRetorno === 'Correcto' ? 'bg-green-100 text-green-800' :
                          item.estadoRetorno === 'Dañado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.estadoRetorno === 'Correcto' && <CheckCircle className="h-3 w-3" />}
                          {item.estadoRetorno === 'Dañado' && <XCircle className="h-3 w-3" />}
                          {item.estadoRetorno === 'Faltante' && <AlertTriangle className="h-3 w-3" />}
                          {item.estadoRetorno}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-sm">{item.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {desmontaje.incidencias && desmontaje.incidencias.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Incidencias Reportadas ({desmontaje.incidencias.length})
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {desmontaje.incidencias.map((incidencia, index) => (
                    <li key={index} className="text-sm text-red-700">{incidencia}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Equipos Entregados</p>
              <p className="text-3xl font-bold text-purple-600">
                {montaje?.items.reduce((sum, item) => sum + item.cantidadConfirmada, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <PackageX className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Equipos Devueltos</p>
              <p className="text-3xl font-bold text-blue-600">
                {desmontaje?.items.reduce((sum, item) => sum + item.cantidadRetorno, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Estado del Evento</p>
              <p className="text-3xl font-bold text-green-600">{evento.estado}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluación del Evento - Solo visible cuando el evento está Cerrado */}
      {evento.estado === 'Cerrado' && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Star className="h-5 w-5" />
              Evaluación del Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <p className="text-sm text-purple-700 bg-purple-50 p-4 rounded-lg border border-purple-200">
                📋 <strong>Registro de evaluación</strong> para mejorar la toma de decisiones en futuros eventos. Completa esta información para mantener un historial de aprendizajes y mejoras continuas.
              </p>

              {/* Calificaciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calificación General */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Calificación General</h4>
                  {evento.evaluacion?.calificacionGeneral ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-6 w-6 ${
                            rating <= evento.evaluacion!.calificacionGeneral!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xl font-bold text-yellow-700">
                        {evento.evaluacion.calificacionGeneral}/5
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Sin calificar</p>
                  )}
                </div>

                {/* Desempeño del Equipo */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Desempeño del Equipo</h4>
                  {evento.evaluacion?.desempenoEquipo ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-5 w-5 ${
                            rating <= evento.evaluacion!.desempenoEquipo!
                              ? 'text-green-400 fill-green-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-bold text-green-700">
                        {evento.evaluacion.desempenoEquipo}/5
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Sin calificar</p>
                  )}
                </div>

                {/* Estado del Equipamiento */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Estado del Equipamiento</h4>
                  {evento.evaluacion?.estadoEquipamiento ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-5 w-5 ${
                            rating <= evento.evaluacion!.estadoEquipamiento!
                              ? 'text-blue-400 fill-blue-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-lg font-bold text-blue-700">
                        {evento.evaluacion.estadoEquipamiento}/5
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Sin calificar</p>
                  )}
                </div>
              </div>

              {/* Aspectos Cualitativos */}
              <div className="space-y-4">
                {/* Aspectos Positivos */}
                {evento.evaluacion?.aspectosPositivos && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      ✅ Aspectos Positivos
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{evento.evaluacion.aspectosPositivos}</p>
                  </div>
                )}

                {/* Aspectos a Mejorar */}
                {evento.evaluacion?.aspectosAMejorar && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                      ⚠️ Aspectos a Mejorar
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{evento.evaluacion.aspectosAMejorar}</p>
                  </div>
                )}

                {/* Comentarios del Cliente */}
                {evento.evaluacion?.comentariosCliente && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      💬 Comentarios del Cliente
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{evento.evaluacion.comentariosCliente}</p>
                  </div>
                )}

                {/* Recomendaciones */}
                {evento.evaluacion?.recomendaciones && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      💡 Recomendaciones para Futuros Eventos
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{evento.evaluacion.recomendaciones}</p>
                  </div>
                )}
              </div>

              {/* Fecha de Evaluación */}
              {evento.evaluacion?.fechaEvaluacion && (
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <strong>Evaluación registrada:</strong>{' '}
                  {new Date(evento.evaluacion.fechaEvaluacion).toLocaleDateString('es-CL')} a las{' '}
                  {new Date(evento.evaluacion.fechaEvaluacion).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Mensaje si no hay evaluación */}
              {!evento.evaluacion?.calificacionGeneral && 
               !evento.evaluacion?.aspectosPositivos && 
               !evento.evaluacion?.aspectosAMejorar && 
               !evento.evaluacion?.comentariosCliente && 
               !evento.evaluacion?.recomendaciones && (
                <div className="text-center py-8">
                  <p className="text-gray-500 italic">
                    Este evento aún no tiene evaluación registrada.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Edita el evento para agregar una evaluación y mejorar futuros servicios.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}