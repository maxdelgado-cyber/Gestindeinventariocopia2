import { AlertCircle, AlertTriangle, Info, Package, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { StockAlert } from '../lib/availabilityEngine';

interface AlertsPanelProps {
  alerts: StockAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const alertsByGravity = {
    critica: alerts.filter(a => a.gravedad === 'critica'),
    alta: alerts.filter(a => a.gravedad === 'alta'),
    media: alerts.filter(a => a.gravedad === 'media'),
    baja: alerts.filter(a => a.gravedad === 'baja'),
  };

  const getAlertIcon = (tipo: StockAlert['tipo']) => {
    switch (tipo) {
      case 'SIN_STOCK':
        return <AlertCircle className="h-5 w-5" />;
      case 'STOCK_BAJO':
        return <Package className="h-5 w-5" />;
      case 'CONFLICTO_RESERVA':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (gravedad: StockAlert['gravedad']): 'default' | 'destructive' => {
    return gravedad === 'critica' || gravedad === 'alta' ? 'destructive' : 'default';
  };

  const getGravedadBadge = (gravedad: StockAlert['gravedad']) => {
    const variants = {
      critica: 'bg-red-600 text-white hover:bg-red-700',
      alta: 'bg-orange-500 text-white hover:bg-orange-600',
      media: 'bg-yellow-500 text-black hover:bg-yellow-600',
      baja: 'bg-blue-500 text-white hover:bg-blue-600',
    };

    const labels = {
      critica: 'CRÍTICA',
      alta: 'ALTA',
      media: 'MEDIA',
      baja: 'BAJA',
    };

    return (
      <Badge className={variants[gravedad]}>
        {labels[gravedad]}
      </Badge>
    );
  };

  const totalAlertas = alerts.length;

  if (totalAlertas === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-600" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-green-700">
              ¡Todo en orden!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              No hay alertas activas en este momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertas del Sistema
          </CardTitle>
          <Badge variant="outline" className="text-base font-semibold">
            {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {/* Alertas Críticas */}
            {alertsByGravity.critica.map((alert, index) => (
              <Alert key={`critica-${index}`} variant="destructive">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.tipo)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTitle className="mb-0">
                        {alert.equipoNombre}
                      </AlertTitle>
                      {getGravedadBadge(alert.gravedad)}
                    </div>
                    <AlertDescription>
                      {alert.mensaje}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}

            {/* Alertas Altas */}
            {alertsByGravity.alta.map((alert, index) => (
              <Alert key={`alta-${index}`} variant="destructive">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.tipo)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTitle className="mb-0">
                        {alert.equipoNombre}
                      </AlertTitle>
                      {getGravedadBadge(alert.gravedad)}
                    </div>
                    <AlertDescription>
                      {alert.mensaje}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}

            {/* Alertas Medias */}
            {alertsByGravity.media.map((alert, index) => (
              <Alert key={`media-${index}`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.tipo)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTitle className="mb-0">
                        {alert.equipoNombre}
                      </AlertTitle>
                      {getGravedadBadge(alert.gravedad)}
                    </div>
                    <AlertDescription>
                      {alert.mensaje}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}

            {/* Alertas Bajas */}
            {alertsByGravity.baja.map((alert, index) => (
              <Alert key={`baja-${index}`}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.tipo)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTitle className="mb-0">
                        {alert.equipoNombre}
                      </AlertTitle>
                      {getGravedadBadge(alert.gravedad)}
                    </div>
                    <AlertDescription>
                      {alert.mensaje}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
