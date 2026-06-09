import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

export function Screen({
  title,
  subtitle,
  actions,
  refreshing,
  onRefresh,
  children,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
    >
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 36 },
  header: { gap: spacing.md },
  titleBox: { gap: 4 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
