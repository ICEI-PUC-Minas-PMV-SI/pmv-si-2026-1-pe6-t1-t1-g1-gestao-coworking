import { adminApi } from './client';
import type {
  AdminData, Assinatura, Avaliacao, Cliente,
  Notificacao, Plano, Reserva, Sala,
} from '../types';

export const emptyAdminData: AdminData = {
  clientes: [], salas: [], planos: [], assinaturas: [],
  reservas: [], avaliacoes: [], notificacoes: [],
  notificationTypes: [], roomTypes: [],
};

export async function loadAdminData(): Promise<AdminData> {
  const [clientes, salas, planos, assinaturas, reservas, avaliacoes, notificacoes, notificationTypes, roomTypes] =
    await Promise.all([
      adminApi.get<Cliente[]>('/clientes'),
      adminApi.get<Sala[]>('/salas'),
      adminApi.get<Plano[]>('/planos'),
      adminApi.get<Assinatura[]>('/assinaturas'),
      adminApi.get<Reserva[]>('/reservas?limit=100'),
      adminApi.get<Avaliacao[]>('/avaliacoes'),
      adminApi.get<Notificacao[]>('/notificacoes'),
      adminApi.get<string[]>('/notificacoes/tipos'),
      adminApi.get<string[]>('/salas/tipos'),
    ]);

  return { clientes, salas, planos, assinaturas, reservas, avaliacoes, notificacoes, notificationTypes, roomTypes };
}

export async function bootstrapAndLoad(): Promise<AdminData> {
  await adminApi.bootstrap();
  return loadAdminData();
}
