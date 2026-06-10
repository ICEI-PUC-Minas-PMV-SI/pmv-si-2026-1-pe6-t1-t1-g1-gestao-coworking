/**
 * MeuPlanoScreen — assinatura atual do usuário logado.
 *
 * Consome /assinaturas?id_cliente={id} + /planos para exibir o plano ativo
 * (status, validade, acesso, preço) e permite cancelar a assinatura
 * (PUT /assinaturas/{id} → status "Cancelada") ou trocar de plano.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, spacing } from '../../theme';
import { formatDate, formatMoney } from '../../utils/format';
import type { Assinatura, Plano } from '../../types';

export function MeuPlanoScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id_cliente) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [dadosAssinaturas, dadosPlanos] = await Promise.all([
        userApi.get<Assinatura[]>(`/assinaturas?id_cliente=${user.id_cliente}`),
        userApi.get<Plano[]>('/planos'),
      ]);
      setAssinaturas(dadosAssinaturas);
      setPlanos(dadosPlanos);
    } catch (err) {
      console.error('Erro ao carregar plano:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id_cliente]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;

  const ativa = assinaturas.find((a) => a.status === 'Ativa') ?? assinaturas[0];
  const plano = ativa ? planos.find((p) => Number(p.id_plano) === Number(ativa.id_plano)) : undefined;

  function cancelar() {
    if (!ativa) return;
    Alert.alert('Cancelar assinatura', 'Deseja realmente cancelar sua assinatura atual?', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar assinatura',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.send(`/assinaturas/${ativa.id_assinatura}`, 'PUT', { status: 'Cancelada' });
            await load();
          } catch (err) {
            Alert.alert('Plano', err instanceof Error ? err.message : 'Não foi possível cancelar.');
          }
        },
      },
    ]);
  }

  return (
    <>
      <Header title="Meu Plano" subtitle="Detalhes da sua assinatura" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {!ativa || !plano ? (
          <Card>
            <Text style={styles.emptyTitle}>Nenhum plano ativo</Text>
            <Text style={styles.emptyText}>Você ainda não possui uma assinatura ativa.</Text>
            <View style={styles.mt}>
              <PrimaryButton label="Ver planos disponíveis" onPress={() => navigation.navigate('Planos')} />
            </View>
          </Card>
        ) : (
          <>
            <Card style={styles.hero}>
              <Text style={styles.heroLabel}>Plano atual</Text>
              <Text style={styles.heroNome}>{plano.nome}</Text>
              <Text style={styles.heroPreco}>
                {formatMoney(plano.preco)}
                <Text style={styles.heroMes}> /mês</Text>
              </Text>
            </Card>

            <Card>
              <Row label="Status" value={ativa.status} />
              <Row label="Acesso" value={plano.acesso} />
              <Row label="Válido até" value={formatDate(ativa.validade)} />
              <Row label="Assinado em" value={formatDate(ativa.feita_em)} last />
            </Card>

            <View style={styles.actions}>
              <PrimaryButton label="Trocar de plano" variant="secondary" onPress={() => navigation.navigate('Planos')} />
              {ativa.status === 'Ativa' ? (
                <PrimaryButton label="Cancelar assinatura" variant="danger" onPress={cancelar} />
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[rowStyles.row, last && rowStyles.last]}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  last:  { borderBottomWidth: 0 },
  label: { fontSize: 14, color: colors.muted },
  value: { fontSize: 14, color: colors.ink, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: spacing.md },
});

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  hero:       { backgroundColor: colors.navy, borderColor: colors.navy },
  heroLabel:  { fontSize: 11, fontWeight: '800', color: colors.bluePale, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroNome:   { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginTop: 4 },
  heroPreco:  { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginTop: 6 },
  heroMes:    { fontSize: 14, fontWeight: '400', color: colors.bluePale },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  emptyText:  { fontSize: 14, color: colors.muted, lineHeight: 20 },
  actions:    { gap: spacing.sm },
  mt:         { marginTop: spacing.sm },
});
