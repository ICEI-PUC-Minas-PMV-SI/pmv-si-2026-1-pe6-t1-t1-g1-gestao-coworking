import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function expoHostUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const host = hostUri.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  return `http://${host}:8000/api`;
}

export const API_BASE_URL = normalizeBaseUrl(
  envUrl ||
    expoHostUrl() ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://127.0.0.1:8000/api'),
);

let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function request(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    return await fetch(apiUrl(path), {
      ...options,
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Tempo esgotado ao acessar ${API_BASE_URL}. Verifique se a API esta rodando com --host 0.0.0.0.`);
    }
    throw new Error(`Nao foi possivel conectar em ${API_BASE_URL}. Verifique IP, porta e rede.`);
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Falha na requisicao: ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Mantem a mensagem padrao.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await request(path);
    return parseResponse<T>(response);
  },

  async send<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse<T>(response);
  },

  bootstrap() {
    return api.send('/admin/bootstrap?confirmar=true', 'POST');
  },
};
