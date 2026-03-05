import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authAPI } from '../lib/api';
import { AuditLog, LoginAttempt } from '../types/allegra';
import { INITIAL_INVENTORY, INITIAL_EVENTS, INITIAL_VEHICLES, INITIAL_WORKERS, INVENTORY_VERSION, EVENTS_VERSION, VEHICLES_VERSION, WORKERS_VERSION } from '../data/initialData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Shield, FileText, Clock } from 'lucide-react';

export function ConfigurationPage() {
  const [profile, setProfile] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadAuditLogs();
    loadLoginAttempts();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await authAPI.getProfile();
      if (result.profile) {
        setProfile(result.profile);
        setUsername(result.profile.username || '');
        setEmail(result.profile.email || '');
      }
    } catch (error: any) {
      // Only log if it's not a backend offline error
      if (error.message !== 'BACKEND_OFFLINE') {
        console.error('Error cargando perfil:', error);
      }
      
      // Use local fallback profile
      const localProfile = {
        username: 'admin',
        email: 'admin@allegra.com',
        company: 'Allegra Productora de Audio',
        createdAt: new Date().toISOString(),
      };
      setProfile(localProfile);
      setUsername('admin');
      setEmail('admin@allegra.com');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const result = await authAPI.getAuditLogs();
      setAuditLogs(result.logs || []);
    } catch (error: any) {
      // Only log if it's not a backend offline error
      if (error.message !== 'BACKEND_OFFLINE') {
        console.error('Error cargando logs de auditoría:', error);
      }
      // Use empty array as fallback
      setAuditLogs([]);
    }
  };

  const loadLoginAttempts = async () => {
    try {
      const result = await authAPI.getLoginAttempts();
      setLoginAttempts(result.attempts || []);
    } catch (error: any) {
      // Only log if it's not a backend offline error
      if (error.message !== 'BACKEND_OFFLINE') {
        console.error('Error cargando intentos de acceso:', error);
      }
      // Use empty array as fallback
      setLoginAttempts([]);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await authAPI.updateProfile({ password: newPassword });
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Error al actualizar contraseña. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.updateProfile({ username, email });
      toast.success('Perfil actualizado correctamente');
      await loadProfile(); // Reload to see changes
    } catch (error) {
      toast.error('Error al actualizar perfil. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('⚠️ ¿Estás seguro de que deseas reiniciar todos los datos a los valores iniciales?\n\nEsta acción:\n✓ Cargará el inventario completo actualizado\n✓ Restablecerá eventos, vehículos y trabajadores\n✓ Eliminará datos personalizados\n\n¿Deseas continuar?')) {
      try {
        // Reset all data to initial values
        localStorage.setItem('allegra_inventory', JSON.stringify(INITIAL_INVENTORY));
        localStorage.setItem('allegra_events', JSON.stringify(INITIAL_EVENTS));
        localStorage.setItem('allegra_vehicles', JSON.stringify(INITIAL_VEHICLES));
        localStorage.setItem('allegra_workers', JSON.stringify(INITIAL_WORKERS));
        
        toast.success('✅ Datos reiniciados correctamente. Recarga la página para ver los cambios.');
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast.error('Error al reiniciar datos');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-gray-600 mt-1">Administra tu perfil y seguridad del sistema</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="audit" onClick={loadAuditLogs}>
            <FileText className="mr-2 h-4 w-4" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="access" onClick={loadLoginAttempts}>
            <Clock className="mr-2 h-4 w-4" />
            Accesos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información del Perfil</CardTitle>
              <CardDescription>
                Actualiza tus datos personales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value={profile?.company || ''} disabled />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="No requerida para cambio"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Historial de acciones realizadas en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay registros de auditoría</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLogs.slice(0, 50).map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{log.action}</p>
                          <p className="text-sm text-gray-600">{log.details}</p>
                          <p className="text-xs text-gray-500">Módulo: {log.module}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Intentos de Acceso</CardTitle>
              <CardDescription>
                Registro de intentos de inicio de sesión
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginAttempts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay registros de acceso</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loginAttempts.slice(0, 50).map((attempt, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className={`font-semibold text-sm ${attempt.success ? 'text-green-700' : 'text-red-700'}`}>
                          {attempt.success ? '✓ Acceso exitoso' : '✗ Acceso fallido'}
                        </p>
                        {attempt.ip && <p className="text-xs text-gray-500">IP: {attempt.ip}</p>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.timestamp).toLocaleString('es-CL')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button
          type="button"
          onClick={handleResetData}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Reiniciar Datos
        </Button>
      </div>
    </div>
  );
}