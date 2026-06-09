/**
 * AuthContext — gerencia login/logout e determina o papel do usuário.
 *
 * Fluxo:
 *  1. Usuário insere CPF + senha na LoginScreen.
 *  2. POST /login → API Usuário (porta 8000).
 *  3. Resposta inclui `cliente.is_admin`:
 *     - true  → App.tsx renderiza o painel admin (screens do admin-mobile)
 *     - false → App.tsx renderiza as tabs de usuário
 *
 * AuthUser é compatível com o tipo Cliente do admin-mobile
 * (usa id_cliente como campo de ID).
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import { adminApi, setApiToken } from '../api/client';
import type { Cliente } from '../types';

// O backend pode responder de duas formas:
//  1) Login "rico":  { access_token, cliente: { id, ..., is_admin } }
//  2) Agregador:     { access_token }  → buscamos o cliente por CPF em /clientes
type ClientePayload = {
  id?: number;
  id_cliente?: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string | null;
  is_admin?: boolean;
};

type LoginResponse = {
  access_token?: string;
  token_type?: string;
  cliente?: ClientePayload;
  erro?: string;
};

// AuthUser é compatível com o tipo Cliente (usa id_cliente)
export type AuthUser = Cliente & { is_admin: boolean };

// Modo de visualização do administrador:
//  'painel' → painel administrativo
//  'app'    → aplicação do usuário (mesma experiência do app web)
export type ViewMode = 'painel' | 'app';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loginLoading: boolean;
  loginError: string | null;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState<string | null>(null);
  const [viewMode, setViewMode]         = useState<ViewMode>('painel');

  const login = useCallback(async (cpf: string, senha: string) => {
    if (!cpf || !senha) { setLoginError('Informe CPF e senha.'); return; }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await adminApi.send<LoginResponse>('/login', 'POST', { cpf, senha });

      if (res.erro) { setLoginError(res.erro); return; }
      if (!res.access_token) { setLoginError('Resposta de login inválida do servidor.'); return; }

      setApiToken(res.access_token);
      setToken(res.access_token);

      // Forma 1 (login rico) já traz o cliente. Forma 2 (agregador) traz só o
      // token → buscamos o cliente correspondente ao CPF em /clientes.
      let cliente: ClientePayload | undefined = res.cliente;
      if (!cliente) {
        const lista = await adminApi.get<ClientePayload[]>('/clientes').catch(() => [] as ClientePayload[]);
        cliente = lista.find((c) => String(c.cpf).replace(/\D/g, '') === cpf);
      }

      if (!cliente) {
        setApiToken(null);
        setToken(null);
        setLoginError('Login efetuado, mas não foi possível carregar os dados do cliente.');
        return;
      }

      // Admin sempre começa pelo painel administrativo.
      setViewMode('painel');

      // Mapeia id/id_cliente para compatibilidade com as telas (que usam id_cliente)
      setUser({
        id_cliente: cliente.id_cliente ?? cliente.id ?? 0,
        nome:       cliente.nome,
        cpf:        cliente.cpf,
        email:      cliente.email,
        telefone:   cliente.telefone ?? null,
        is_admin:   Boolean(cliente.is_admin),
        ativo:      true,
      });
    } catch (err) {
      setApiToken(null);
      setLoginError(err instanceof Error ? err.message : 'Não foi possível realizar o login.');
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setApiToken(null);
    setToken(null);
    setUser(null);
    setLoginError(null);
    setViewMode('painel');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loginLoading, loginError, login, logout, viewMode, setViewMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
