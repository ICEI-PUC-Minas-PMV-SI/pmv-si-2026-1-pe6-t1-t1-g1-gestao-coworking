import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../api/client';
import { AppButton, Card, ChoiceGroup, Field, IconButton, Sheet, styles as uiStyles } from '../components/ui';
import { Screen } from '../components/Screen';
import type { AdminData, Plano } from '../types';
import { colors, spacing } from '../theme';
import { formatMoney, planRevenue } from '../utils/format';

const benefitOptions = ['Hot Desk ilimitado', 'Cafeteria e wifi', 'Sala de reuniao', 'Endereco fiscal', 'Eventos', 'Locker'];

export function PlansScreen({ data, loading, onRefresh }: { data: AdminData; loading: boolean; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Plano | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const revenue = planRevenue(data.planos, data.assinaturas);

  async function remove(plano: Plano) {
    Alert.alert('Excluir plano', `Deseja excluir ${plano.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.send(`/planos/${plano.id_plano}`, 'DELETE');
            onRefresh();
          } catch (error) {
            Alert.alert('Planos', error instanceof Error ? error.message : 'Nao foi possivel excluir.');
          }
        },
      },
    ]);
  }

  return (
    <Screen
      title="Planos"
      subtitle="Crie, edite e acompanhe rentabilidade"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={
        <>
          <AppButton label="Novo plano" icon="add" onPress={() => setEditing({} as Plano)} />
          <AppButton label="Receitas" icon="trending-up-outline" variant="ghost" onPress={() => setReportOpen(true)} />
        </>
      }
    >
      {data.planos.map((plano) => {
        const row = revenue.find((item) => item.plano.id_plano === plano.id_plano);
        return (
          <Card key={plano.id_plano}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontWeight: '700' }}>{plano.nome}</Text>
                <Text style={{ color: colors.inkSoft, fontWeight: '700', fontSize: 20 }}>{formatMoney(plano.preco)}/mes</Text>
                <Text style={uiStyles.muted}>{plano.acesso}</Text>
                <Text style={uiStyles.muted}>{row?.membros || 0} membros - {formatMoney(row?.receita || 0)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <IconButton icon="create-outline" label="Editar" onPress={() => setEditing(plano)} />
                <IconButton icon="trash-outline" label="Excluir" onPress={() => remove(plano)} />
              </View>
            </View>
          </Card>
        );
      })}

      <PlanForm data={data} plano={editing} visible={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />
      <Sheet visible={reportOpen} title="Relatorio de receitas" onClose={() => setReportOpen(false)}>
        {revenue.map((row) => (
          <Card key={row.plano.id_plano}>
            <Text style={{ color: colors.ink, fontWeight: '700' }}>{row.plano.nome}</Text>
            <Text style={uiStyles.muted}>{row.membros} membros ativos</Text>
            <Text style={{ color: colors.inkSoft, fontWeight: '700' }}>{formatMoney(row.receita)}/mes</Text>
          </Card>
        ))}
      </Sheet>
    </Screen>
  );
}

function PlanForm({
  data,
  plano,
  visible,
  onClose,
  onSaved,
}: {
  data: AdminData;
  plano: Plano | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(plano?.nome || '');
  const [acesso, setAcesso] = useState(plano?.acesso || data.roomTypes[0] || '1 Mesa de Trabalho');
  const [preco, setPreco] = useState(String(plano?.preco || ''));
  const [descricao, setDescricao] = useState(plano?.descricao || '');
  const [beneficios, setBeneficios] = useState<string[]>([]);

  React.useEffect(() => {
    setNome(plano?.nome || '');
    setAcesso(plano?.acesso || data.roomTypes[0] || '1 Mesa de Trabalho');
    setPreco(String(plano?.preco || ''));
    setDescricao(plano?.descricao || '');
    setBeneficios(Array.isArray(plano?.beneficios) ? plano.beneficios : []);
  }, [plano, data.roomTypes]);

  function toggleBenefit(item: string) {
    setBeneficios((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  async function save() {
    if (!nome || !preco) {
      Alert.alert('Planos', 'Informe nome e preco.');
      return;
    }
    try {
      const payload = { nome, acesso, preco: Number(preco), descricao, beneficios };
      if (plano?.id_plano) {
        await api.send(`/planos/${plano.id_plano}`, 'PUT', payload);
      } else {
        await api.send('/planos', 'POST', payload);
      }
      onSaved();
    } catch (error) {
      Alert.alert('Planos', error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    }
  }

  return (
    <Sheet visible={visible} title={plano?.id_plano ? 'Editar plano' : 'Novo plano'} onClose={onClose}>
      <Field label="Nome" value={nome} onChangeText={setNome} />
      <ChoiceGroup label="Acesso" value={acesso} onChange={setAcesso} options={data.roomTypes.length ? data.roomTypes : [acesso]} />
      <Field label="Preco" value={preco} onChangeText={setPreco} keyboardType="numeric" />
      <Field label="Descricao" value={descricao} onChangeText={setDescricao} multiline />
      <Text style={uiStyles.fieldLabel}>Beneficios</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {benefitOptions.map((item) => (
          <AppButton key={item} label={item} variant={beneficios.includes(item) ? 'primary' : 'ghost'} onPress={() => toggleBenefit(item)} />
        ))}
      </View>
      <AppButton label="Salvar plano" onPress={save} />
    </Sheet>
  );
}
