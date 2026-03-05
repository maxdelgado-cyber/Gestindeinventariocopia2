import { Client } from '../types/allegra';

// Versión de clientes - incrementar cuando se modifiquen clientes iniciales
export const CLIENTS_VERSION = 2;

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'CLI-001',
    nombre: 'María González',
    tipoCliente: 'Persona',
    rut: '18.234.567-8',
    contactoResponsable: 'María González',
    telefono: '+56 9 8765 4321',
    email: 'maria.gonzalez@email.com',
    direccion: 'Av. Las Condes 1234',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
    eventosRealizados: 1,
    valorTotalEventos: 850000,
    ultimoEvento: new Date().toISOString(),
    notas: 'Cliente nuevo - Evento cumpleaños',
  },
];