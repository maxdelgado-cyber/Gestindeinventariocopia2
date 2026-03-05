import image_d7d1b12b2bde115dd66c84ac6a4de6f408515848 from 'figma:asset/d7d1b12b2bde115dd66c84ac6a4de6f408515848.png'
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, Outlet } from 'react-router';
import { Button } from './ui/button';
import { 
  Music, 
  Calendar, 
  Package, 
  Truck, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  PackageCheck,
  PackageX,
  Building2
} from 'lucide-react';
import { cn } from './ui/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/eventos', label: 'Eventos', icon: Calendar },
  { path: '/clientes', label: 'Clientes', icon: Building2 },
  { path: '/inventario', label: 'Inventario', icon: Package },
  { path: '/montaje', label: 'Montaje', icon: PackageCheck },
  { path: '/desmontaje', label: 'Desmontaje', icon: PackageX },
  { path: '/vehiculos', label: 'Vehículos', icon: Truck },
  { path: '/trabajadores', label: 'Trabajadores', icon: Users },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

export function MainLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-purple-800 to-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
            <img src={image_d7d1b12b2bde115dd66c84ac6a4de6f408515848} alt="Allegra Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Allegra</h1>
              <p className="text-xs text-purple-200">Sistema de Gestión</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="font-semibold">Administrador</p>
              <p className="text-xs text-purple-200">Sistema Allegra</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-0 left-0 h-screen bg-white border-r shadow-lg transition-transform duration-300 z-40",
            "w-64 flex flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex-1 overflow-y-auto py-6 mt-16 lg:mt-0">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="border-t p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <p className="text-xs text-gray-600 text-center">
              © 2026 Allegra
            </p>
            <p className="text-xs text-gray-500 text-center">
              v1.0.0
            </p>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}