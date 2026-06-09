import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api/client';
import { AppButton, Card, ChoiceGroup, Field, IconButton, Sheet, styles as uiStyles } from '../../components/ui';
import { Screen } from '../../components/Screen';
import type { AdminData, Notificacao } from '../../types';
import { colors, spacing } from '../../theme';
import { findById, formatDate, normalize } from '../../utils/format';

export function NotificationsScreen({
  data,
  loading,
  onRefresh,
  embedded = false,
}: {
  data: AdminData;
  loading: boolean;
  onRefresh: () => void;
  embedded?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Notificacao | null>(null);

  const filtered = useMemo(() => {
    return data.notificacoes.filter((item) => {
      const cliente = findById(data.clientes, 'id_cliente', item.id_cliente);
      const status = item.lida ? 'Lidas' : 'Nao lidas';
      const matchesFilter = filter === 'Todas' || filter === item.tipo || filter === status;
      const matchesQuery = !query || normalize(`${cliente?.nome || ''} ${item.tipo} ${item.corpo}`).includes(normalize(query));
      return matchesFilter && matchesQuery;
    });
  }, [data.notificacoes, data.clientes, filter, query]);

  const unread = data.notificacoes.filter((item) => !item.lida).length;

  async function markRead(item: Notificacao) {
    await api.send(`/notificacoes/${item.id_notificacao}/lida`, 'PATCH');
    onRefresh();
  }

  async function remove(item: Notificacao) {
    Alert.alert('Excluir notificacao', 'Deseja excluir esta notificacao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await api.send(`/notificacoes/${item.id_notificacao}`, 'DELETE');
          onRefresh();
        },
      },
    ]);
  }

  const content = (
    <>
      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{data.notificacoes.length}</Text>
        </Card>
        <Card style={[styles.summaryCard, styles.summaryHot]}>
          <Text style={styles.summaryLabel}>Nao lidas</Text>
          <Text style={styles.summaryValue}>{unread}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Lidas</Text>
          <Text style={styles.summaryValue}>{data.notificacoes.length - unread}</Text>
        </Card>
      </View>
      {embedded ? <AppButton label="Criar gatilho" icon="add" onPress={() => setCreating(true)} /> : null}
      <Field label="Buscar" value={query} onChangeText={setQuery} placeholder="Usuario, tipo ou mensagem" />
      <ChoiceGroup label="Filtro" value={filter} onChange={setFilter} options={['Todas', 'Nao lidas', 'Lidas', ...data.notificationTypes]} />
      {filtered.map((item) => {
        const cliente = findById(data.clientes, 'id_cliente', item.id_cliente);
        return (
          <Card key={item.id_notificacao} style={[styles.notificationCard, !item.lida && styles.notificationUnread]}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationIcon}>
                <Text style={styles.notificationIconText}>{item.lida ? 'i' : '!'}</Text>
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationTitleRow}>
                  <Text style={styles.notificationTitle}>{item.tipo}</Text>
                  <Text style={[styles.statusPill, !item.lida && styles.statusUnread]}>{item.lida ? 'Lida' : 'Nao lida'}</Text>
                </View>
                <Text style={uiStyles.muted}>{cliente?.nome || `Usuario #${item.id_cliente}`} - {formatDate(item.criado_em)}</Text>
                <Text style={styles.notificationBody}>{item.corpo}</Text>
              </View>
              <View style={styles.notificationActions}>
                {!item.lida ? <IconButton icon="checkmark-outline" label="Marcar como lida" onPress={() => markRead(item)} /> : null}
                <IconButton icon="eye-outline" label="Detalhes" onPress={() => setDetail(item)} />
                <IconButton icon="trash-outline" label="Excluir" onPress={() => remove(item)} />
              </View>
            </View>
          </Card>
        );
      })}

      <CreateNotificationForm data={data} visible={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); onRefresh(); }} />
      <Sheet visible={Boolean(detail)} title="Detalhes da notificacao" onClose={() => setDetail(null)}>
        {detail ? (
          <>
            <Card>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{detail.tipo}</Text>
              <Text style={uiStyles.muted}>{findById(data.clientes, 'id_cliente', detail.id_cliente)?.nome || `Usuario #${detail.id_cliente}`}</Text>
              <Text style={uiStyles.muted}>{formatDate(detail.criado_em)} - {detail.lida ? 'Lida' : 'Nao lida'}</Text>
              <Text style={{ color: colors.inkSoft }}>{detail.corpo}</Text>
            </Card>
            {!detail.lida ? <AppButton label="Marcar como lida" onPress={() => { markRead(detail); setDetail(null); }} /> : null}
          </>
        ) : null}
      </Sheet>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Screen
      title="Notificacoes"
      subtitle="Crie gatilhos, leia e acompanhe alertas"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={<AppButton label="Criar gatilho" icon="add" onPress={() => setCreating(true)} />}
    >
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryGrid: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: { flex: 1, padding: spacing.md },
  summaryHot: { borderColor: colors.blue200, backgroundColor: '#F4F8F5' },
  summaryLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  summaryValue: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 4 },
  notificationCard: { padding: spacing.md },
  notificationUnread: { borderColor: colors.blue200, backgroundColor: '#F4F8F5' },
  notificationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  notificationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconText: { color: colors.inkSoft, fontWeight: '900' },
  notificationContent: { flex: 1, gap: 4 },
  notificationTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  notificationTitle: { color: colors.ink, fontWeight: '800', flex: 1 },
  statusPill: {
    borderRadius: 999,
    backgroundColor: colors.blue50,
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusUnread: { backgroundColor: colors.success, color: colors.blue50 },
  notificationBody: { color: colors.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 4 },
  notificationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end', maxWidth: 96 },
});

function CreateNotificationForm({
  data,
  visible,
  onClose,
  onSaved,
}: {
  data: AdminData;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [clienteIds, setClienteIds] = useState<number[]>([]);
  const [tipo, setTipo] = useState(data.notificationTypes[0] || 'Alerta');
  const [corpo, setCorpo] = useState('');

  function toggleCliente(id: number) {
    setClienteIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function save() {
    if (!clienteIds.length || !corpo.trim()) {
      Alert.alert('Notificacoes', 'Selecione usuarios e informe a mensagem.');
      return;
    }
    try {
      await Promise.all(clienteIds.map((id_cliente) => api.send('/notificacoes', 'POST', {
        id_cliente,
        tipo,
        corpo,
        lida: false,
        criado_em: new Date().toISOString().slice(0, 10),
      })));
      onSaved();
    } catch (error) {
      Alert.alert('Notificacoes', error instanceof Error ? error.message : 'Nao foi possivel criar.');
    }
  }

  return (
    <Sheet visible={visible} title="Criar gatilho" onClose={onClose}>
      <Text style={uiStyles.fieldLabel}>Usuarios</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {data.clientes.map((cliente) => (
          <AppButton
            key={cliente.id_cliente}
            label={cliente.nome}
            variant={clienteIds.includes(cliente.id_cliente) ? 'primary' : 'ghost'}
            onPress={() => toggleCliente(cliente.id_cliente)}
          />
        ))}
      </View>
      <ChoiceGroup label="Tipo" value={tipo} onChange={setTipo} options={data.notificationTypes.length ? data.notificationTypes : [tipo]} />
      <Field label="Mensagem" value={corpo} onChangeText={setCorpo} multiline />
      <AppButton label="Enviar notificacao" onPress={save} />
    </Sheet>
  );
}
