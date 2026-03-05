import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Save, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Coffee
} from 'lucide-react';
import { Worker, RegistroSemanal, DiaTrabajoRegistro, Event } from '../types/allegra';

interface RegistroSemanalHorasProps {
  trabajador: Worker;
  onUpdate: (registros: RegistroSemanal[]) => void;
  eventos?: Event[];
}

export function RegistroSemanalHoras({ trabajador, onUpdate, eventos = [] }: RegistroSemanalHorasProps) {
  const [registros, setRegistros] = useState<RegistroSemanal[]>(trabajador.registroSemanal || []);
  const [semanaActual, setSemanaActual] = useState<string>(getCurrentWeek());
  const [registroActivo, setRegistroActivo] = useState<RegistroSemanal | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    setRegistros(trabajador.registroSemanal || []);
  }, [trabajador]);

  // Obtener la semana ISO actual
  function getCurrentWeek(): string {
    const now = new Date();
    const onejan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  }

  // Obtener fechas de la semana
  function getWeekDates(weekString: string): { inicio: Date; fin: Date } {
    const [year, week] = weekString.split('-W');
    const firstDay = new Date(parseInt(year), 0, 1);
    const daysOffset = (parseInt(week) - 1) * 7;
    const weekStart = new Date(firstDay.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    
    // Ajustar al lunes
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(weekStart.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { inicio: monday, fin: sunday };
  }

  // Formatear fecha
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Formatear fecha para mostrar
  function formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  }

  // Crear nuevo registro para la semana
  function crearNuevoRegistro() {
    const { inicio, fin } = getWeekDates(semanaActual);
    const dias: DiaTrabajoRegistro[] = [];
    
    // Crear días de la semana
    const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      dias.push({
        fecha: formatDate(fecha),
        diaNombre: diasNombres[i],
        horaInicio: '09:00',
        horaFin: '18:00',
        horasTrabajadas: 0,
        descuentoColacion: 0,
        horasNetas: 0,
        observaciones: '',
      });
    }

    const nuevoRegistro: RegistroSemanal = {
      id: `REG-${Date.now()}`,
      trabajadorId: trabajador.id,
      semana: semanaActual,
      fechaInicio: formatDate(inicio),
      fechaFin: formatDate(fin),
      diasTrabajados: dias,
      totalHoras: 0,
      descuentoColacion: 0,
      totalHorasNetas: 0,
      observaciones: '',
      aprobado: false,
    };

    setRegistroActivo(nuevoRegistro);
    setModoEdicion(true);
  }

  // Calcular horas trabajadas
  function calcularHoras(horaInicio: string, horaFin: string): number {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    const inicio = hI + mI / 60;
    const fin = hF + mF / 60;
    let horas = fin - inicio;
    if (horas < 0) horas += 24; // Caso de cruce de medianoche
    return Math.max(0, horas);
  }

  // Actualizar día de trabajo
  function actualizarDia(index: number, campo: keyof DiaTrabajoRegistro, valor: any) {
    if (!registroActivo) return;

    const diasActualizados = [...registroActivo.diasTrabajados];
    diasActualizados[index] = { ...diasActualizados[index], [campo]: valor };

    // Recalcular horas si cambió hora inicio o fin
    if (campo === 'horaInicio' || campo === 'horaFin') {
      const dia = diasActualizados[index];
      diasActualizados[index].horasTrabajadas = calcularHoras(dia.horaInicio, dia.horaFin);
      diasActualizados[index].horasNetas = diasActualizados[index].horasTrabajadas - diasActualizados[index].descuentoColacion;
    }

    // Recalcular horas netas si cambió el descuento de colación
    if (campo === 'descuentoColacion') {
      const dia = diasActualizados[index];
      diasActualizados[index].horasNetas = dia.horasTrabajadas - dia.descuentoColacion;
    }

    // Calcular totales
    const totalHoras = diasActualizados.reduce((sum, dia) => sum + dia.horasTrabajadas, 0);
    const totalDescuento = diasActualizados.reduce((sum, dia) => sum + dia.descuentoColacion, 0);
    const totalHorasNetas = diasActualizados.reduce((sum, dia) => sum + dia.horasNetas, 0);

    setRegistroActivo({
      ...registroActivo,
      diasTrabajados: diasActualizados,
      totalHoras,
      descuentoColacion: totalDescuento,
      totalHorasNetas,
    });
  }

  // Guardar registro
  function guardarRegistro() {
    if (!registroActivo) return;

    const registrosActualizados = registros.filter(r => r.id !== registroActivo.id);
    registrosActualizados.push(registroActivo);
    registrosActualizados.sort((a, b) => b.semana.localeCompare(a.semana));

    setRegistros(registrosActualizados);
    onUpdate(registrosActualizados);
    setRegistroActivo(null);
    setModoEdicion(false);
  }

  // Cancelar edición
  function cancelarEdicion() {
    setRegistroActivo(null);
    setModoEdicion(false);
  }

  // Editar registro existente
  function editarRegistro(registro: RegistroSemanal) {
    setRegistroActivo({ ...registro });
    setModoEdicion(true);
  }

  // Aprobar registro
  function aprobarRegistro(registroId: string) {
    const registrosActualizados = registros.map(r =>
      r.id === registroId
        ? {
            ...r,
            aprobado: true,
            fechaAprobacion: new Date().toISOString(),
            aprobadoPor: 'Administrador',
          }
        : r
    );
    setRegistros(registrosActualizados);
    onUpdate(registrosActualizados);
  }

  // Eliminar registro
  function eliminarRegistro(registroId: string) {
    if (!confirm('¿Está seguro de eliminar este registro semanal?')) return;
    const registrosActualizados = registros.filter(r => r.id !== registroId);
    setRegistros(registrosActualizados);
    onUpdate(registrosActualizados);
  }

  // Cambiar semana
  function cambiarSemana(direccion: 'anterior' | 'siguiente') {
    const [year, week] = semanaActual.split('-W').map(Number);
    let newWeek = week + (direccion === 'siguiente' ? 1 : -1);
    let newYear = year;

    if (newWeek > 52) {
      newWeek = 1;
      newYear++;
    } else if (newWeek < 1) {
      newWeek = 52;
      newYear--;
    }

    setSemanaActual(`${newYear}-W${newWeek.toString().padStart(2, '0')}`);
  }

  // Verificar si ya existe registro para la semana actual
  const registroExistente = registros.find(r => r.semana === semanaActual);

  if (modoEdicion && registroActivo) {
    return (
      <div className="space-y-4">
        {/* Header info - responsive */}
        <div className="bg-purple-50 rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-purple-900 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Semana {registroActivo.semana}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {formatDisplayDate(registroActivo.fechaInicio)} al {formatDisplayDate(registroActivo.fechaFin)}
          </p>
        </div>

        {/* Tabla de días */}
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Día</th>
                <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                <th className="px-3 py-3 text-left font-semibold">Hora Inicio</th>
                <th className="px-3 py-3 text-left font-semibold">Hora Fin</th>
                <th className="px-3 py-3 text-center font-semibold">Horas Trab.</th>
                <th className="px-3 py-3 text-center font-semibold bg-orange-50">
                  <Coffee className="h-4 w-4 inline mr-1" />
                  Desc. Colación
                </th>
                <th className="px-3 py-3 text-center font-semibold bg-green-50">Horas Netas</th>
                <th className="px-3 py-3 text-left font-semibold">Evento</th>
                <th className="px-3 py-3 text-left font-semibold">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registroActivo.diasTrabajados.map((dia, index) => (
                <tr key={index} className={dia.horasTrabajadas > 0 ? 'bg-green-50' : ''}>
                  <td className="px-3 py-3 font-medium">{dia.diaNombre}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatDisplayDate(dia.fecha)}</td>
                  <td className="px-3 py-3">
                    <input
                      type="time"
                      value={dia.horaInicio}
                      onChange={(e) => actualizarDia(index, 'horaInicio', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="time"
                      value={dia.horaFin}
                      onChange={(e) => actualizarDia(index, 'horaFin', e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`font-semibold ${dia.horasTrabajadas > 0 ? 'text-purple-700' : 'text-gray-400'}`}>
                      {dia.horasTrabajadas.toFixed(1)}h
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center bg-orange-50">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={dia.horasTrabajadas}
                      value={dia.descuentoColacion}
                      onChange={(e) => actualizarDia(index, 'descuentoColacion', parseFloat(e.target.value) || 0)}
                      className="border rounded px-2 py-1 w-20 text-center font-semibold text-orange-700"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-3 text-center bg-green-50">
                    <span className={`font-bold ${dia.horasNetas > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                      {dia.horasNetas.toFixed(1)}h
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={dia.eventoId || ''}
                      onChange={(e) => {
                        const eventoId = e.target.value;
                        const evento = eventos.find(ev => ev.id === eventoId);
                        actualizarDia(index, 'eventoId', eventoId || undefined);
                        actualizarDia(index, 'eventoNombre', evento?.nombre || undefined);
                      }}
                      className="border rounded px-2 py-1 w-full text-xs"
                    >
                      <option value="">Sin evento</option>
                      {eventos
                        .filter(ev => {
                          const fechaEvento = new Date(ev.fechaInicio);
                          const fechaDia = new Date(dia.fecha);
                          return fechaEvento.toDateString() === fechaDia.toDateString();
                        })
                        .map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.nombre}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={dia.observaciones || ''}
                      onChange={(e) => actualizarDia(index, 'observaciones', e.target.value)}
                      placeholder="Obs..."
                      className="border rounded px-2 py-1 w-full text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen y descuento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg border-2 border-purple-200">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-700">Total Horas Trabajadas</label>
            <div className="text-3xl font-bold text-purple-700 mt-1">
              {registroActivo.totalHoras.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Suma de todos los turnos</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-orange-600" />
              Descuento Colación Total
            </label>
            <div className="text-3xl font-bold text-orange-600 mt-1">
              -{registroActivo.descuentoColacion.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Suma de descuentos diarios</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-300">
            <label className="text-sm font-medium text-gray-700">Total Horas Netas</label>
            <div className="text-3xl font-bold text-green-700 mt-1">
              {registroActivo.totalHorasNetas.toFixed(1)}h
            </div>
            <p className="text-xs text-gray-500 mt-1">Horas pagables</p>
          </div>
        </div>

        {/* Observaciones generales */}
        <div>
          <label className="text-sm font-medium text-gray-700">Observaciones Generales</label>
          <textarea
            value={registroActivo.observaciones || ''}
            onChange={(e) =>
              setRegistroActivo({ ...registroActivo, observaciones: e.target.value })
            }
            placeholder="Observaciones sobre la semana..."
            rows={3}
            className="border rounded px-3 py-2 w-full mt-1"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={cancelarEdicion}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={guardarRegistro} className="bg-purple-600 hover:bg-purple-700">
            <Save className="mr-2 h-4 w-4" />
            Guardar Registro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Registro Semanal de Horas
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cambiarSemana('anterior')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-normal px-4">
                Semana {semanaActual}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cambiarSemana('siguiente')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registroExistente ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                registroExistente.aprobado ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">
                        {formatDisplayDate(registroExistente.fechaInicio)} al{' '}
                        {formatDisplayDate(registroExistente.fechaFin)}
                      </h3>
                      {registroExistente.aprobado && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Aprobado
                        </span>
                      )}
                    </div>
                    {registroExistente.observaciones && (
                      <p className="text-sm text-gray-600 mt-1">{registroExistente.observaciones}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!registroExistente.aprobado && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editarRegistro(registroExistente)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => aprobarRegistro(registroExistente.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aprobar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => eliminarRegistro(registroExistente.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded">
                    <div className="text-sm text-gray-600">Horas Totales</div>
                    <div className="text-2xl font-bold text-purple-700">
                      {registroExistente.totalHoras.toFixed(1)}h
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <Coffee className="h-4 w-4" />
                      Descuento Colación
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      -{registroExistente.descuentoColacion.toFixed(1)}h
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-sm text-gray-600">Horas Netas</div>
                    <div className="text-2xl font-bold text-green-700">
                      {registroExistente.totalHorasNetas.toFixed(1)}h
                    </div>
                  </div>
                </div>

                {/* Detalle de días */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Detalle por día:</h4>
                  <div className="space-y-1">
                    {registroExistente.diasTrabajados
                      .filter(dia => dia.horasTrabajadas > 0)
                      .map((dia, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                          <span className="font-medium">{dia.diaNombre}</span>
                          <span className="text-gray-600">
                            {dia.horaInicio} - {dia.horaFin}
                          </span>
                          <span className="font-semibold text-purple-700">
                            {dia.horasTrabajadas.toFixed(1)}h
                          </span>
                          {dia.eventoNombre && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {dia.eventoNombre}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No hay registro para esta semana</p>
              <Button onClick={crearNuevoRegistro} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Crear Registro Semanal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de registros */}
      {registros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {registros
                .filter(r => r.semana !== semanaActual)
                .slice(0, 5)
                .map(registro => (
                  <div
                    key={registro.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">Semana {registro.semana}</div>
                        <div className="text-sm text-gray-600">
                          {formatDisplayDate(registro.fechaInicio)} al {formatDisplayDate(registro.fechaFin)}
                        </div>
                      </div>
                      {registro.aprobado && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Aprobado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Horas Netas</div>
                        <div className="font-bold text-green-700">
                          {registro.totalHorasNetas.toFixed(1)}h
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSemanaActual(registro.semana);
                        }}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}