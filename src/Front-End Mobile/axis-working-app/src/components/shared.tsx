/**
 * Componentes compartilhados das telas de usuário.
 *
 * Estilização alinhada ao painel administrativo (ver src/components/ui.tsx):
 *  - títulos alinhados à esquerda com subtítulo (estilo do componente Screen)
 *  - cards brancos com borda fina (não sombra)
 *  - botões "pill" na paleta ink/blue
 *  - labels de campo curtas (11px, peso 700)
 */

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';

// ── Container scrollável ─────────────────────────────────────
export function Container({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

// ── Cabeçalho (estilo do painel admin: título + subtítulo à esquerda) ──
// Exibe automaticamente o sino de notificações (com contador de não lidas)
// em todas as telas do usuário logado. Passe `notifications={false}` para
// ocultá-lo (ex.: na própria tela de Notificações). `onBack` adiciona uma
// seta de voltar à esquerda (telas empilhadas, como Notificações).
export function Header({
  title = 'Axis Work',
  subtitle,
  notifications = true,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  notifications?: boolean;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const unread = useUnreadCount();
  const showBell = notifications && Boolean(user);

  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Voltar" activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.headerTextBlock}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {showBell ? (
        <TouchableOpacity
          style={styles.bell}
          onPress={() => navigation.navigate('Notificacoes')}
          accessibilityLabel="Abrir notificações"
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.navy} />
          {unread > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Botão principal (pill — paleta do painel admin) ──────────
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.btn, styles[`btn_${variant}`], disabled && styles.btnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.btnText, isPrimary && styles.btnTextPrimary, variant === 'secondary' && styles.btnTextOnFill]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Card genérico (borda fina, como no painel admin) ─────────
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Indicador de carregamento ────────────────────────────────
export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.inkSoft} />
      <Text style={styles.loadingText}>Carregando dados...</Text>
    </View>
  );
}

// ── Campo de texto estilizado ────────────────────────────────
export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  );
}

// ── Badge de papel ───────────────────────────────────────────
export function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return (
    <View style={[styles.badge, { backgroundColor: isAdmin ? colors.adminBg : colors.blueGhost }]}>
      <Text style={[styles.badgeText, { color: isAdmin ? colors.admin : colors.navy }]}>
        {isAdmin ? '🛡 Administrador' : '👤 Usuário'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.bg,
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueGhost,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  btn: {
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  btn_primary:   { backgroundColor: colors.ink,      borderColor: colors.ink },
  btn_secondary: { backgroundColor: colors.blue,     borderColor: colors.blue },
  btn_ghost:     { backgroundColor: colors.blue50,   borderColor: colors.blue200 },
  btn_danger:    { backgroundColor: '#F2E0E0',       borderColor: '#D9A0A0' },
  btnDisabled:   { opacity: 0.5 },
  btnText:       { fontWeight: '800', fontSize: 14, color: colors.inkSoft },
  btnTextPrimary:{ color: colors.blue50 },
  btnTextOnFill: { color: '#FFFFFF' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  loadingText: { color: colors.muted, fontSize: 12 },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  fieldInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
