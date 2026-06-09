/**
 * PerfilScreen — perfil do usuário logado.
 */

import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/client';
import { Card, Container, Field, PrimaryButton, RoleBadge } from '../../components/shared';
import { colors, spacing } from '../../theme';

export function PerfilScreen() {
  const { user, logout, setViewMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nome, setNome]       = useState(user?.nome ?? '');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [tel, setTel]         = useState(user?.telefone ?? '');

  async function salvar() {
    if (!user?.id_cliente) return;
    try {
      await adminApi.send(`/clientes/${user.id_cliente}`, 'PUT', {
        nome:      nome.trim(),
        cpf:       user.cpf,
        email:     email.trim(),
        telefone:  tel.replace(/\D/g, ''),
        senha:     '',   // não altera senha aqui
      });
      setEditing(false);
      Alert.alert('Perfil', 'Dados atualizados com sucesso.');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    }
  }

  function confirmarLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Container>
        {/* Avatar + nome */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nome?.slice(0, 2).toUpperCase() ?? 'AW'}
            </Text>
          </View>
          <Text style={styles.heroName}>{user?.nome}</Text>
          <RoleBadge isAdmin={user?.is_admin ?? false} />
        </View>

        {editing ? (
          <View style={styles.form}>
            <Field label="Nome"     value={nome}  onChangeText={setNome} />
            <Field label="E-mail"   value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Field label="Telefone" value={tel}   onChangeText={setTel}   keyboardType="numeric" />
            <View style={styles.actions}>
              <PrimaryButton label="Cancelar" variant="ghost"   onPress={() => setEditing(false)} />
              <PrimaryButton label="Salvar"                     onPress={salvar} />
            </View>
          </View>
        ) : (
          <>
            <Card>
              <Row label="Nome"     value={user?.nome ?? '-'} />
              <Row label="CPF"      value={user?.cpf ?? '-'} />
              <Row label="E-mail"   value={user?.email ?? '-'} />
              <Row label="Telefone" value={user?.telefone ?? '-'} />
            </Card>

            <View style={styles.actions}>
              <PrimaryButton label="Editar dados" variant="ghost" onPress={() => setEditing(true)} />
              {user?.is_admin ? (
                <PrimaryButton label="Painel administrativo" variant="secondary" onPress={() => setViewMode('painel')} />
              ) : null}
              <PrimaryButton label="Sair da conta" variant="danger" onPress={confirmarLogout} />
            </View>
          </>
        )}
      </Container>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  value: { fontSize: 14, color: colors.ink, fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 8 },
});

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  hero:       { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroName:   { fontSize: 22, fontWeight: '800', color: colors.ink },
  form:       { padding: spacing.xl, gap: spacing.md },
  actions:    { padding: spacing.xl, gap: spacing.sm },
});
