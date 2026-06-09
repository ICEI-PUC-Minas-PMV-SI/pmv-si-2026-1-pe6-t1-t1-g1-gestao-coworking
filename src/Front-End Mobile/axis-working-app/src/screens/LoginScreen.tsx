/**
 * LoginScreen — tela unificada de login.
 * Após autenticação, o App.tsx decide o fluxo com base em is_admin.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

export function LoginScreen({ navigation }: { navigation?: any }) {
  const { login, loginLoading, loginError } = useAuth();
  const [cpf, setCpf]     = useState('');
  const [senha, setSenha] = useState('');

  async function submit() {
    await login(cpf.trim().replace(/\D/g, ''), senha);
  }

  const canGoBack = navigation?.canGoBack?.();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        {canGoBack ? (
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backText}>‹ Continuar navegando</Text>
          </TouchableOpacity>
        ) : null}

        {/* Marca */}
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>AW</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Axis Work</Text>
            <Text style={styles.brandSub}>Espaço de trabalho inteligente</Text>
          </View>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Acesso à plataforma</Text>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.copy}>
            Use seu CPF e senha para acessar o sistema.{'\n'}
            Administradores serão redirecionados ao painel de controle.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              placeholder="00000000000"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              placeholder="Digite sua senha"
              placeholderTextColor={colors.muted}
            />
          </View>

          {loginError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loginLoading && styles.btnDisabled]}
            onPress={submit}
            disabled={loginLoading}
            activeOpacity={0.8}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.navy },
  root:        { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  back:        { position: 'absolute', top: spacing.md, left: spacing.lg },
  backText:    { color: colors.bluePale, fontSize: 14, fontWeight: '700' },
  brand:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.blueGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText:    { color: colors.navy, fontWeight: '900', fontSize: 16 },
  brandTitle:  { color: colors.blueGhost, fontSize: 22, fontWeight: '800' },
  brandSub:    { color: colors.bluePale, fontSize: 13, marginTop: 2 },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  eyebrow:  { color: colors.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title:    { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 2 },
  copy:     { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  fieldGroup: { gap: 6 },
  label:    { fontSize: 13, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: '#D9A0A0',
    borderRadius: radius.md,
    backgroundColor: '#F8E7E7',
    padding: spacing.sm,
  },
  errorText:   { color: '#8F2F2F', fontSize: 13, fontWeight: '700' },
  btn: {
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
});
