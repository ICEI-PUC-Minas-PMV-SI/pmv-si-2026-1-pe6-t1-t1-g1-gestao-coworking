import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { bootstrapAndLoad, emptyAdminData, loadAdminData } from './src/api/adminData';
import { api, API_BASE_URL, setApiToken } from './src/api/client';
import { Drawer, menuItems } from './src/components/Drawer';
import { TopBar } from './src/components/TopBar';
import { AppButton, Card, Field, LoadingState, Sheet, styles as uiStyles } from './src/components/ui';
import { DashboardScreen, ReservationsScreen } from './src/screens/DashboardScreen';
import { UsersScreen } from './src/screens/UsersScreen';
import { RoomsScreen } from './src/screens/RoomsScreen';
import { PlansScreen } from './src/screens/PlansScreen';
import { ReviewsScreen } from './src/screens/ReviewsScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { colors, spacing } from './src/theme';
import type { AdminData, Cliente, ScreenKey } from './src/types';

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<'view' | 'edit' | 'password'>('view');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authUser, setAuthUser] = useState<Cliente | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [data, setData] = useState<AdminData>(emptyAdminData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadAdminData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      load();
    }
  }, [authUser, load]);

  const title = useMemo(() => menuItems.find((item) => item.key === screen)?.label || 'Dashboard', [screen]);
  const unread = data.notificacoes.filter((item) => !item.lida).length;

  async function bootstrap() {
    try {
      setLoading(true);
      setData(await bootstrapAndLoad());
      setError(null);
    } catch (err) {
      Alert.alert('Bootstrap', err instanceof Error ? err.message : 'Nao foi possivel preparar o banco.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(cpf: string, senha: string) {
    if (!cpf || !senha) {
      setLoginError('Informe CPF e senha para acessar o painel.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    try {
      const login = await api.send<LoginResponse>('/login', 'POST', { cpf, senha });
      setApiToken(login.access_token);
      const clientes = await api.get<Cliente[]>('/clientes');
      const user = clientes.find((cliente) => cliente.cpf === cpf) || {
        id_cliente: 0,
        nome: 'Administrador',
        cpf,
        email: '',
        telefone: '',
        ativo: true,
      };
      setAuthUser(user);
      setData(await loadAdminData());
      setError(null);
    } catch (err) {
      setApiToken(null);
      setLoginError(err instanceof Error ? err.message : 'Nao foi possivel realizar o login.');
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    setApiToken(null);
    setAuthUser(null);
    setData(emptyAdminData);
    setScreen('dashboard');
    setProfileOpen(false);
    setNotificationsOpen(false);
    setError(null);
  }

  function openProfile() {
    if (authUser) {
      setProfileName(authUser.nome || '');
      setProfileEmail(authUser.email || '');
      setProfilePhone(authUser.telefone || '');
    }
    setProfileMode('view');
    setProfileOpen(true);
  }

  async function saveProfile() {
    if (!authUser?.id_cliente) return;
    try {
      const updated = await api.send<Cliente>(`/clientes/${authUser.id_cliente}`, 'PATCH', {
        nome: profileName.trim(),
        email: profileEmail.trim(),
        telefone: profilePhone.replace(/\D/g, '') || null,
      });
      setAuthUser(updated);
      setProfileMode('view');
      await load();
    } catch (err) {
      Alert.alert('Perfil', err instanceof Error ? err.message : 'Nao foi possivel atualizar o perfil.');
    }
  }

  async function savePassword() {
    if (!authUser?.id_cliente) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Senha', 'A confirmacao da senha nao confere.');
      return;
    }
    try {
      await api.send(`/clientes/${authUser.id_cliente}/senha`, 'PATCH', {
        senha_atual: currentPassword,
        nova_senha: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMode('view');
      Alert.alert('Senha', 'Senha atualizada com sucesso.');
    } catch (err) {
      Alert.alert('Senha', err instanceof Error ? err.message : 'Nao foi possivel alterar a senha.');
    }
  }

  function renderScreen() {
    if (loading && data === emptyAdminData) return <LoadingState />;

    const props = { data, loading, onRefresh: load };
    if (screen === 'dashboard') return <DashboardScreen {...props} onNavigate={(next) => setScreen(next as ScreenKey)} />;
    if (screen === 'reservas') return <ReservationsScreen {...props} />;
    if (screen === 'usuarios') return <UsersScreen {...props} />;
    if (screen === 'salas') return <RoomsScreen {...props} />;
    if (screen === 'planos') return <PlansScreen {...props} />;
    if (screen === 'avaliacoes') return <ReviewsScreen {...props} />;
    return <DashboardScreen {...props} onNavigate={(next) => setScreen(next as ScreenKey)} />;
  }

  if (!authUser) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen loading={loginLoading} error={loginError} onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <TopBar
          title={title}
          unread={unread}
          onMenu={() => setDrawerOpen(true)}
          onNotifications={() => setNotificationsOpen(true)}
          onProfile={openProfile}
          userName={authUser.nome}
        />
        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>A API nao respondeu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.apiText}>URL atual: {API_BASE_URL}</Text>
            <View style={styles.errorActions}>
              <AppButton label="Tentar novamente" onPress={load} />
              <AppButton label="Criar banco inicial" variant="ghost" onPress={bootstrap} />
            </View>
          </View>
        ) : (
          renderScreen()
        )}
        <Drawer visible={drawerOpen} current={screen} onClose={() => setDrawerOpen(false)} onNavigate={setScreen} />
        <Sheet
          visible={profileOpen}
          title={profileMode === 'edit' ? 'Editar perfil' : profileMode === 'password' ? 'Alterar senha' : 'Perfil do administrador'}
          onClose={() => setProfileOpen(false)}
        >
          {profileMode === 'view' ? (
            <>
              <Card>
                <Text style={styles.profileName}>{authUser.nome}</Text>
                <Text style={uiStyles.muted}>{authUser.email || 'Sem e-mail cadastrado'}</Text>
                <Text style={uiStyles.muted}>CPF: {authUser.cpf}</Text>
                <Text style={uiStyles.muted}>Telefone: {authUser.telefone || '-'}</Text>
                <Text style={uiStyles.muted}>Perfil: Administrador</Text>
              </Card>
              <View style={styles.profileActions}>
                <AppButton label="Editar perfil" variant="ghost" icon="create-outline" onPress={() => setProfileMode('edit')} />
                <AppButton label="Alterar senha" variant="ghost" icon="key-outline" onPress={() => setProfileMode('password')} />
                <AppButton label="Sair da conta" variant="danger" icon="log-out-outline" onPress={logout} />
              </View>
            </>
          ) : null}
          {profileMode === 'edit' ? (
            <>
              <Field label="Nome" value={profileName} onChangeText={setProfileName} />
              <Field label="E-mail" value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" />
              <Field label="Telefone" value={profilePhone} onChangeText={setProfilePhone} keyboardType="numeric" placeholder="11999999999" />
              <View style={styles.profileActions}>
                <AppButton label="Voltar" variant="ghost" onPress={() => setProfileMode('view')} />
                <AppButton label="Salvar perfil" onPress={saveProfile} />
              </View>
            </>
          ) : null}
          {profileMode === 'password' ? (
            <>
              <Field label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
              <Field label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <Field label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <View style={styles.profileActions}>
                <AppButton label="Voltar" variant="ghost" onPress={() => setProfileMode('view')} />
                <AppButton label="Salvar senha" onPress={savePassword} />
              </View>
            </>
          ) : null}
        </Sheet>
        <Sheet visible={notificationsOpen} title="Notificacoes" onClose={() => setNotificationsOpen(false)}>
          <NotificationsScreen data={data} loading={loading} onRefresh={load} embedded />
        </Sheet>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  errorTitle: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  errorText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  apiText: { color: colors.inkSoft, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  errorActions: { gap: spacing.sm },
  profileName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  profileActions: { gap: spacing.sm },
});
