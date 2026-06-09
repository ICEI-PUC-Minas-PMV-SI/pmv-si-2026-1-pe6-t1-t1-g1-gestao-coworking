/**
 * PlanoScreen — lista de planos disponíveis.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { userApi } from '../../api/client';
import { Card, Container, Header, LoadingState, PrimaryButton } from '../../components/shared';
import { colors, spacing } from '../../theme';

type Plano = { id: number; nome: string; preco: string; descricao: string; beneficios?: string };

export function PlanoScreen() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.get<Plano[]>('/planos/')
      .then(setPlanos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <>
      <Header title="Planos" subtitle="Escolha o plano ideal para você" />
      <Container>
        <View style={styles.wrap}>
          {planos.map((p, i) => (
            <Card key={p.id ?? i}>
              <Text style={styles.nome}>{p.nome}</Text>
              <Text style={styles.preco}>
                R$ {parseFloat(p.preco).toFixed(2)}
                <Text style={styles.mes}>/mês</Text>
              </Text>
              <Text style={styles.desc}>{p.descricao}</Text>
              {p.beneficios ? <Text style={styles.desc}>{p.beneficios}</Text> : null}
              <View style={styles.mt}>
                <PrimaryButton label="Assinar plano" onPress={() => {}} />
              </View>
            </Card>
          ))}
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
  desc:  { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 4 },
  mt:    { marginTop: 12 },
});
