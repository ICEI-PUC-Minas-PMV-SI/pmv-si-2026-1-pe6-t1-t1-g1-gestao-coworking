/**
 * SalasScreen — lista de salas disponíveis para reserva.
 */

import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { userApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Container, Header, LoadingState } from '../../components/shared';
import { colors, radius, spacing } from '../../theme';

type Sala = {
  id_sala: number;
  nome: string;
  tipo: string;
  capacidade: number;
  recursos: string;
  ativa: boolean;
};

const TIPOS = [
  { key: '', label: 'Todos' },
  { key: 'Mesa', label: 'Mesas' },
  { key: 'Individual', label: 'Individual' },
  { key: 'Atendimento', label: 'Atendimento' },
  { key: 'Reunião', label: 'Reunião' },
];

export function SalasScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [salas, setSalas]     = useState<Sala[]>([]);
  const [filtro, setFiltro]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.get<Sala[]>('/api/salas?ativas=true')
      .then(setSalas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const salasFiltradas = filtro
    ? salas.filter((s) => s.tipo?.includes(filtro))
    : salas;

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title="Salas" subtitle="Escolha um espaço para reservar" />
      <Container>
        {/* Filtros */}
        <View style={styles.filtros}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, filtro === t.key && styles.chipActive]}
              onPress={() => setFiltro(t.key)}
            >
              <Text style={[styles.chipText, filtro === t.key && styles.chipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid de salas */}
        <View style={styles.grid}>
          {salasFiltradas.length === 0 && (
            <Text style={styles.empty}>Nenhuma sala encontrada.</Text>
          )}
          {salasFiltradas.map((sala, i) => (
            <TouchableOpacity
              key={sala.id_sala ?? i}
              style={styles.card}
              onPress={() => (user ? navigation.navigate('Sala', { sala }) : navigation.navigate('Login'))}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: `https://picsum.photos/600?random=sala_${sala.id_sala ?? i}` }}
                style={styles.img}
              />
              <View style={styles.info}>
                <Text style={styles.tipo}>{sala.tipo}</Text>
                <Text style={styles.nome}>{sala.nome}</Text>
                <Text style={styles.meta}>👥 {sala.capacidade} pessoas</Text>
                {sala.recursos ? <Text style={styles.meta} numberOfLines={2}>{sala.recursos}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  filtros:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: spacing.xl },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.blueGhost,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive:     { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  chipTextActive: { color: '#fff' },
  grid: {
    paddingHorizontal: spacing.xl,
    gap: 16,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  img:   { width: '100%', height: 180 },
  info:  { padding: spacing.lg },
  tipo:  { fontSize: 11, fontWeight: '800', color: colors.blue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  nome:  { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  meta:  { fontSize: 13, color: colors.muted, marginBottom: 4 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xxl },
});
