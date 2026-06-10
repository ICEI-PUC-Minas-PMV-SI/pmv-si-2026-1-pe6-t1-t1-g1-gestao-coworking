/**
 * useUnreadCount — contador de notificações não lidas do usuário logado.
 *
 * Recarrega sempre que a tela em que está montado ganha foco, então o badge
 * do sino reflete leituras e novas notificações sem reabrir o app. Retorna 0
 * para visitantes (sem usuário).
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/client';
import type { Notificacao } from '../types';

export function useUnreadCount(): number {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id_cliente) {
      setUnread(0);
      return;
    }
    try {
      const nots = await userApi.get<Notificacao[]>(`/notificacoes/cliente/${user.id_cliente}`);
      setUnread(nots.filter((n) => !n.lida).length);
    } catch {
      /* contador é best-effort — silencia falhas de rede */
    }
  }, [user?.id_cliente]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return unread;
}
