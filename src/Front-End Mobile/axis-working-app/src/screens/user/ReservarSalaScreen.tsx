/**
 * ReservarSalaScreen — detalhe da sala + criação de reserva (usuário).
 *
 * Substitui o fluxo do antigo app/confirm-reservation.tsx, agora integrado
 * à navegação React Navigation e ao userApi/AuthContext do app unificado.
 *
 * Recebe a sala via route.params.sala (vinda da SalasScreen).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Header, PrimaryButton } from '../../components/shared';
import { DateField, TimeField } from '../../components/pickers';
import { colors, radius, spacing } from '../../theme';
import { addOneHour, formatDate, formatMoney, hourRange } from '../../utils/format';

type Sala = {
  id_sala: number;
  nome: string;
  tipo: string;
  capacidade: number;
  recursos?: string | null;
};

type Assinatura = { id_assinatura: number; id_plano?: number | null; status: string; validade?: string };
type Plano = { id_plano: number; nome: string; preco: number | string; acesso?: string };

const HORAS = hourRange(7, 21);                 // 07:00 … 21:00
const HORAS_INICIO = HORAS.slice(0, -1);        // início vai até 20:00

export function ReservarSalaScreen({ route, navigation }: { route: any; navigation: any }) {
  const { user } = useAuth();
  const sala: Sala = route.params?.sala;

  const amanha = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [data, setData]       = useState(amanha);
  const [inicio, setInicio]   = useState('09:00');
  const [fim, setFim]         = useState('10:00');
  const [observacoes, setObs] = useState('');
  const [plano, setPlano]     = useState<Plano | null>(null);
  const [saving, setSaving]   = useState(false);

  const horasFim = HORAS.filter((h) => h > inicio);
  const duracao = Math.max(1, Number(fim.slice(0, 2)) - Number(inicio.slice(0, 2)));

  function escolherInicio(t: string) {
    setInicio(t);
    if (fim <= t) setFim(addOneHour(t));
  }

  useEffect(() => {
    if (!user?.id_cliente) return;
    (async () => {
      try {
        const [assinaturas, planos] = await Promise.all([
          userApi.get<Assinatura[]>(`/assinaturas?id_cliente=${user.id_cliente}`).catch(() => []),
          userApi.get<Plano[]>('/planos').catch(() => []),
        ]);
        const ativa = assinaturas.find((a) => a.status === 'Ativa') ?? assinaturas[0];
        if (ativa?.id_plano) {
          setPlano(planos.find((p) => Number(p.id_plano) === Number(ativa.id_plano)) ?? null);
        }
      } catch {
        /* seção de plano é best-effort */
      }
    })();
  }, [user]);

  if (!sala) {
    return (
      <>
        <Header title="Reservar" />
        <View style={styles.center}>
          <Text style={styles.muted}>Sala não informada.</Text>
          <View style={styles.mt}>
            <PrimaryButton label="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </View>
      </>
    );
  }

  async function confirmar() {
    if (!user?.id_cliente) {
      Alert.alert('Reserva', 'Sessão expirada. Faça login novamente.');
      return;
    }
    setSaving(true);
    try {
      await userApi.send('/api/reservas', 'POST', {
        id_cliente: user.id_cliente,
        id_sala: sala.id_sala,
        entrada: `${data}T${inicio}:00`,
        saida: `${data}T${fim}:00`,
      });

      // Notificação de confirmação (best-effort — não bloqueia a reserva).
      try {
        await userApi.send('/notificacoes', 'POST', {
          id_cliente: user.id_cliente,
          corpo: `Reserva confirmada para ${sala.nome} em ${formatDate(data)} às ${inicio}.`,
          tipo: 'Confirmação de Reserva',
          lida: false,
        });
      } catch { /* ignora falha de notificação */ }

      Alert.alert('Reserva', 'Reserva confirmada com sucesso.');
      navigation.navigate('Reservas');
    } catch (err) {
      Alert.alert('Reserva', err instanceof Error ? err.message : 'Não foi possível finalizar a reserva.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header title="Reservar sala" />
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Detalhe da sala */}
        <Card>
          <Image source={{ uri: `https://picsum.photos/600?random=sala_${sala.id_sala}` }} style={styles.img} />
          <Text style={styles.tipo}>{sala.tipo}</Text>
          <Text style={styles.nome}>{sala.nome}</Text>
          <Text style={styles.meta}>👥 até {sala.capacidade} pessoas</Text>
          {sala.recursos ? <Text style={styles.meta}>{sala.recursos}</Text> : null}
        </Card>

        {/* Formulário */}
        <Card>
          <Text style={styles.sectionTitle}>Data e horário</Text>
          <DateField label="Dia" value={data} onChange={setData} />

          <View style={[styles.timeRow, styles.mt]}>
            <TimeField label="Início" value={inicio} options={HORAS_INICIO} onChange={escolherInicio} />
            <TimeField label="Término" value={fim} options={horasFim} onChange={setFim} />
          </View>
          <Text style={styles.hint}>Duração: {duracao}h</Text>
        </Card>

        {/* Plano / cobertura */}
        <Card>
          <Text style={styles.sectionTitle}>Plano</Text>
          {plano ? (
            <>
              <Text style={styles.meta}>{plano.nome}</Text>
              <Text style={styles.meta}>{formatMoney(plano.preco)}/mês</Text>
              <View style={styles.coverBox}>
                <Text style={styles.coverLabel}>Cobertura do plano</Text>
                <Text style={styles.coverValue}>Incluso</Text>
              </View>
            </>
          ) : (
            <Text style={styles.muted}>Nenhum plano ativo encontrado para esta conta.</Text>
          )}
        </Card>

        {/* Observações */}
        <Card>
          <Text style={styles.sectionTitle}>Observações</Text>
          <TextInput
            multiline
            value={observacoes}
            onChangeText={setObs}
            placeholder="Ex: reunião com cliente, necessidade de projetor..."
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textarea]}
          />
        </Card>

        <View style={styles.actions}>
          <PrimaryButton label={saving ? 'Confirmando...' : 'Confirmar reserva'} onPress={confirmar} disabled={saving} />
          <PrimaryButton label="Voltar" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: 16, paddingBottom: spacing.xxl },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  img:     { width: '100%', height: 170, borderRadius: radius.md, marginBottom: spacing.sm },
  tipo:    { fontSize: 11, fontWeight: '800', color: colors.blue, textTransform: 'uppercase', letterSpacing: 0.5 },
  nome:    { fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 4 },
  meta:    { fontSize: 14, color: colors.muted, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
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
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  hint:    { fontSize: 13, color: colors.muted, marginTop: spacing.sm },
  coverBox: { backgroundColor: colors.successBg, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  coverLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
  coverValue: { fontSize: 22, fontWeight: '900', color: colors.success },
  actions: { gap: spacing.sm },
  mt:      { marginTop: spacing.md },
  muted:   { fontSize: 14, color: colors.muted },
});
