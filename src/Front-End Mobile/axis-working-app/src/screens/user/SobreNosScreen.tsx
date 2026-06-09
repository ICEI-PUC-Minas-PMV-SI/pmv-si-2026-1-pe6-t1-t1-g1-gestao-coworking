/**
 * SobreNosScreen — informações sobre o Axis Work.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Container, Header } from '../../components/shared';
import { colors, spacing } from '../../theme';

export function SobreNosScreen() {
  return (
    <>
      <Header title="Sobre Nós" subtitle="Conheça o Axis Work" />
      <Container>
        <View style={styles.wrap}>
          <Card>
            <Text style={styles.title}>O centro estratégico do seu trabalho.</Text>
            <Text style={styles.body}>
              O Axis Work é um espaço de coworking moderno projetado para empresários,
              freelancers e times que valorizam flexibilidade e senso de comunidade.
            </Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Nossos diferenciais</Text>
            {[
              '🏢 Espaços flexíveis e privativos',
              '🌐 Internet via fibra óptica',
              '☕ Café e snacks disponíveis',
              '🤝 Eventos de networking',
              '📍 Localização privilegiada',
              '🔒 Acesso 24h/7',
            ].map((item, i) => (
              <Text key={i} style={styles.item}>{item}</Text>
            ))}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Contato</Text>
            <Text style={styles.contact}>✉️  contato@axiswork.com</Text>
            <Text style={styles.contact}>📞  (31) 9999-9999</Text>
            <Text style={styles.contact}>📍  Av. do Contorno, 1000 – Belo Horizonte, MG</Text>
          </Card>
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  wrap:         { padding: spacing.xl, gap: 16, paddingBottom: 40 },
  title:        { fontSize: 20, fontWeight: '800', color: colors.navy, marginBottom: 10, lineHeight: 28 },
  body:         { fontSize: 14, color: colors.muted, lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  item:         { fontSize: 14, color: colors.inkSoft, marginBottom: 8 },
  contact:      { fontSize: 15, color: colors.inkSoft, marginBottom: 10 },
});
