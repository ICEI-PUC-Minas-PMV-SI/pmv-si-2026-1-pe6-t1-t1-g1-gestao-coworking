import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../api/client';
import { AppButton, Card, ChoiceGroup, Field, Sheet, StatCard, styles as uiStyles } from '../components/ui';
import { Screen } from '../components/Screen';
import type { AdminData, Reserva } from '../types';
import { colors, spacing } from '../theme';
import { findById, formatDateTime, formatMoney, planRevenue, reservationLabel } from '../utils/format';
import { shareCsv } from '../utils/csv';

export function DashboardScreen({
  data,
  loading,
  onRefresh,
  onNavigate,
}: {
  data: AdminData;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (screen: string) => void;
}) {
  const [reservasOpen, setReservasOpen] = useState(false);
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [newReservationOpen, setNewReservationOpen] = useState(false);

  const activeSubscriptions = data.assinaturas.filter((assinatura) => assinatura.status === 'Ativa');
  const receita = activeSubscriptions.reduce((total, assinatura) => {
    const plano = data.planos.find((item) => item.id_plano === assinatura.id_plano);
    return total + Number(plano?.preco || 0);
  }, 0);
  const latest = [...data.reservas].sort((a, b) => b.id_reserva - a.id_reserva).slice(0, 5);
  const revenueRows = planRevenue(data.planos, data.assinaturas);

  async function exportReservations() {
    await shareCsv(
      'reservas-axis-work.csv',
      ['id', 'cliente', 'sala', 'status', 'entrada', 'saida'],
      data.reservas.map((reserva) => {
        const cliente = findById(data.clientes, 'id_cliente', reserva.id_cliente);
        const sala = findById(data.salas, 'id_sala', reserva.id_sala);
        return [reserva.id_reserva, cliente?.nome, sala?.nome, reserva.status, reserva.entrada, reserva.saida];
      }),
    );
  }

  return (
    <Screen
      title="Dashboard"
      subtitle="Resumo operacional do coworking"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={
        <>
          <AppButton label="Nova reserva" icon="add" onPress={() => setNewReservationOpen(true)} />
          <AppButton label="Exportar CSV" icon="download-outline" variant="ghost" onPress={exportReservations} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <StatCard label="Membros ativos" value={activeSubscriptions.length} note="toque para ver usuarios" />
        <StatCard label="Salas cadastradas" value={data.salas.length} note="ambientes disponiveis" />
        <StatCard label="Planos ativos" value={data.planos.length} note="catalogo comercial" />
        <StatCard label="Receita mensal" value={formatMoney(receita)} note="assinaturas ativas" />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <AppButton label="Usuarios ativos" variant="ghost" onPress={() => onNavigate('usuarios')} />
        <AppButton label="Salas" variant="ghost" onPress={() => onNavigate('salas')} />
        <AppButton label="Planos" variant="ghost" onPress={() => onNavigate('planos')} />
        <AppButton label="Receita" variant="ghost" onPress={() => setRevenueOpen(true)} />
      </View>

      <Card>
        <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>Ultimas reservas</Text>
        {latest.map((reserva) => (
          <ReservationRow key={reserva.id_reserva} reserva={reserva} data={data} />
        ))}
        <AppButton label="Ver todas" variant="ghost" onPress={() => setReservasOpen(true)} />
      </Card>

      <Sheet visible={reservasOpen} title="Todas as reservas" onClose={() => setReservasOpen(false)}>
        {data.reservas.map((reserva) => (
          <ReservationRow key={reserva.id_reserva} reserva={reserva} data={data} />
        ))}
      </Sheet>

      <Sheet visible={revenueOpen} title="Relatorio de receita" onClose={() => setRevenueOpen(false)}>
        {revenueRows.map((row) => (
          <Card key={row.plano.id_plano}>
            <Text style={{ color: colors.ink, fontWeight: '700' }}>{row.plano.nome}</Text>
            <Text style={uiStyles.muted}>{row.membros} membros ativos</Text>
            <Text style={{ color: colors.inkSoft, fontWeight: '700' }}>{formatMoney(row.receita)}/mes</Text>
          </Card>
        ))}
        <Card>
          <Text style={{ color: colors.ink, fontWeight: '700' }}>Projecao</Text>
          <Text style={uiStyles.muted}>30 dias: {formatMoney(receita)}</Text>
          <Text style={uiStyles.muted}>60 dias: {formatMoney(receita * 2)}</Text>
          <Text style={uiStyles.muted}>90 dias: {formatMoney(receita * 3)}</Text>
        </Card>
      </Sheet>

      <ReservationForm
        visible={newReservationOpen}
        data={data}
        onClose={() => setNewReservationOpen(false)}
        onSaved={() => {
          setNewReservationOpen(false);
          onRefresh();
        }}
      />
    </Screen>
  );
}

export function ReservationForm({
  visible,
  data,
  onClose,
  onSaved,
}: {
  visible: boolean;
  data: AdminData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const firstClient = data.clientes[0]?.id_cliente?.toString() || '';
  const firstRoom = data.salas[0]?.id_sala?.toString() || '';
  const [idCliente, setIdCliente] = useState(firstClient);
  const [idSala, setIdSala] = useState(firstRoom);
  const [entrada, setEntrada] = useState(new Date().toISOString().slice(0, 16));
  const [saida, setSaida] = useState(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));

  async function save() {
    try {
      await api.send('/reservas', 'POST', {
        id_cliente: Number(idCliente),
        id_sala: Number(idSala),
        entrada: new Date(entrada).toISOString(),
        saida: new Date(saida).toISOString(),
      });
      onSaved();
    } catch (error) {
      Alert.alert('Reserva', error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    }
  }

  return (
    <Sheet visible={visible} title="Nova reserva" onClose={onClose}>
      <ChoiceGroup
        label="Usuario"
        value={idCliente}
        onChange={setIdCliente}
        options={data.clientes.map((cliente) => String(cliente.id_cliente))}
      />
      <ChoiceGroup label="Sala" value={idSala} onChange={setIdSala} options={data.salas.map((sala) => String(sala.id_sala))} />
      <Text style={uiStyles.muted}>Usuario selecionado: {data.clientes.find((item) => String(item.id_cliente) === idCliente)?.nome}</Text>
      <Text style={uiStyles.muted}>Sala selecionada: {data.salas.find((item) => String(item.id_sala) === idSala)?.nome}</Text>
      <Field label="Entrada" value={entrada} onChangeText={setEntrada} placeholder="2026-05-27T09:00" />
      <Field label="Saida" value={saida} onChangeText={setSaida} placeholder="2026-05-27T10:00" />
      <AppButton label="Criar reserva" onPress={save} />
    </Sheet>
  );
}

function ReservationRow({ reserva, data }: { reserva: Reserva; data: AdminData }) {
  return (
    <Card style={{ padding: spacing.md }}>
      <Text style={{ color: colors.ink, fontWeight: '700' }}>{reservationLabel(reserva, data.clientes, data.salas)}</Text>
      <Text style={uiStyles.muted}>{reserva.status}</Text>
      <Text style={uiStyles.muted}>{formatDateTime(reserva.entrada)} ate {formatDateTime(reserva.saida)}</Text>
    </Card>
  );
}

export function ReservationsScreen({ data, loading, onRefresh }: { data: AdminData; loading: boolean; onRefresh: () => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todas');
  const statuses = useMemo(() => ['Todas', ...Array.from(new Set(data.reservas.map((item) => item.status)))], [data.reservas]);
  const filtered = statusFilter === 'Todas' ? data.reservas : data.reservas.filter((item) => item.status === statusFilter);

  async function exportRows() {
    await shareCsv(
      'reservas-axis-work.csv',
      ['id', 'cliente', 'sala', 'status', 'entrada', 'saida'],
      filtered.map((reserva) => [reserva.id_reserva, reservationLabel(reserva, data.clientes, data.salas), reserva.status, reserva.entrada, reserva.saida]),
    );
  }

  return (
    <Screen
      title="Reservas"
      subtitle="Crie, acompanhe e exporte reservas"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={
        <>
          <AppButton label="Nova" icon="add" onPress={() => setFormOpen(true)} />
          <AppButton label="CSV" icon="download-outline" variant="ghost" onPress={exportRows} />
        </>
      }
    >
      <ChoiceGroup label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses} />
      {filtered.map((reserva) => (
        <ReservationRow key={reserva.id_reserva} reserva={reserva} data={data} />
      ))}
      <ReservationForm
        visible={formOpen}
        data={data}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          onRefresh();
        }}
      />
    </Screen>
  );
}
