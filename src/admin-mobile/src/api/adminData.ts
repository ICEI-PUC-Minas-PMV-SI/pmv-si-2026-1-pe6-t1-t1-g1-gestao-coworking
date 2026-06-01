import { api } from './client';
import type { AdminData, Assinatura, Avaliacao, Cliente, Notificacao, Plano, Reserva, Sala } from '../types';

export const emptyAdminData: AdminData = {
  clientes: [],
  salas: [],
  planos: [],
  assinaturas: [],
  reservas: [],
  avaliacoes: [],
  notificacoes: [],
  notificationTypes: [],
  roomTypes: [],
};

export async function loadAdminData(): Promise<AdminData> {
  const [clientes, salas, planos, assinaturas, reservas, avaliacoes, notificacoes, notificationTypes, roomTypes] =
    await Promise.all([
      api.get<Cliente[]>('/clientes'),
      api.get<Sala[]>('/salas'),
      api.get<Plano[]>('/planos'),
      api.get<Assinatura[]>('/assinaturas'),
      api.get<Reserva[]>('/reservas?limit=100'),
      api.get<Avaliacao[]>('/avaliacoes'),
      api.get<Notificacao[]>('/notificacoes'),
      api.get<string[]>('/notificacoes/tipos'),
      api.get<string[]>('/salas/tipos'),
    ]);

  return { clientes, salas, planos, assinaturas, reservas, avaliacoes, notificacoes, notificationTypes, roomTypes };
}

export async function bootstrapAndLoad(): Promise<AdminData> {
  await api.bootstrap();
  return loadAdminData();
}
