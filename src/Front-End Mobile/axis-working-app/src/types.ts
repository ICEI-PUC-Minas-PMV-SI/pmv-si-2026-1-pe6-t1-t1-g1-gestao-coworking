// ─────────────────────────────────────────────────────────────
//  Axis Work — tipos compartilhados (admin + usuário)
// ─────────────────────────────────────────────────────────────

export type ID = number;

export type Cliente = {
  id_cliente: ID;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  ativo?: boolean;
  is_admin?: boolean;
  foto_perfil?: string | null;
};

export type Sala = {
  id_sala: ID;
  nome: string;
  capacidade: number;
  tipo: string;
  descricao?: string | null;
  recursos?: string | null;
  criado_em: string;
  ativa: boolean;
  valor_hora?: number;
  ambiente?: string;
  andar?: string;
  fotos?: string[];
};

export type Plano = {
  id_plano: ID;
  nome: string;
  acesso: string;
  preco: number | string;
  descricao?: string;
  beneficios?: string[] | string;
};

export type Assinatura = {
  id_assinatura: ID;
  id_cliente?: ID | null;
  id_plano?: ID | null;
  status: string;
  validade: string;
  feita_em: string;
};

export type Reserva = {
  id_reserva: ID;
  id_cliente?: ID | null;
  id_sala?: ID | null;
  status: string;
  feito_em: string;
  entrada: string;
  saida: string;
};

export type Avaliacao = {
  id_avaliacao: ID;
  id_cliente: ID;
  id_sala: ID;
  id_reserva: ID;
  nota: number;
  corpo?: string | null;
  criado_em: string;
  resposta_admin?: string | null;
  respondido_em?: string | null;
  nome_usuario?: string;
  nome_sala?: string;
  tipo_sala?: string;
};

export type Notificacao = {
  id_notificacao: ID;
  id_cliente: ID;
  corpo: string;
  tipo: string;
  lida: boolean;
  criado_em: string;
};

export type AdminData = {
  clientes: Cliente[];
  salas: Sala[];
  planos: Plano[];
  assinaturas: Assinatura[];
  reservas: Reserva[];
  avaliacoes: Avaliacao[];
  notificacoes: Notificacao[];
  notificationTypes: string[];
  roomTypes: string[];
};

export type ScreenKey =
  | 'dashboard'
  | 'reservas'
  | 'usuarios'
  | 'salas'
  | 'planos'
  | 'avaliacoes';
