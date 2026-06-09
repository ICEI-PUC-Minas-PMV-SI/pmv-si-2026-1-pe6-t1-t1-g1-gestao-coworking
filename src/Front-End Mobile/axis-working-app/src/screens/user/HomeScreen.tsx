/**
 * HomeScreen — tela inicial do usuário.
 * Exibe próxima reserva, salas disponíveis e planos.
 */

import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/client';
import { Card, Container, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, radius, spacing } from '../../theme';

type Sala = { id_sala: number; nome: string; tipo: string; capacidade: number; recursos: string };
type Reserva = { id_reserva: number; id_sala: number; status: string; entrada: string; saida: string };
type Plano = { id: number; nome: string; preco: string; descricao: string };

export function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [proximaReserva, setProximaReserva] = useState<(Reserva & { nome_sala: string }) | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [dadosSalas, dadosPlanos] = await Promise.all([
        userApi.get<Sala[]>('/api/salas?ativas=true'),
        userApi.get<Plano[]>('/planos/'),
      ]);

      const tiposDeSala = ['1 Mesa de Trabalho', '2 Sala Individual', '3 Sala de Atendimento', '4 Sala de Reunião'];
      const salasFiltradas = tiposDeSala
        .map((tipo) => dadosSalas.find((s) => String(s.tipo) === tipo))
        .filter(Boolean) as Sala[];
      setSalas(salasFiltradas);
      setPlanos(dadosPlanos.slice(0, 3));

      if (user?.id_cliente) {
        const dadosReservas = await userApi.get<Reserva[]>(`/api/reservas?id_cliente=${user.id_cliente}`);
        const agora = new Date();
        const proximas = dadosReservas
          .filter((r) => r.status === 'Confirmada' && new Date(r.entrada) > agora)
          .sort((a, b) => new Date(a.entrada).getTime() - new Date(b.entrada).getTime());

        if (proximas.length > 0) {
          const prox = proximas[0];
          const salaInfo = dadosSalas.find((s) => s.id_sala === prox.id_sala);
          setProximaReserva({ ...prox, nome_sala: salaInfo?.nome ?? 'Sala Desconhecida' });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar home:', err);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (iso: string, type: 'date' | 'time') => {
    const d = new Date(iso);
    return type === 'date'
      ? d.toLocaleDateString('pt-BR')
      : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title="Axis Work" subtitle="Espaço de trabalho inteligente" />
      <Container>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Olá, {user?.nome?.split(' ')[0] ?? 'bem-vindo'}!</Text>

          {proximaReserva ? (
            <Card>
              <Text style={styles.cardLabel}>Sua próxima reserva</Text>
              <Text style={styles.cardTitle}>{proximaReserva.nome_sala}</Text>
              <Text style={styles.cardMeta}>📅 {fmt(proximaReserva.entrada, 'date')}</Text>
              <Text style={styles.cardMeta}>
                🕐 {fmt(proximaReserva.entrada, 'time')} – {fmt(proximaReserva.saida, 'time')}
              </Text>
              <View style={styles.mt}>
                <PrimaryButton label="Ver minhas reservas" onPress={() => navigation.navigate('Reservas')} />
              </View>
            </Card>
          ) : user ? (
            <Card>
              <Text style={styles.empty}>Você não possui reservas ativas.</Text>
              <View style={styles.mt}>
                <PrimaryButton label="Reservar uma sala" onPress={() => navigation.navigate('Salas')} />
              </View>
            </Card>
          ) : (
            <Card>
              <Text style={styles.empty}>Entre para reservar salas e gerenciar suas reservas.</Text>
              <View style={styles.mt}>
                <PrimaryButton label="Entrar" onPress={() => navigation.navigate('Login')} />
              </View>
              <View style={styles.mt}>
                <PrimaryButton label="Explorar salas" variant="secondary" onPress={() => navigation.navigate('Salas')} />
              </View>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossas Salas</Text>
          <View style={styles.grid}>
            {salas.map((sala, i) => (
              <View key={sala.id_sala ?? i} style={styles.salaCard}>
                <Image
                  source={{ uri: `https://picsum.photos/400?random=${i}` }}
                  style={styles.salaImg}
                />
                <Text style={styles.salaNome}>{sala.tipo}</Text>
                <Text style={styles.salaMeta}>{sala.capacidade} pessoas</Text>
              </View>
            ))}
          </View>
          <View style={styles.mt}>
            <PrimaryButton label="Ver todas as salas" variant="secondary" onPress={() => navigation.navigate('Salas')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planos</Text>
          <View style={styles.cardList}>
            {planos.map((plano, i) => (
              <Card key={i}>
                <Text style={styles.planoNome}>{plano.nome}</Text>
                <Text style={styles.planoPreco}>R$ {parseFloat(plano.preco).toFixed(2)}<Text style={styles.planoMes}>/mês</Text></Text>
                <Text style={styles.planoDesc}>{plano.descricao}</Text>
              </Card>
            ))}
          </View>
          <View style={styles.mt}>
            <PrimaryButton label="Ver todos os planos" variant="ghost" onPress={() => navigation.navigate('Planos')} />
          </View>
        </View>

        <View style={[styles.section, styles.contato]}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <Text style={styles.contatoItem}>✉️  contato@axiswork.com</Text>
          <Text style={styles.contatoItem}>📞  (31) 9999-9999</Text>
          <Text style={styles.contatoItem}>📍  Av. do Contorno, 1000 – MG</Text>
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  section:       { padding: spacing.xl, paddingBottom: 0 },
  sectionTitle:  { fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: spacing.md },
  cardLabel:     { fontSize: 11, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardTitle:     { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  cardMeta:      { fontSize: 14, color: colors.muted, marginBottom: 4 },
  empty:         { color: colors.muted, textAlign: 'center', marginBottom: spacing.md },
  mt:            { marginTop: spacing.md },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardList:      { gap: spacing.md },
  salaCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  salaImg:       { width: '100%', height: 90 },
  salaNome:      { fontSize: 13, fontWeight: '600', color: colors.ink, padding: 8 },
  salaMeta:      { fontSize: 12, color: colors.muted, paddingHorizontal: 8, paddingBottom: 8 },
  planoNome:     { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 4 },
  planoPreco:    { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 6 },
  planoMes:      { fontSize: 14, fontWeight: '400', color: colors.muted },
  planoDesc:     { fontSize: 13, color: colors.muted, lineHeight: 20 },
  contato:       { paddingBottom: spacing.xxl },
  contatoItem:   { fontSize: 15, color: colors.inkSoft, marginBottom: 8 },
});
