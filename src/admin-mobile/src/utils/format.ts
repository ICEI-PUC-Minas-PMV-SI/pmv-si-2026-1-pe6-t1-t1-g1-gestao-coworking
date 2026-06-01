import type { Assinatura, Cliente, Plano, Reserva, Sala } from '../types';

export const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export function formatMoney(value: number | string | undefined | null) {
  return money.format(Number(value || 0));
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const [datePart] = value.split('T');
  const date = new Date(`${datePart}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(date)
    .replace('.', '');
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function normalize(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function latestSubscriptionByClient(assinaturas: Assinatura[]) {
  const map = new Map<number, Assinatura>();
  assinaturas.forEach((assinatura) => {
    if (!assinatura.id_cliente) return;
    const current = map.get(assinatura.id_cliente);
    if (!current || assinatura.id_assinatura > current.id_assinatura) {
      map.set(assinatura.id_cliente, assinatura);
    }
  });
  return map;
}

export function findById<T extends Record<string, unknown>>(items: T[], key: keyof T, id?: number | null) {
  return items.find((item) => Number(item[key]) === Number(id));
}

export function userStatus(cliente: Cliente, assinatura?: Assinatura) {
  if (cliente.ativo === false) return 'Desabilitado';
  if (!assinatura) return 'Sem plano';
  if (assinatura.status === 'Ativa') return 'Ativo';
  if (assinatura.status === 'Vencida') return 'Vencido';
  return assinatura.status;
}

export function roomLabel(sala?: Sala | null) {
  return sala ? `${sala.nome} - ${sala.tipo}` : 'Sala nao informada';
}

export function userLabel(cliente?: Cliente | null) {
  return cliente ? `${cliente.nome} - ${cliente.email}` : 'Usuario nao informado';
}

export function reservationLabel(reserva: Reserva, clientes: Cliente[], salas: Sala[]) {
  const cliente = findById(clientes, 'id_cliente', reserva.id_cliente) as Cliente | undefined;
  const sala = findById(salas, 'id_sala', reserva.id_sala) as Sala | undefined;
  return `${cliente?.nome || 'Usuario'} em ${sala?.nome || 'Sala'}`;
}

export function planRevenue(planos: Plano[], assinaturas: Assinatura[]) {
  return planos
    .map((plano) => {
      const membros = assinaturas.filter(
        (assinatura) => assinatura.id_plano === plano.id_plano && assinatura.status === 'Ativa',
      ).length;
      const receita = membros * Number(plano.preco || 0);
      return { plano, membros, receita };
    })
    .sort((a, b) => b.receita - a.receita);
}
