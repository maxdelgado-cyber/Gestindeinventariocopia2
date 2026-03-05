import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { EventsPage } from './pages/EventsPage';
import { InventoryPage } from './pages/InventoryPage';
import { MontajePage } from './pages/MontajePage';
import { DesmontajePage } from './pages/DesmontajePage';
import { VehiclesPage } from './pages/VehiclesPage';
import { WorkersPage } from './pages/WorkersPage';
import { ClientsPage } from './pages/ClientsPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { EventDetailPage } from './pages/EventDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        Component: MainLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'eventos', Component: EventsPage },
          { path: 'eventos/:eventId', Component: EventDetailPage },
          { path: 'inventario', Component: InventoryPage },
          { path: 'montaje', Component: MontajePage },
          { path: 'desmontaje', Component: DesmontajePage },
          { path: 'vehiculos', Component: VehiclesPage },
          { path: 'trabajadores', Component: WorkersPage },
          { path: 'clientes', Component: ClientsPage },
          { path: 'configuracion', Component: ConfigurationPage },
        ],
      },
    ],
  },
]);
