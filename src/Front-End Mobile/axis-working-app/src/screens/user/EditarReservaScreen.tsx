/**
 * EditarReservaScreen — alterar ou cancelar uma reserva (usuário).
 *
 * Substitui o antigo app/edit-reservation.tsx, integrado ao userApi e à
 * navegação React Navigation. Recebe o id da reserva via route.params.id.
 */

import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { userApi } from '../../api/client';
import { Card, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, radius, spacing } from '../../theme';
import { dateOnly, formatDate, timePart, timeRange } from '../../utils/format';

type Reserva = {
  id_reserva: number;
  id_cliente?: number | null;
  id_sala?: number | null;
  status: string;
  entrada: string;
  saida: string;
};

type Sala = { id_sala: number; nome: string; tipo: string; capacidade: number };

const HORARIOS = ['08:00', '09:00', '10:00', '13:00', '15:00', '17:00'];

export function EditarReservaScreen({ route, navigation }: { route: any; navigation: any }) {
  const reservaId = Number(route.params?.id);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [salas, setSalas]     = useState<Sala[]>([]);
  const [form, setForm]       = useState({ id_sala: '', data: '', inicio: '', fim: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!reservaId) {
      navigation.goBack();
      return;
    }
    (async () => {
      try {
        const [reservaData, salasData] = await Promise.all([
          userApi.get<Reserva>(`/api/reservas/${reservaId}`),
          userApi.get<Sala[]>('/api/salas?ativas=true'),
        ]);
        setReserva(reservaData);
        setSalas(salasData);
        setForm({
          id_sala: String(reservaData.id_sala ?? ''),
          data:    dateOnly(reservaData.entrada),
          inicio:  timePart(reservaData.entrada),
          fim:     timePart(reservaData.saida),
        });
      } catch (err) {
        Alert.alert('Reserva', err instanceof Error ? err.message : 'Não foi possível carregar a reserva.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [reservaId]);

  if (loading) return <LoadingState />;
  if (!reserva) return null;

  const salaAtual    = salas.find((s) => Number(s.id_sala) === Number(reserva.id_sala));
  const salaSelecionada = salas.find((s) => Number(s.id_sala) === Number(form.id_sala));
  const locked = reserva.status === 'Finalizada' || reserva.status === 'Cancelada';

  async function salvar(statusOverride?: string) {
    if (!reserva || locked) {
      Alert.alert('Reserva', reserva?.status === 'Cancelada'
        ? 'Reservas canceladas não podem ser alteradas.'
        : 'Reservas finalizadas não podem ser alteradas.');
      return;
    }
    setSaving(true);
    const novoStatus = statusOverride ?? 'Confirmada';
    try {
      await userApi.send(`/api/reservas/${reserva.id_reserva}`, 'PATCH', {
        id_cliente: reserva.id_cliente,
        id_sala: Number(form.id_sala),
        status: novoStatus,
        entrada: `${form.data}T${form.inicio}:00`,
        saida: `${form.data}T${form.fim}:00`,
      });
      Alert.alert('Reserva', novoStatus === 'Cancelada' ? 'Reserva cancelada.' : 'Reserva atualizada.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Reserva', err instanceof Error ? err.message : 'Não foi possível atualizar a reserva.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header title="Alterar reserva" />
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Resumo atual */}
        <Card>
          <Text style={styles.sectionTitle}>Reserva atual</Text>
          <Row label="Sala"     value={salaAtual?.nome ?? `Sala #${reserva.id_sala}`} />
          <Row label="Data"     value={formatDate(dateOnly(reserva.entrada))} />
          <Row label="Horário"  value={timeRange(reserva.entrada, reserva.saida)} />
          <Row label="Status"   value={reserva.status} />
        </Card>

        {locked ? (
          <Card>
            <Text style={styles.muted}>
              {reserva.status === 'Cancelada'
                ? 'Esta reserva foi cancelada e não pode ser alterada.'
                : 'Esta reserva já foi finalizada e não pode ser alterada.'}
            </Text>
          </Card>
        ) : (
          <Card>
            <Text style={styles.sectionTitle}>Nova configuração</Text>

            <Text style={styles.label}>Sala</Text>
            <View style={styles.salaList}>
              {salas.map((s) => {
                const active = Number(form.id_sala) === Number(s.id_sala);
                return (
                  <Pressable
                    key={s.id_sala}
                    onPress={() => setForm((v) => ({ ...v, id_sala: String(s.id_sala) }))}
                    style={[styles.salaItem, active && styles.salaItemActive]}
                  >
                    <Text style={[styles.salaNome, active && styles.salaNomeActive]}>{s.nome}</Text>
                    <Text style={styles.salaMeta}>{s.capacidade} pessoas</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>Selecionada: {salaSelecionada?.nome ?? 'Nenhuma'}</Text>

            <Text style={[styles.label, styles.mt]}>Data (AAAA-MM-DD)</Text>
            <TextInput
              value={form.data}
              onChangeText={(data) => setForm((v) => ({ ...v, data }))}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={[styles.label, styles.mt]}>Horário de início</Text>
            <View style={styles.chips}>
              {HORARIOS.map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setForm((v) => ({ ...v, inicio: h }))}
                  style={[styles.chip, form.inicio === h && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.inicio === h && styles.chipTextActive]}>{h}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, styles.mt]}>Horário final (HH:MM)</Text>
            <TextInput
              value={form.fim}
              onChangeText={(fim) => setForm((v) => ({ ...v, fim }))}
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </Card>
        )}

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Salvando...' : 'Salvar alterações'} onPress={() => salvar()} disabled={saving || locked} />
          <PrimaryButton label="Cancelar reserva" variant="danger" onPress={() => salvar('Cancelada')} disabled={saving || locked} />
          <PrimaryButton label="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: 16, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  row:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel:{ fontSize: 13, color: colors.muted, fontWeight: '600' },
  rowValue:{ fontSize: 14, color: colors.ink, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },
  label:   { fontSize: 13, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  salaList: { gap: 8 },
  salaItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  salaItemActive: { borderColor: colors.navy, backgroundColor: colors.blueGhost },
  salaNome:       { fontSize: 15, fontWeight: '700', color: colors.ink },
  salaNomeActive: { color: colors.navy },
  salaMeta:       { fontSize: 13, color: colors.muted },
  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.blueGhost,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText:       { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  chipTextActive: { color: '#fff' },
  hint:    { fontSize: 13, color: colors.muted, marginTop: spacing.sm },
  actions: { gap: spacing.sm },
  mt:      { marginTop: spacing.md },
  muted:   { fontSize: 14, color: colors.muted, lineHeight: 20 },
});
