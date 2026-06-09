import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../../api/client';
import { AppButton, Card, ChoiceGroup, Field, IconButton, Sheet, styles as uiStyles } from '../../components/ui';
import { Screen } from '../../components/Screen';
import type { AdminData, Cliente } from '../../types';
import { colors, spacing } from '../../theme';
import { latestSubscriptionByClient, normalize, userStatus } from '../../utils/format';

type UserFormState = {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  id_plano: string;
  status: string;
};

export function UsersScreen({ data, loading, onRefresh }: { data: AdminData; loading: boolean; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Todos');
  const [perPage, setPerPage] = useState('8');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [details, setDetails] = useState<Cliente | null>(null);

  const assinaturaMap = latestSubscriptionByClient(data.assinaturas);
  const statuses = ['Todos', 'Ativo', 'Vencido', 'Cancelada', 'Sem plano', 'Desabilitado'];
  const filtered = useMemo(() => {
    return data.clientes.filter((cliente) => {
      const assinatura = assinaturaMap.get(cliente.id_cliente);
      const label = userStatus(cliente, assinatura);
      const matchesStatus = status === 'Todos' || label === status;
      const matchesQuery =
        !query || normalize(`${cliente.nome} ${cliente.email} ${cliente.cpf} ${cliente.telefone || ''} ${label}`).includes(normalize(query));
      return matchesStatus && matchesQuery;
    });
  }, [data.clientes, assinaturaMap, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / Number(perPage)));
  const pageItems = filtered.slice((page - 1) * Number(perPage), page * Number(perPage));

  function resetPage(next: () => void) {
    setPage(1);
    next();
  }

  async function remove(cliente: Cliente) {
    Alert.alert('Excluir usuario', `Deseja excluir ${cliente.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.send(`/clientes/${cliente.id_cliente}`, 'DELETE');
            onRefresh();
          } catch (error) {
            Alert.alert('Usuarios', error instanceof Error ? error.message : 'Nao foi possivel excluir.');
          }
        },
      },
    ]);
  }

  return (
    <Screen
      title="Usuarios"
      subtitle="Crie, edite, filtre e gerencie membros"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={<AppButton label="Novo usuario" icon="add" onPress={() => setEditing({} as Cliente)} />}
    >
      <Field label="Buscar" value={query} onChangeText={(value) => resetPage(() => setQuery(value))} placeholder="Nome, e-mail ou CPF" />
      <ChoiceGroup label="Status" value={status} onChange={(value) => resetPage(() => setStatus(value))} options={statuses} />
      <ChoiceGroup label="Itens por pagina" value={perPage} onChange={(value) => resetPage(() => setPerPage(value))} options={['5', '8', '12']} />

      <Text style={uiStyles.muted}>{filtered.length} usuarios encontrados</Text>
      {pageItems.map((cliente) => {
        const assinatura = assinaturaMap.get(cliente.id_cliente);
        const plano = data.planos.find((item) => item.id_plano === assinatura?.id_plano);
        return (
          <Card key={cliente.id_cliente}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontWeight: '700' }}>{cliente.nome}</Text>
                <Text style={uiStyles.muted}>{cliente.email}</Text>
                <Text style={uiStyles.muted}>{plano?.nome || 'Sem plano'} - {userStatus(cliente, assinatura)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <IconButton icon="eye-outline" label="Detalhes" onPress={() => setDetails(cliente)} />
                <IconButton icon="create-outline" label="Editar" onPress={() => setEditing(cliente)} />
                <IconButton icon="trash-outline" label="Excluir" onPress={() => remove(cliente)} />
              </View>
            </View>
          </Card>
        );
      })}

      <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }}>
        <AppButton label="Anterior" variant="ghost" disabled={page <= 1} onPress={() => setPage((value) => Math.max(1, value - 1))} />
        <Text style={[uiStyles.muted, { alignSelf: 'center' }]}>Pagina {page}/{totalPages}</Text>
        <AppButton label="Proxima" variant="ghost" disabled={page >= totalPages} onPress={() => setPage((value) => Math.min(totalPages, value + 1))} />
      </View>

      <UserForm data={data} cliente={editing} visible={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />
      <Sheet visible={Boolean(details)} title="Detalhes do usuario" onClose={() => setDetails(null)}>
        {details ? (
          <>
            <Card>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{details.nome}</Text>
              <Text style={uiStyles.muted}>CPF: {details.cpf}</Text>
              <Text style={uiStyles.muted}>E-mail: {details.email}</Text>
              <Text style={uiStyles.muted}>Telefone: {details.telefone || '-'}</Text>
            </Card>
            <AppButton label="Editar usuario" onPress={() => { setEditing(details); setDetails(null); }} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function UserForm({
  data,
  cliente,
  visible,
  onClose,
  onSaved,
}: {
  data: AdminData;
  cliente: Cliente | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const assinatura = cliente ? latestSubscriptionByClient(data.assinaturas).get(cliente.id_cliente) : undefined;
  const [form, setForm] = useState<UserFormState>({
    nome: cliente?.nome || '',
    cpf: cliente?.cpf || '',
    email: cliente?.email || '',
    telefone: cliente?.telefone || '',
    senha: '',
    id_plano: assinatura?.id_plano ? String(assinatura.id_plano) : 'Sem plano',
    status: assinatura?.status || 'Ativa',
  });

  React.useEffect(() => {
    const nextAssinatura = cliente ? latestSubscriptionByClient(data.assinaturas).get(cliente.id_cliente) : undefined;
    setForm({
      nome: cliente?.nome || '',
      cpf: cliente?.cpf || '',
      email: cliente?.email || '',
      telefone: cliente?.telefone || '',
      senha: '',
      id_plano: nextAssinatura?.id_plano ? String(nextAssinatura.id_plano) : 'Sem plano',
      status: nextAssinatura?.status || 'Ativa',
    });
  }, [cliente, data.assinaturas]);

  function patch(key: keyof UserFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function syncSubscription(idCliente: number) {
    if (form.id_plano === 'Sem plano') return;
    const current = latestSubscriptionByClient(data.assinaturas).get(idCliente);
    const payload = { id_plano: Number(form.id_plano), status: form.status, validade: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) };
    if (current) {
      await api.send(`/assinaturas/${current.id_assinatura}`, 'PUT', payload);
    } else {
      await api.send('/assinaturas', 'POST', { id_cliente: idCliente, id_plano: Number(form.id_plano), validade: payload.validade });
    }
  }

  async function save() {
    if (!form.nome || !form.email || (!cliente?.id_cliente && !form.senha)) {
      Alert.alert('Usuarios', 'Informe nome, e-mail e senha para novos usuarios.');
      return;
    }

    try {
      const payload = { nome: form.nome, cpf: form.cpf, email: form.email, telefone: form.telefone || null, senha: form.senha || '123456' };
      const saved = cliente?.id_cliente
        ? await api.send<Cliente>(`/clientes/${cliente.id_cliente}`, 'PUT', payload)
        : await api.send<Cliente>('/clientes', 'POST', payload);
      await syncSubscription(saved.id_cliente);
      onSaved();
    } catch (error) {
      Alert.alert('Usuarios', error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    }
  }

  return (
    <Sheet visible={visible} title={cliente?.id_cliente ? 'Editar usuario' : 'Novo usuario'} onClose={onClose}>
      <Field label="Nome" value={form.nome} onChangeText={(value) => patch('nome', value)} />
      <Field label="CPF" value={form.cpf} onChangeText={(value) => patch('cpf', value)} keyboardType="numeric" />
      <Field label="E-mail" value={form.email} onChangeText={(value) => patch('email', value)} keyboardType="email-address" />
      <Field label="Telefone" value={form.telefone} onChangeText={(value) => patch('telefone', value)} keyboardType="numeric" />
      <Field label="Senha" value={form.senha} onChangeText={(value) => patch('senha', value)} secureTextEntry />
      <ChoiceGroup label="Plano" value={form.id_plano} onChange={(value) => patch('id_plano', value)} options={['Sem plano', ...data.planos.map((plano) => String(plano.id_plano))]} />
      <Text style={uiStyles.muted}>Plano selecionado: {data.planos.find((item) => String(item.id_plano) === form.id_plano)?.nome || 'Sem plano'}</Text>
      <ChoiceGroup label="Status" value={form.status} onChange={(value) => patch('status', value)} options={['Ativa', 'Vencida', 'Cancelada']} />
      <AppButton label="Salvar usuario" onPress={save} />
    </Sheet>
  );
}
