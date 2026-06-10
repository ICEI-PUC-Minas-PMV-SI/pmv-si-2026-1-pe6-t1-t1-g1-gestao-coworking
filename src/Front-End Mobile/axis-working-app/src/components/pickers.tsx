/**
 * Seletores de data e hora (sem dependências nativas — funcionam no Expo Go).
 *
 *  - DateField: botão que abre um calendário em modal para escolher o dia.
 *  - TimeField: botão que abre uma lista de horários em modal.
 *
 * Datas são manipuladas como string ISO "YYYY-MM-DD" (comparáveis
 * lexicograficamente), montadas a partir de componentes locais para evitar o
 * deslocamento de fuso que `toISOString()` causaria.
 */

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function isoOf(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIso() {
  const d = new Date();
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}

// ── Campo de data (abre calendário) ──────────────────────────
export function DateField({
  label,
  value,
  onChange,
  allowPast = false,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  allowPast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const cells = useMemo(() => {
    const startWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i += 1) arr.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) arr.push(d);
    return arr;
  }, [view]);

  const today = todayIso();
  const formatted = value
    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
        .format(new Date(`${value}T00:00:00`))
    : 'Selecionar data';

  function pick(day: number) {
    const iso = isoOf(view.year, view.month, day);
    if (!allowPast && iso < today) return;
    onChange(iso);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  }

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.fieldBtn} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={18} color={colors.navy} />
        <Text style={styles.fieldBtnText} numberOfLines={1}>{formatted}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.calendar} onPress={() => {}}>
            <View style={styles.calHeader}>
              <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.navy} />
              </Pressable>
              <Text style={styles.calTitle}>{MONTHS[view.month]} {view.year}</Text>
              <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={20} color={colors.navy} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => <Text key={w} style={styles.weekday}>{w}</Text>)}
            </View>

            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (d === null) return <View key={`empty-${i}`} style={styles.cell} />;
                const iso = isoOf(view.year, view.month, d);
                const disabled = !allowPast && iso < today;
                const selected = iso === value;
                return (
                  <Pressable key={iso} style={styles.cell} disabled={disabled} onPress={() => pick(d)}>
                    <View style={[styles.dayDot, selected && styles.daySelected]}>
                      <Text style={[styles.dayText, disabled && styles.dayDisabled, selected && styles.daySelectedText]}>
                        {d}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Campo de horário (abre lista) ────────────────────────────
export function TimeField({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: string[];
  onChange: (time: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.flex}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.fieldBtn} onPress={() => setOpen(true)}>
        <Ionicons name="time-outline" size={18} color={colors.navy} />
        <Text style={styles.fieldBtnText}>{value || '--:--'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.timeSheet} onPress={() => {}}>
            <Text style={styles.calTitle}>{label || 'Horário'}</Text>
            <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
              {options.map((t) => {
                const active = t === value;
                return (
                  <Pressable
                    key={t}
                    style={[styles.timeRow, active && styles.timeRowActive]}
                    onPress={() => { onChange(t); setOpen(false); }}
                  >
                    <Text style={[styles.timeText, active && styles.timeTextActive]}>{t}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.navy} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:  { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  fieldBtnText: { flex: 1, fontSize: 15, color: colors.ink, fontWeight: '600', textTransform: 'capitalize' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,42,68,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  // Calendário
  calendar: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:    { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueGhost },
  calTitle:  { fontSize: 16, fontWeight: '800', color: colors.navy, textTransform: 'capitalize' },
  weekRow:   { flexDirection: 'row' },
  weekday:   { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.muted },
  grid:      { flexDirection: 'row', flexWrap: 'wrap' },
  cell:      { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.navy },
  dayText:   { fontSize: 15, color: colors.ink, fontWeight: '600' },
  dayDisabled: { color: colors.bluePale },
  daySelectedText: { color: '#FFFFFF', fontWeight: '800' },

  // Lista de horários
  timeSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  timeList:  { maxHeight: 300 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  timeRowActive: { backgroundColor: colors.blueGhost },
  timeText:      { fontSize: 16, color: colors.ink, fontWeight: '600' },
  timeTextActive:{ color: colors.navy, fontWeight: '800' },
});
