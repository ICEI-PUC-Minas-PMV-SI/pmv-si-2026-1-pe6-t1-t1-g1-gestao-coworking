/**
 * NotificacoesScreen — notificações do usuário logado.
 *
 * Consome /notificacoes/cliente/{id} (já filtra por cliente no backend) e
 * permite marcar uma ou todas como lidas (PATCH /notificacoes/{id}/lida).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, spacing } from '../../theme';
import { formatDate } from '../../utils/format';
import type { Notificacao } from '../../types';

export function NotificacoesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id_cliente) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await userApi.get<Notificacao[]>(`/notificacoes/cliente/${user.id_cliente}`);
      setItems(data);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id_cliente]);

  useEffect(() => { load(); }, [load]);

  async function marcarLida(n: Notificacao) {
    try {
      await userApi.send(`/notificacoes/${n.id_notificacao}/lida`, 'PATCH');
      setItems((cur) => cur.map((i) => (i.id_notificacao === n.id_notificacao ? { ...i, lida: true } : i)));
    } catch (err) {
      console.error('Erro ao marcar notificação:', err);
    }
  }

  async function marcarTodasLidas() {
    const naoLidas = items.filter((i) => !i.lida);
    await Promise.all(
      naoLidas.map((n) => userApi.send(`/notificacoes/${n.id_notificacao}/lida`, 'PATCH').catch(() => null)),
    );
    setItems((cur) => cur.map((i) => ({ ...i, lida: true })));
  }

  if (loading) return <LoadingState />;

  const naoLidas = items.filter((i) => !i.lida).length;

  return (
    <>
      <Header title="Notificações" subtitle={naoLidas ? `${naoLidas} não lida(s)` : 'Tudo em dia'} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {naoLidas > 0 ? (
          <PrimaryButton label="Marcar todas como lidas" variant="ghost" onPress={marcarTodasLidas} />
        ) : null}

        {items.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Você não possui notificações.</Text>
          </Card>
        ) : (
          items.map((n) => (
            <Card key={n.id_notificacao} style={!n.lida ? styles.cardUnread : undefined}>
              <View style={styles.row}>
                <View style={[styles.marker, n.lida && styles.markerRead]} />
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.tipo}>{n.tipo}</Text>
                    {!n.lida ? <Text style={styles.badge}>Nova</Text> : null}
                  </View>
                  <Text style={styles.corpo}>{n.corpo}</Text>
                  <Text style={styles.data}>{formatDate(n.criado_em)}</Text>
                  {!n.lida ? (
                    <View style={styles.mt}>
                      <PrimaryButton label="Marcar como lida" variant="ghost" onPress={() => marcarLida(n)} />
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  empty:      { color: colors.muted, textAlign: 'center' },
  cardUnread: { borderColor: colors.blue200, backgroundColor: colors.successBg },
  row:        { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  marker:     { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: colors.navy },
  markerRead: { backgroundColor: colors.bluePale },
  body:       { flex: 1, gap: 4 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  tipo:       { fontSize: 15, fontWeight: '800', color: colors.ink, flex: 1 },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  corpo:      { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  data:       { fontSize: 12, color: colors.muted },
  mt:         { marginTop: spacing.xs, alignSelf: 'flex-start' },
});
