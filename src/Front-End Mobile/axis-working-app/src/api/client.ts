/**
 * API client unificado.
 *
 * O backend é UM único servidor FastAPI (porta 8000) e TODOS os endpoints
 * ficam sob o prefixo `/api/...` (ver backend/README.md). Antes este client
 * apontava para duas portas (8000/8001) e usava caminhos sem `/api`, o que
 * fazia o dispositivo não acessar a API.
 *
 * Agora há uma única base e toda requisição é normalizada para `/api/...`,
 * então as telas podem continuar usando caminhos como `/salas`, `/api/salas`,
 * `/login`, `/reservas/1`, etc. — todos resolvem para `BASE/api/...`.
 *
 * `userApi`, `adminApi` e `api` são o MESMO cliente (mantidos por compatibilidade
 * com as telas de usuário e do admin).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Detecta o host do Expo Dev Server (IP da máquina na rede) ──
function expoHost(): string | null {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ??
    (Constants as any).manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') return null;
  const host = hostUri.split('://').pop()!.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

// ── Base única (porta 8000) ────────────────────────────────────
function buildBase(): string {
  // Override explícito por env (.env): EXPO_PUBLIC_API_URL=http://SEU_IP:8000
  const envVal =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE ||
    process.env.EXPO_PUBLIC_USER_API ||
    process.env.EXPO_PUBLIC_ADMIN_API;
  if (envVal) return envVal.replace(/\/+$/, '');

  const host = expoHost();
  if (host) return `http://${host}:8000`;

  // Fallbacks: emulador Android → 10.0.2.2; iOS simulador → 127.0.0.1
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
}

export const API_BASE = buildBase();
// Mantidos por compatibilidade (ambos apontam para a mesma base agora)
export const USER_BASE = API_BASE;
export const ADMIN_BASE = API_BASE;
export const API_BASE_URL = API_BASE;

/** Garante exatamente um prefixo `/api` no caminho (aceita `/salas`, `api/salas`, `/api/salas`). */
function buildUrl(path: string): string {
  let p = String(path).trim().replace(/^\/+/, ''); // remove barras iniciais
  p = p.replace(/^api\//i, '');                     // remove `api/` inicial se houver
  if (p.toLowerCase() === 'api') p = '';
  return `${API_BASE}/api/${p}`;
}

// ── Auth token ────────────────────────────────────────────────
let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

// ── Fetch com timeout ─────────────────────────────────────────
async function rawFetch(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    return await fetch(url, {
      ...options,
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers ?? {}),
      },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Tempo esgotado ao acessar ${url}.`);
    }
    throw new Error(`Não foi possível conectar em ${url}. Verifique IP, porta (8000) e rede.`);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Falha na requisição: ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail ?? body.erro ?? msg;
    } catch { /* mantém mensagem padrão */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// ── Cliente HTTP (base única + prefixo /api automático) ────────
function createClient() {
  return {
    get<T>(path: string) {
      return rawFetch(buildUrl(path)).then((r) => parseResponse<T>(r));
    },
    send<T>(path: string, method: string, body?: unknown) {
      return rawFetch(buildUrl(path), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      }).then((r) => parseResponse<T>(r));
    },
    bootstrap() {
      return this.send('/admin/bootstrap?confirmar=true', 'POST');
    },
  };
}

export const userApi = createClient();
export const adminApi = createClient();
// Alias `api` → mesmo cliente (compatibilidade com as telas do admin-mobile)
export const api = adminApi;
