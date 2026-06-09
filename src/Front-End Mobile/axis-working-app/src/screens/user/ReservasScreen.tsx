/**
 * ReservasScreen — lista de reservas do usuário logado.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, radius, spacing } from '../../theme';

type Reserva = {
  id_reserva: number;
  id_sala: number;
  nome_sala?: string;
  status: string;
  entrada: string;
  saida: string;
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Confirmada: { bg: colors.successBg, text: colors.success },
  Pendente:   { bg: '#FDF5E6',        text: colors.warn    },
  Cancelada:  { bg: colors.dangerBg,  text: colors.danger  },
  Finalizada: { bg: colors.blueGhost, text: colors.muted   },
};

export function ReservasScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id_cliente) return;
    try {
      const data = await userApi.get<Reserva[]>(`/api/reservas?id_cliente=${user.id_cliente}`);
      setReservas(data.sort((a, b) => new Date(b.entrada).getTime() - new Date(a.entrada).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const fmt = (iso: string, type: 'date' | 'time') => {
    const d = new Date(iso);
    return type === 'date'
      ? d.toLocaleDateString('pt-BR')
      : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title="Minhas Reservas" subtitle="Acompanhe e gerencie suas reservas" />
      <ScrollView
        style={styles.root}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {reservas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Você não tem reservas.</Text>
            <View style={styles.mt}>
              <PrimaryButton label="Reservar uma sala" onPress={() => navigation.navigate('Salas')} />
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {reservas.map((r) => {
              const s = STATUS_COLOR[r.status] ?? STATUS_COLOR.Pendente;
              const locked = r.status === 'Finalizada' || r.status === 'Cancelada';
              return (
                <Card key={r.id_reserva}>
                  <View style={styles.row}>
                    <Text style={styles.sala}>{r.nome_sala ?? `Sala #${r.id_sala}`}</Text>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.text }]}>{r.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>📅 {fmt(r.entrada, 'date')}</Text>
                  <Text style={styles.meta}>
                    🕐 {fmt(r.entrada, 'time')} – {fmt(r.saida, 'time')}
                  </Text>
                  <View style={styles.cardAction}>
                    <PrimaryButton
                      label={locked ? (r.status === 'Cancelada' ? 'Reserva cancelada' : 'Reserva finalizada') : 'Alterar / cancelar'}
                      variant={locked ? 'ghost' : 'secondary'}
                      disabled={locked}
                      onPress={() => navigation.navigate('EditarReserva', { id: r.id_reserva })}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  list:       { padding: spacing.xl, gap: 12, paddingBottom: spacing.xxl },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sala:       { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1, marginRight: 8 },
  meta:       { fontSize: 13, color: colors.muted, marginBottom: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText:  { fontSize: 12, fontWeight: '700' },
  cardAction: { marginTop: spacing.md },
  empty:      { padding: spacing.xl, alignItems: 'center', marginTop: spacing.xxl },
  emptyText:  { fontSize: 16, color: colors.muted, marginBottom: spacing.md },
  mt:         { marginTop: spacing.sm },
});
