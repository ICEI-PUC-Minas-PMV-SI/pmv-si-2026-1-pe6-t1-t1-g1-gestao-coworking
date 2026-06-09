import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import type { ScreenKey } from '../types';

export const menuItems: Array<{ key: ScreenKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { key: 'reservas', label: 'Reservas', icon: 'calendar-outline' },
  { key: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
  { key: 'salas', label: 'Salas', icon: 'business-outline' },
  { key: 'planos', label: 'Planos', icon: 'pricetag-outline' },
  { key: 'avaliacoes', label: 'Avaliacoes', icon: 'star-outline' },
];

export function Drawer({
  visible,
  current,
  onClose,
  onNavigate,
  onOpenApp,
}: {
  visible: boolean;
  current: ScreenKey;
  onClose: () => void;
  onNavigate: (screen: ScreenKey) => void;
  onOpenApp?: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.brand}>
            <Text style={styles.brandTitle}>Axis Work</Text>
            <Text style={styles.brandSub}>Admin Mobile</Text>
          </View>
          <View style={styles.list}>
            {menuItems.map((item) => {
              const active = current === item.key;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => {
                    onNavigate(item.key);
                    onClose();
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={active ? colors.ink : colors.blue100} />
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {onOpenApp ? (
            <View style={styles.footer}>
              <Pressable
                style={styles.switchBtn}
                onPress={() => {
                  onOpenApp();
                  onClose();
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.ink} />
                <Text style={styles.switchText}>Ir para o aplicativo</Text>
              </Pressable>
              <Text style={styles.footerHint}>Ver a aplicação como usuário</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,31,51,0.46)', justifyContent: 'flex-start' },
  drawer: {
    width: '82%',
    maxWidth: 330,
    height: '100%',
    backgroundColor: colors.ink,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  brand: { borderBottomWidth: 1, borderBottomColor: colors.inkSoft, paddingBottom: spacing.lg },
  brandTitle: { color: colors.blue50, fontSize: 20, fontWeight: '700' },
  brandSub: { color: colors.blue200, fontSize: 12, marginTop: 4 },
  list: { gap: spacing.xs },
  item: {
    minHeight: 44,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemActive: { backgroundColor: colors.blue50 },
  itemText: { color: colors.blue100, fontWeight: '700', fontSize: 13 },
  itemTextActive: { color: colors.ink },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: colors.inkSoft,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  switchBtn: {
    minHeight: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.blue50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  switchText: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  footerHint: { color: colors.blue200, fontSize: 11, textAlign: 'center' },
});
