import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, Field } from '../components/ui';
import { colors, radius, spacing } from '../theme';

export function LoginScreen({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string | null;
  onLogin: (cpf: string, senha: string) => Promise<void>;
}) {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  async function submit() {
    await onLogin(cpf.trim().replace(/\D/g, ''), senha);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AW</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Axis Work</Text>
            <Text style={styles.brandSub}>Painel administrativo</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View>
            <Text style={styles.eyebrow}>Acesso administrativo</Text>
            <Text style={styles.title}>Entrar no painel</Text>
            <Text style={styles.copy}>Use suas credenciais para gerenciar usuarios, salas, planos, reservas e notificacoes.</Text>
          </View>
          <Field label="CPF" value={cpf} onChangeText={setCpf} keyboardType="numeric" placeholder="33333333333" />
          <Field label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Digite sua senha" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AppButton label={loading ? 'Entrando...' : 'Entrar'} disabled={loading} onPress={submit} />
          {loading ? <ActivityIndicator color={colors.inkSoft} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  root: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.ink, fontWeight: '800' },
  brandTitle: { color: colors.blue50, fontSize: 20, fontWeight: '800' },
  brandSub: { color: colors.blue200, fontSize: 12, marginTop: 2 },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 4 },
  copy: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  error: {
    borderWidth: 1,
    borderColor: '#D9A0A0',
    borderRadius: radius.md,
    backgroundColor: '#F8E7E7',
    color: '#8F2F2F',
    padding: spacing.sm,
    fontSize: 12,
    fontWeight: '700',
  },
});
