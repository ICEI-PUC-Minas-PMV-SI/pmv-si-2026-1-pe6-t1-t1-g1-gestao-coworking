import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { IconButton } from './ui';

export function TopBar({
  title,
  unread,
  onMenu,
  onNotifications,
  onProfile,
  userName,
}: {
  title: string;
  unread: number;
  onMenu: () => void;
  onNotifications: () => void;
  onProfile: () => void;
  userName?: string;
}) {
  const initials = (userName || 'Admin')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.root}>
      <IconButton icon="menu" label="Abrir menu" onPress={onMenu} />
      <View style={styles.titleBox}>
        <Text style={styles.eyebrow}>Painel admin</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.bellWrap}>
        <IconButton icon="notifications-outline" label="Notificacoes" onPress={onNotifications} />
        {unread ? <View style={styles.dot}><Text style={styles.dotText}>{unread}</Text></View> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil" onPress={onProfile} style={styles.userPill}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'AD'}</Text>
        </View>
        <View style={styles.userMeta}>
          <Text numberOfLines={1} style={styles.userName}>{userName || 'Admin'}</Text>
          <Text numberOfLines={1} style={styles.userRole}>Admin</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleBox: { flex: 1 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  bellWrap: { position: 'relative' },
  dot: {
    position: 'absolute',
    right: -3,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: { color: colors.blue50, fontSize: 9, fontWeight: '700' },
  userPill: {
    maxWidth: 132,
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: 4,
    paddingRight: spacing.sm,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.blue50, fontSize: 11, fontWeight: '800' },
  userMeta: { flex: 1 },
  userName: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  userRole: { color: colors.muted, fontSize: 10, marginTop: 1 },
});
