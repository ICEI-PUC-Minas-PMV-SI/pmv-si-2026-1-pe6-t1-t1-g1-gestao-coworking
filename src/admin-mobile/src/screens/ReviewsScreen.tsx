import React, { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../api/client';
import { AppButton, Card, ChoiceGroup, Field, IconButton, Sheet, styles as uiStyles } from '../components/ui';
import { Screen } from '../components/Screen';
import type { AdminData, Avaliacao } from '../types';
import { colors, spacing } from '../theme';
import { formatDate, normalize } from '../utils/format';
import { shareCsv } from '../utils/csv';

export function ReviewsScreen({ data, loading, onRefresh }: { data: AdminData; loading: boolean; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [stars, setStars] = useState('Todas');
  const [status, setStatus] = useState('Todas');
  const [editing, setEditing] = useState<Avaliacao | null>(null);
  const [replying, setReplying] = useState<Avaliacao | null>(null);

  const filtered = useMemo(() => {
    return data.avaliacoes.filter((review) => {
      const reviewStatus = review.resposta_admin ? 'Respondidas' : review.nota <= 3 ? 'Moderacao' : 'Publicadas';
      const matchesQuery =
        !query || normalize(`${review.nome_usuario || ''} ${review.nome_sala || ''} ${review.corpo || ''}`).includes(normalize(query));
      const matchesStars = stars === 'Todas' || Number(review.nota) === Number(stars);
      const matchesStatus = status === 'Todas' || reviewStatus === status;
      return matchesQuery && matchesStars && matchesStatus;
    });
  }, [data.avaliacoes, query, stars, status]);

  async function exportCsv() {
    await shareCsv(
      'avaliacoes-axis-work.csv',
      ['id', 'usuario', 'sala', 'nota', 'comentario', 'resposta', 'criado_em'],
      filtered.map((review) => [review.id_avaliacao, review.nome_usuario, review.nome_sala, review.nota, review.corpo, review.resposta_admin, review.criado_em]),
    );
  }

  async function remove(review: Avaliacao) {
    Alert.alert('Excluir avaliacao', 'Deseja excluir esta avaliacao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.send(`/avaliacoes/${review.id_avaliacao}`, 'DELETE');
            onRefresh();
          } catch (error) {
            Alert.alert('Avaliacoes', error instanceof Error ? error.message : 'Nao foi possivel excluir.');
          }
        },
      },
    ]);
  }

  return (
    <Screen
      title="Avaliacoes"
      subtitle="Filtre, responda, edite e exporte feedbacks"
      refreshing={loading}
      onRefresh={onRefresh}
      actions={<AppButton label="Exportar CSV" icon="download-outline" variant="ghost" onPress={exportCsv} />}
    >
      <Field label="Buscar" value={query} onChangeText={setQuery} placeholder="Usuario, sala ou comentario" />
      <ChoiceGroup label="Estrelas" value={stars} onChange={setStars} options={['Todas', '5', '4', '3', '2', '1', '0']} />
      <ChoiceGroup label="Status" value={status} onChange={setStatus} options={['Todas', 'Publicadas', 'Moderacao', 'Respondidas']} />

      {filtered.map((review) => (
        <Card key={review.id_avaliacao}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontWeight: '700' }}>{review.nome_usuario || 'Usuario'}</Text>
              <Text style={uiStyles.muted}>{review.nome_sala || 'Sala'} - {formatDate(review.criado_em)}</Text>
              <Text style={{ color: colors.warn, fontWeight: '700' }}>{'★'.repeat(Number(review.nota || 0))}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <IconButton icon="chatbubble-ellipses-outline" label="Responder" onPress={() => setReplying(review)} />
              <IconButton icon="create-outline" label="Editar" onPress={() => setEditing(review)} />
              <IconButton icon="trash-outline" label="Excluir" onPress={() => remove(review)} />
            </View>
          </View>
          {review.corpo ? <Text style={uiStyles.muted}>{review.corpo}</Text> : null}
          {review.resposta_admin ? <Text style={{ color: colors.inkSoft }}>Resposta: {review.resposta_admin}</Text> : null}
        </Card>
      ))}

      <ReviewForm review={editing} visible={Boolean(editing)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onRefresh(); }} />
      <ReplyForm review={replying} visible={Boolean(replying)} onClose={() => setReplying(null)} onSaved={() => { setReplying(null); onRefresh(); }} />
    </Screen>
  );
}

function ReviewForm({
  review,
  visible,
  onClose,
  onSaved,
}: {
  review: Avaliacao | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nota, setNota] = useState(String(review?.nota || '5'));
  const [corpo, setCorpo] = useState(review?.corpo || '');

  React.useEffect(() => {
    setNota(String(review?.nota || '5'));
    setCorpo(review?.corpo || '');
  }, [review]);

  async function save() {
    if (!review) return;
    try {
      await api.send(`/avaliacoes/${review.id_avaliacao}`, 'PUT', {
        id_reserva: review.id_reserva,
        nota: Number(nota),
        corpo,
        criado_em: review.criado_em,
      });
      onSaved();
    } catch (error) {
      Alert.alert('Avaliacoes', error instanceof Error ? error.message : 'Nao foi possivel salvar.');
    }
  }

  return (
    <Sheet visible={visible} title="Editar avaliacao" onClose={onClose}>
      <ChoiceGroup label="Nota" value={nota} onChange={setNota} options={['5', '4', '3', '2', '1', '0']} />
      <Field label="Comentario" value={corpo} onChangeText={setCorpo} multiline />
      <AppButton label="Salvar avaliacao" onPress={save} />
    </Sheet>
  );
}

function ReplyForm({
  review,
  visible,
  onClose,
  onSaved,
}: {
  review: Avaliacao | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [resposta, setResposta] = useState(review?.resposta_admin || '');

  React.useEffect(() => setResposta(review?.resposta_admin || ''), [review]);

  async function save() {
    if (!review) return;
    try {
      await api.send(`/avaliacoes/${review.id_avaliacao}`, 'PUT', {
        id_reserva: review.id_reserva,
        nota: review.nota,
        corpo: review.corpo,
        criado_em: review.criado_em,
        resposta_admin: resposta,
        respondido_em: new Date().toISOString().slice(0, 10),
      });
      onSaved();
    } catch (error) {
      Alert.alert('Avaliacoes', error instanceof Error ? error.message : 'Nao foi possivel responder.');
    }
  }

  return (
    <Sheet visible={visible} title="Responder avaliacao" onClose={onClose}>
      <Field label="Resposta do administrador" value={resposta} onChangeText={setResposta} multiline />
      <AppButton label="Enviar resposta" onPress={save} />
    </Sheet>
  );
}
