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

// ── Helpers de data/hora (fluxo de reservas do usuário) ──────

/** Extrai a parte de data (YYYY-MM-DD) de uma string ISO ou datetime. */
export function dateOnly(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

/** Extrai a hora (HH:MM) de uma string ISO ou datetime. */
export function timePart(value?: string | null) {
  if (!value) return '';
  const timeSection = value.includes('T') ? value.split('T')[1] : value;
  return (timeSection || '').slice(0, 5);
}

/** Faixa de horário "HH:MM - HH:MM" a partir de entrada/saída ISO. */
export function timeRange(entrada?: string | null, saida?: string | null) {
  const inicio = timePart(entrada);
  const fim = timePart(saida);
  if (!inicio && !fim) return '-';
  return `${inicio || '--:--'} - ${fim || '--:--'}`;
}

/** Soma uma hora a um horário "HH:MM" (limitado a 23h). */
export function addOneHour(time: string) {
  const [hour, minute] = (time || '09:00').split(':').map(Number);
  const next = Math.min((Number.isFinite(hour) ? hour : 9) + 1, 23);
  return `${String(next).padStart(2, '0')}:${String(Number.isFinite(minute) ? minute : 0).padStart(2, '0')}`;
}

export function normalize(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Pr\u00f3ximos `count` dias (a partir de `from`, inclusive) como chips de sele\u00e7\u00e3o.
 * O `iso` \u00e9 montado a partir dos componentes locais para evitar o deslocamento
 * de fuso que `toISOString()` causaria.
 */
export function upcomingDays(count = 14, from: Date = new Date()) {
  const days: { iso: string; label: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
      .format(d)
      .replace(/\./g, '');
    days.push({ iso, label });
  }
  return days;
}

/** Lista de hor\u00e1rios "HH:00" de `start` at\u00e9 `end` (inclusive). Ex.: 07\u219221. */
export function hourRange(start = 7, end = 21) {
  const horas: string[] = [];
  for (let h = start; h <= end; h += 1) horas.push(`${String(h).padStart(2, '0')}:00`);
  return horas;
}

/**
 * N\u00edvel de acesso de um plano/sala (1 a 4) extra\u00eddo do prefixo num\u00e9rico do
 * texto \u2014 ex.: "4 Sala de Reuni\u00e3o" \u2192 4. Quanto maior, mais "superior".
 * `Plano.acesso` e `Sala.tipo` usam a mesma conven\u00e7\u00e3o.
 */
export function tierFromAccess(value?: string | null) {
  const n = parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
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
