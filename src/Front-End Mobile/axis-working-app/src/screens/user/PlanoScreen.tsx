/**
 * PlanoScreen — lista de planos disponíveis.
 */

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Container, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, spacing } from '../../theme';
import { tierFromAccess } from '../../utils/format';
import type { Plano, Reserva, Sala } from '../../types';

export function PlanoScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const dadosPlanos = await userApi.get<Plano[]>('/planos/');
        if (active) setPlanos(dadosPlanos);
        // Reservas + salas só são necessárias para a verificação de troca de plano.
        if (user?.id_cliente) {
          const [dadosReservas, dadosSalas] = await Promise.all([
            userApi.get<Reserva[]>(`/api/reservas?id_cliente=${user.id_cliente}`).catch(() => [] as Reserva[]),
            userApi.get<Sala[]>('/api/salas').catch(() => [] as Sala[]),
          ]);
          if (active) { setReservas(dadosReservas); setSalas(dadosSalas); }
        }
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id_cliente]);

  async function assinar(plano: Plano) {
    if (!user?.id_cliente) {
      Alert.alert('Assinar plano', 'Faça login para assinar um plano.');
      return;
    }

    // Troca de plano é livre, mas se houver uma reserva ativa de sala de
    // categoria SUPERIOR ao nível do novo plano, o usuário precisa cancelá-la
    // antes. O nível é configurado pelo admin (fallback: derivado do acesso).
    const novoNivel = plano.nivel ?? tierFromAccess(plano.acesso);
    const reservasAtivas = reservas.filter((r) => r.status === 'Confirmada' || r.status === 'Em Andamento');
    const conflito = reservasAtivas
      .map((r) => salas.find((s) => Number(s.id_sala) === Number(r.id_sala)))
      .find((s): s is Sala => Boolean(s) && tierFromAccess(s!.tipo) > novoNivel);

    if (conflito) {
      Alert.alert(
        'Troca de plano',
        `Você possui uma reserva da ${conflito.nome} (${conflito.tipo}), de categoria superior ao plano ${plano.nome}. `
          + 'Cancele essa reserva antes de trocar para este plano.',
        [
          { text: 'Entendi', style: 'cancel' },
          { text: 'Ver reservas', onPress: () => navigation.navigate('Reservas') },
        ],
      );
      return;
    }

    setAssinando(plano.id_plano);
    try {
      await userApi.send('/assinaturas', 'POST', { id_cliente: user.id_cliente, id_plano: plano.id_plano });
      Alert.alert('Assinatura', `Plano ${plano.nome} ativado com sucesso! Veja em Perfil → Meu plano.`);
    } catch (err) {
      Alert.alert('Assinatura', err instanceof Error ? err.message : 'Não foi possível assinar o plano.');
    } finally {
      setAssinando(null);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title="Planos" subtitle="Escolha o plano ideal para você" />
      <Container>
        <View style={styles.wrap}>
          {planos.map((p, i) => {
            const beneficios = Array.isArray(p.beneficios)
              ? p.beneficios.join(' · ')
              : p.beneficios;
            return (
              <Card key={p.id_plano ?? i}>
                <Text style={styles.nome}>{p.nome}</Text>
                <Text style={styles.preco}>
                  R$ {parseFloat(String(p.preco ?? 0)).toFixed(2)}
                  <Text style={styles.mes}>/mês</Text>
                </Text>
                {p.acesso ? <Text style={styles.acesso}>Acesso: {p.acesso}</Text> : null}
                {p.descricao ? <Text style={styles.desc}>{p.descricao}</Text> : null}
                {beneficios ? <Text style={styles.desc}>{beneficios}</Text> : null}
                <View style={styles.mt}>
                  <PrimaryButton
                    label={assinando === p.id_plano ? 'Assinando...' : 'Assinar plano'}
                    disabled={assinando !== null}
                    onPress={() => assinar(p)}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  wrap:  { padding: spacing.xl, gap: 16, paddingBottom: 40 },
  nome:  { fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  preco: { fontSize: 26, fontWeight: '900', color: colors.navy, marginBottom: 8 },
  mes:   { fontSize: 14, fontWeight: '400', color: colors.muted },
  acesso:{ fontSize: 14, color: colors.ink, fontWeight: '600', marginBottom: 4 },
  desc:  { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 4 },
  mt:    { marginTop: 12 },
});
