import image_d7d1b12b2bde115dd66c84ac6a4de6f408515848 from 'figma:asset/d7d1b12b2bde115dd66c84ac6a4de6f408515848.png'
import image_e752e36fb2552ae449f7d3cc41c88ad05697217c from 'figma:asset/e752e36fb2552ae449f7d3cc41c88ad05697217c.png'
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Music, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(password);
      if (!success) {
        setError('Contraseña incorrecta. Por favor, intenta nuevamente.');
      }
      // If success, the auth context will handle the redirect
    } catch (err) {
      // Should not reach here as auth context handles all errors gracefully
      console.error('Error inesperado en login:', err);
      setError('Error inesperado. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl shadow-purple-500/20">
              <img src={image_d7d1b12b2bde115dd66c84ac6a4de6f408515848} alt="Allegra Logo" className="h-20 w-20" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Allegra</h1>
        </div>

        {/* Login Card */}
        <Card className="border-white/20 bg-white/10 backdrop-blur-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Acceso Administrador</CardTitle>
            <CardDescription className="text-center text-indigo-200">
              Ingresa tu contraseña para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-indigo-300" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-indigo-300 focus:bg-white/30"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-indigo-300 mt-6 text-sm">
          Sistema de Gestión Integral © 2026 Allegra
        </p>
      </div>
    </div>
  );
}