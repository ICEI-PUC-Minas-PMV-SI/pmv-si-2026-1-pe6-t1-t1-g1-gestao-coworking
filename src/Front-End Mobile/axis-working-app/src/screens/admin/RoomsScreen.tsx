import React, { useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { AppButton, Card, ChoiceGroup, Field, IconButton, Sheet, styles as uiStyles } from '../../components/ui';
import { Screen } from '../../components/Screen';
import type { AdminData, Sala } from '../../types';
import { colors, spacing } from '../../theme';
import { normalize } from '../../utils/format';
import { shareCsv } from '../../utils/csv';

export function RoomsScreen({ data, loading, onRefresh }: { data: AdminData; loading: boolean; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('Todas');
  const [editing, setEditing] = useState<Sala | null>(null);
  const types = ['Todas', ...data.roomTypes];
  const filtered = data.salas.filter((sala) => {
    const matchesType = type === 'Todas' || sala.tipo === type;
    const matchesQuery = !query || normalize(`${sala.nome} ${sala.tipo} ${sala.descricao || ''} ${sala.recursos || ''}`).includes(normalize(query));
    return matchesType && matchesQuery;
  });

  async function remove(sala: Sala) {
    Alert.alert('Excluir sala', `Deseja excluir ${sala.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.send(`/salas/${sala.id_sala}`, 'DELETE');
            onRefresh();
          } catch (error) {
            Alert.alert('Salas', error instanceof Error ? error.message : 'Nao foi possivel excluir.');
          }
        },
      },
    ]);
  }

  async function exportCsv() {
    await shareCsv(
      'salas-axis-work.csv',
      ['id', 'nome', 'capacidade', 'tipo', 'ativa', 'recursos', 'descricao'],
      filtered.map((sala) => [sala.id_sala, sala.nome, sala.capacidade, sala.tipo, sala.ativa, sala.recursos, sala.descricao]),
    );
  }

  return (
    <Screen
      title="Salas"
      subtitle="Ambientes, capacidade, fotos e disponibilidade"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={
        <>
          <AppButton label="Nova sala" icon="add" onPress={() => setEditing({} as Sala)} />
          <AppButton label="Exportar" icon="download-outline" variant="ghost" onPress={exportCsv} />
        </>
      }
    >
      <Field label="Buscar" value={query} onChangeText={setQuery} placeholder="Nome, tipo ou recurso" />
      <ChoiceGroup label="Tipo" value={type} onChange={setType} options={types} />
      {filtered.map((sala) => (
        <Card key={sala.id_sala}>
          {sala.fotos?.[0] ? <Image source={{ uri: sala.fotos[0] }} style={{ height: 130, borderRadius: 12 }} /> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{sala.nome}</Text>
              <Text style={uiStyles.muted}>{sala.tipo} - {sala.capacidade} pessoas</Text>
              <Text style={uiStyles.muted}>{sala.ativa ? 'Disponivel' : 'Indisponivel'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <IconButton icon="create-outline" label="Editar" onPress={() => setEditing(sala)} />
              <IconButton icon="trash-outline" label="Excluir" onPress={() => remove(sala)} />
            </View>
          </View>
          {sala.descricao ? <Text style={uiStyles.muted}>{sala.descricao}</Text> : null}
        </Card>
      ))}
      <RoomForm data={data} sala={editing} visible={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />
    </Screen>
  );
}

function RoomForm({
  data,
  sala,
  visible,
  onClose,
  onSaved,
}: {
  data: AdminData;
  sala: Sala | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(sala?.nome || '');
  const [capacidade, setCapacidade] = useState(String(sala?.capacidade || ''));
  const [tipo, setTipo] = useState(sala?.tipo || data.roomTypes[0] || '4 Sala de Reuniao');
  const [descricao, setDescricao] = useState(sala?.descricao || '');
  const [recursos, setRecursos] = useState(sala?.recursos || '');
  const [ativa, setAtiva] = useState(sala?.ativa === false ? 'Nao' : 'Sim');
  const [fotos, setFotos] = useState<string[]>(sala?.fotos || []);

  React.useEffect(() => {
    setNome(sala?.nome || '');
    setCapacidade(String(sala?.capacidade || ''));
    setTipo(sala?.tipo || data.roomTypes[0] || '4 Sala de Reuniao');
    setDescricao(sala?.descricao || '');
    setRecursos(sala?.recursos || '');
    setAtiva(sala?.ativa === false ? 'Nao' : 'Sim');
    setFotos(sala?.fotos || []);
  }, [sala, data.roomTypes]);

  async function pickPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      base64: false,
      quality: 0.7,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setFotos(result.assets.slice(0, 5).map((asset) => asset.uri));
    }
  }

  async function save() {
    if (!nome || !capacidade) {
      Alert.alert('Salas', 'Informe nome e capacidade.');
      return;
    }
    try {
      const payload = {
        nome,
        capacidade: Number(capacidade),
        tipoSala: tipo,
        descricao,
        recursos,
        ativa: ativa === 'Sim',
        criado_em: sala?.criado_em || new Date().toISOString().slice(0, 10),
        fotos,
      };
      if (sala?.id_sala) {
        await api.send(`/salas/${sala.id_sala}`, 'PUT', payload);
      } else {
        await api.send('/salas', 'POST', payload);
      }
      onSaved();
    } catch (error) {
      Alert.alert('Salas', error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    }
  }

  return (
    <Sheet visible={visible} title={sala?.id_sala ? 'Editar sala' : 'Nova sala'} onClose={onClose}>
      <Field label="Nome" value={nome} onChangeText={setNome} />
      <Field label="Capacidade" value={capacidade} onChangeText={setCapacidade} keyboardType="numeric" />
      <ChoiceGroup label="Tipo" value={tipo} onChange={setTipo} options={data.roomTypes.length ? data.roomTypes : [tipo]} />
      <Field label="Descricao" value={descricao} onChangeText={setDescricao} multiline />
      <Field label="Recursos" value={recursos} onChangeText={setRecursos} multiline />
      <ChoiceGroup label="Ativa" value={ativa} onChange={setAtiva} options={['Sim', 'Nao']} />
      <AppButton label={`Selecionar fotos (${fotos.length}/5)`} variant="ghost" icon="image-outline" onPress={pickPhotos} />
      <AppButton label="Salvar sala" onPress={save} />
    </Sheet>
  );
}
