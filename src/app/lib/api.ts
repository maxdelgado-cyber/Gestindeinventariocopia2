import { projectId, publicAnonKey } from '/utils/supabase/info';
import { 
  Event, 
  InventoryItem, 
  Vehicle, 
  Worker, 
  Client,
  AuditLog, 
  LoginAttempt,
  AdminProfile 
} from '../types/allegra';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-787f7306`;

// Flag to track if backend is available
let backendAvailable: boolean | null = null;
let backendCheckAttempted = false;

// Check if backend is available
async function checkBackendHealth(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  
  if (!backendCheckAttempted) {
    backendCheckAttempted = true;
    console.log('🔍 Verificando disponibilidad del backend...');
  }
  
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    backendAvailable = response.ok;
    if (backendAvailable) {
      console.log('✅ Backend conectado y disponible');
    } else {
      console.log('💾 Modo local activado - Usando almacenamiento local');
    }
    return backendAvailable;
  } catch (error) {
    console.log('💾 Modo local activado - Usando almacenamiento local');
    backendAvailable = false;
    return false;
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Check backend availability
  const isAvailable = await checkBackendHealth();
  if (!isAvailable) {
    throw new Error('BACKEND_OFFLINE');
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    backendAvailable = false; // Reset flag on error
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: async (password: string) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  getProfile: async () => {
    return fetchAPI('/auth/profile');
  },

  updateProfile: async (updates: any) => {
    return fetchAPI('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  getAuditLogs: async () => {
    return fetchAPI('/auth/audit-logs');
  },

  getLoginAttempts: async () => {
    return fetchAPI('/auth/login-attempts');
  },
};

// Data API
export const dataAPI = {
  get: async (key: string) => {
    return fetchAPI(`/data/${key}`);
  },

  save: async (key: string, data: any) => {
    return fetchAPI(`/data/${key}`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },
};

// Specific data APIs
export const eventsAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('events');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return []; // Return empty array for offline mode
      }
      throw error;
    }
  },
  save: async (events: any[]) => {
    try {
      return await dataAPI.save('events', events);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { success: true }; // Silently succeed in offline mode
      }
      throw error;
    }
  },
};

export const inventoryAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('inventory');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (inventory: any[]) => {
    try {
      return await dataAPI.save('inventory', inventory);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { success: true };
      }
      throw error;
    }
  },
};

export const vehiclesAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('vehicles');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (vehicles: any[]) => {
    try {
      return await dataAPI.save('vehicles', vehicles);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { success: true };
      }
      throw error;
    }
  },
};

export const workersAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('workers');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (workers: any[]) => {
    try {
      // Save to localStorage
      localStorage.setItem('allegra_workers', JSON.stringify(workers));
      return await dataAPI.save('workers', workers);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        // Already saved to localStorage above
        return { success: true };
      }
      throw error;
    }
  },
  create: async (workerData: any) => {
    try {
      const workers = await workersAPI.getAll();
      const newWorker = {
        ...workerData,
        id: `w-${Date.now()}`,
        fechaIngreso: new Date().toISOString().split('T')[0],
        historialEventos: [],
        anotaciones: [],
      };
      const updated = [...workers, newWorker];
      
      // Save to localStorage
      localStorage.setItem('allegra_workers', JSON.stringify(updated));
      
      await workersAPI.save(updated);
      return newWorker;
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        // Handle locally
        const localWorkers = JSON.parse(localStorage.getItem('allegra_workers') || '[]');
        const newWorker = {
          ...workerData,
          id: `w-${Date.now()}`,
          fechaIngreso: new Date().toISOString().split('T')[0],
          historialEventos: [],
          anotaciones: [],
        };
        const updated = [...localWorkers, newWorker];
        localStorage.setItem('allegra_workers', JSON.stringify(updated));
        return newWorker;
      }
      throw error;
    }
  },
  update: async (id: string, workerData: any) => {
    try {
      const workers = await workersAPI.getAll();
      const index = workers.findIndex((w: any) => w.id === id);
      if (index === -1) throw new Error('Trabajador no encontrado');
      workers[index] = { ...workers[index], ...workerData };
      
      // Save to localStorage
      localStorage.setItem('allegra_workers', JSON.stringify(workers));
      
      await workersAPI.save(workers);
      return workers[index];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { ...workerData, id };
      }
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const workers = await workersAPI.getAll();
      const filtered = workers.filter((w: any) => w.id !== id);
      await workersAPI.save(filtered);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return; // Silently succeed
      }
      throw error;
    }
  },
};

export const clientsAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('clients');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (clients: any[]) => {
    try {
      // Save to localStorage
      localStorage.setItem('allegra_clients', JSON.stringify(clients));
      return await dataAPI.save('clients', clients);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        // Already saved to localStorage above
        return { success: true };
      }
      throw error;
    }
  },
};

export const montajesAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('montajes');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (montajes: any[]) => {
    try {
      return await dataAPI.save('montajes', montajes);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { success: true };
      }
      throw error;
    }
  },
};

export const desmontajesAPI = {
  getAll: async () => {
    try {
      const result = await dataAPI.get('desmontajes');
      return result.data || [];
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return [];
      }
      throw error;
    }
  },
  save: async (desmontajes: any[]) => {
    try {
      return await dataAPI.save('desmontajes', desmontajes);
    } catch (error) {
      if (error.message === 'BACKEND_OFFLINE') {
        return { success: true };
      }
      throw error;
    }
  },
};