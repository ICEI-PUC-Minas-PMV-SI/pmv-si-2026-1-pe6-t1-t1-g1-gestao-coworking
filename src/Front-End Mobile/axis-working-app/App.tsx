/**
 * App.tsx — Axis Work (app unificado)
 *
 * Fluxo:
 *   ┌─ Não autenticado ─────────────────────────────────────────┐
 *   │  LoginScreen                                               │
 *   └────────────────────────────────────────────────────────────┘
 *               │ login bem-sucedido
 *               ▼
 *   ┌─ is_admin = true ──────────────────┐
 *   │  AdminApp (replicado do admin-mobile)│
 *   │  TopBar + Drawer + 6 screens        │
 *   └─────────────────────────────────────┘
 *
 *   ┌─ is_admin = false ─────────────────────────────────────────┐
 *   │  Bottom tabs: Home / Salas / Reservas / Perfil             │
 *   └────────────────────────────────────────────────────────────┘
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Auth
import { AuthProvider, useAuth } from './src/context/AuthContext';

// API
import { adminApi } from './src/api/client';
import { bootstrapAndLoad, emptyAdminData, loadAdminData } from './src/api/adminData';

// Admin components (do admin-mobile)
import { Drawer, menuItems } from './src/components/Drawer';
import { TopBar } from './src/components/TopBar';
import { AppButton, Card, Field, LoadingState, Sheet, styles as uiStyles } from './src/components/ui';

// Admin screens (do admin-mobile)
import { DashboardScreen, ReservationsScreen } from './src/screens/admin/DashboardScreen';
import { UsersScreen }          from './src/screens/admin/UsersScreen';
import { RoomsScreen }          from './src/screens/admin/RoomsScreen';
import { PlansScreen }          from './src/screens/admin/PlansScreen';
import { ReviewsScreen }        from './src/screens/admin/ReviewsScreen';
import { NotificationsScreen }  from './src/screens/admin/NotificationsScreen';

// User screens
import { LoginScreen }    from './src/screens/LoginScreen';
import { HomeScreen }     from './src/screens/user/HomeScreen';
import { SalasScreen }    from './src/screens/user/SalasScreen';
import { ReservasScreen } from './src/screens/user/ReservasScreen';
import { PerfilScreen }   from './src/screens/user/PerfilScreen';
import { PlanoScreen }    from './src/screens/user/PlanoScreen';
import { MeuPlanoScreen } from './src/screens/user/MeuPlanoScreen';
import { NotificacoesScreen } from './src/screens/user/NotificacoesScreen';
import { SobreNosScreen } from './src/screens/user/SobreNosScreen';
import { ReservarSalaScreen } from './src/screens/user/ReservarSalaScreen';
import { EditarReservaScreen } from './src/screens/user/EditarReservaScreen';

import { colors, spacing } from './src/theme';
import type { AdminData, Cliente, ScreenKey } from './src/types';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon (emoji simples) ─────────────────────────────────
function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

// ── Stack de Home (sub-telas) ────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePrincipal" component={HomeScreen} />
      <Stack.Screen name="Planos"        component={PlanoScreen} />
      <Stack.Screen name="SobreNos"      component={SobreNosScreen} />
      <Stack.Screen name="Notificacoes"  component={NotificacoesScreen} />
    </Stack.Navigator>
  );
}

// ── Stack de Salas (lista → reservar sala) ───────────────────
function SalasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SalasLista" component={SalasScreen} />
      <Stack.Screen name="Sala"       component={ReservarSalaScreen} />
    </Stack.Navigator>
  );
}

// ── Stack de Reservas (lista → alterar reserva) ──────────────
function ReservasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReservasLista"  component={ReservasScreen} />
      <Stack.Screen name="EditarReserva"  component={EditarReservaScreen} />
    </Stack.Navigator>
  );
}

// ── Stack de Perfil (conta → meu plano / notificações / planos) ──
function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilPrincipal" component={PerfilScreen} />
      <Stack.Screen name="MeuPlano"        component={MeuPlanoScreen} />
      <Stack.Screen name="Notificacoes"    component={NotificacoesScreen} />
      <Stack.Screen name="Planos"          component={PlanoScreen} />
    </Stack.Navigator>
  );
}

// ── Bottom tabs do usuário ───────────────────────────────────
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          paddingBottom: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"     component={HomeStack}      options={{ tabBarLabel: 'Home',     tabBarIcon: () => <TabIcon icon="🏠" /> }} />
      <Tab.Screen name="Salas"    component={SalasStack}     options={{ tabBarLabel: 'Salas',    tabBarIcon: () => <TabIcon icon="🏢" /> }} />
      <Tab.Screen name="Reservas" component={ReservasStack}  options={{ tabBarLabel: 'Reservas', tabBarIcon: () => <TabIcon icon="📅" /> }} />
      <Tab.Screen name="Perfil"   component={PerfilStack}    options={{ tabBarLabel: 'Perfil',   tabBarIcon: () => <TabIcon icon="👤" /> }} />
    </Tab.Navigator>
  );
}

// Placeholder da aba "Entrar" — nunca é exibido (o tabPress é interceptado).
function LoginRedirect() {
  return null;
}

// ── Bottom tabs públicas (visitante, sem login) ──────────────
// Mesma navegação do site web: Início / Salas / Planos / Sobre Nós + opção "Entrar".
function PublicTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          paddingBottom: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Home"   component={HomeScreen}    options={{ tabBarLabel: 'Início',     tabBarIcon: () => <TabIcon icon="🏠" /> }} />
      <Tab.Screen name="Salas"  component={SalasStack}    options={{ tabBarLabel: 'Salas',      tabBarIcon: () => <TabIcon icon="🏢" /> }} />
      <Tab.Screen name="Planos" component={PlanoScreen}   options={{ tabBarLabel: 'Planos',     tabBarIcon: () => <TabIcon icon="💳" /> }} />
      <Tab.Screen name="Sobre"  component={SobreNosScreen} options={{ tabBarLabel: 'Sobre Nós', tabBarIcon: () => <TabIcon icon="ℹ️" /> }} />
      <Tab.Screen
        name="Entrar"
        component={LoginRedirect}
        options={{ tabBarLabel: 'Entrar', tabBarIcon: () => <TabIcon icon="🔑" /> }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Não troca de aba: empurra a tela de login (full screen).
            e.preventDefault();
            navigation.navigate('Login');
          },
        })}
      />
    </Tab.Navigator>
  );
}

// ── App público (visitante): tabs + tela de login sob demanda ─
function PublicApp() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PublicTabs" component={PublicTabs} />
      <Stack.Screen name="Login"      component={LoginScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

// ── Painel admin (estrutura do admin-mobile) ─────────────────
function AdminApp() {
  const { user, logout, setViewMode } = useAuth();

  const [screen, setScreen]             = useState<ScreenKey>('dashboard');
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [profileOpen, setProfileOpen]   = useState(false);
  const [profileMode, setProfileMode]   = useState<'view' | 'edit' | 'password'>('view');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileName, setProfileName]   = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [data, setData]     = useState<AdminData>(emptyAdminData);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loadAdminData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const title  = useMemo(() => menuItems.find((item) => item.key === screen)?.label || 'Dashboard', [screen]);
  const unread = data.notificacoes.filter((item) => !item.lida).length;

  async function bootstrap() {
    try {
      setLoading(true);
      setData(await bootstrapAndLoad());
      setError(null);
    } catch (err) {
      Alert.alert('Bootstrap', err instanceof Error ? err.message : 'Não foi possível preparar o banco.');
    } finally {
      setLoading(false);
    }
  }

  function openProfile() {
    if (user) {
      setProfileName(user.nome || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.telefone || '');
    }
    setProfileMode('view');
    setProfileOpen(true);
  }

  async function saveProfile() {
    if (!user?.id_cliente) return;
    try {
      await adminApi.send<Cliente>(`/clientes/${user.id_cliente}`, 'PATCH', {
        nome:      profileName.trim(),
        email:     profileEmail.trim(),
        telefone:  profilePhone.replace(/\D/g, '') || null,
      });
      setProfileMode('view');
      await load();
    } catch (err) {
      Alert.alert('Perfil', err instanceof Error ? err.message : 'Não foi possível atualizar o perfil.');
    }
  }

  async function savePassword() {
    if (!user?.id_cliente) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Senha', 'A confirmação da senha não confere.');
      return;
    }
    try {
      await adminApi.send(`/clientes/${user.id_cliente}/senha`, 'PATCH', {
        senha_atual: currentPassword,
        nova_senha:  newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileMode('view');
      Alert.alert('Senha', 'Senha atualizada com sucesso.');
    } catch (err) {
      Alert.alert('Senha', err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    }
  }

  function renderScreen() {
    if (loading && data === emptyAdminData) return <LoadingState />;

    const props = { data, loading, onRefresh: load };
    if (screen === 'dashboard')  return <DashboardScreen {...props} onNavigate={(next) => setScreen(next as ScreenKey)} />;
    if (screen === 'reservas')   return <ReservationsScreen {...props} />;
    if (screen === 'usuarios')   return <UsersScreen   {...props} />;
    if (screen === 'salas')      return <RoomsScreen   {...props} />;
    if (screen === 'planos')     return <PlansScreen   {...props} />;
    if (screen === 'avaliacoes') return <ReviewsScreen {...props} />;
    return <DashboardScreen {...props} onNavigate={(next) => setScreen(next as ScreenKey)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar
        title={title}
        unread={unread}
        onMenu={() => setDrawerOpen(true)}
        onNotifications={() => setNotificationsOpen(true)}
        onProfile={openProfile}
        userName={user?.nome}
      />

      {error ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>A API não respondeu</Text>
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>{error}</Text>
          <AppButton label="Tentar novamente" onPress={load} />
          <AppButton label="Criar banco inicial" variant="ghost" onPress={bootstrap} />
        </View>
      ) : renderScreen()}

      <Drawer
        visible={drawerOpen}
        current={screen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={setScreen}
        onOpenApp={() => setViewMode('app')}
      />

      {/* Sheet de perfil */}
      <Sheet visible={profileOpen} title={profileMode === 'view' ? 'Perfil do administrador' : profileMode === 'edit' ? 'Editar perfil' : 'Alterar senha'} onClose={() => setProfileOpen(false)}>
        {profileMode === 'view' ? (
          <>
            <Card>
              <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 4 }}>{user?.nome}</Text>
              <Text style={uiStyles.muted}>{user?.email || 'Sem e-mail'}</Text>
              <Text style={uiStyles.muted}>CPF: {user?.cpf}</Text>
              <Text style={uiStyles.muted}>Perfil: Administrador</Text>
            </Card>
            <View style={{ gap: spacing.sm }}>
              <AppButton label="Editar perfil" variant="ghost" icon="create-outline" onPress={() => setProfileMode('edit')} />
              <AppButton label="Alterar senha" variant="ghost" icon="key-outline"    onPress={() => setProfileMode('password')} />
              <AppButton label="Sair da conta" variant="danger" icon="log-out-outline" onPress={logout} />
            </View>
          </>
        ) : profileMode === 'edit' ? (
          <>
            <Field label="Nome"     value={profileName}  onChangeText={setProfileName} />
            <Field label="E-mail"   value={profileEmail} onChangeText={setProfileEmail} keyboardType="email-address" />
            <Field label="Telefone" value={profilePhone} onChangeText={setProfilePhone} keyboardType="numeric" />
            <View style={{ gap: spacing.sm }}>
              <AppButton label="Voltar" variant="ghost" onPress={() => setProfileMode('view')} />
              <AppButton label="Salvar" onPress={saveProfile} />
            </View>
          </>
        ) : (
          <>
            <Field label="Senha atual"         value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <Field label="Nova senha"          value={newPassword}     onChangeText={setNewPassword}     secureTextEntry />
            <Field label="Confirmar nova senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <View style={{ gap: spacing.sm }}>
              <AppButton label="Voltar" variant="ghost" onPress={() => setProfileMode('view')} />
              <AppButton label="Salvar senha" onPress={savePassword} />
            </View>
          </>
        )}
      </Sheet>

      {/* Sheet de notificações */}
      <Sheet visible={notificationsOpen} title="Notificações" onClose={() => setNotificationsOpen(false)}>
        <NotificationsScreen data={data} loading={loading} onRefresh={load} embedded />
      </Sheet>
    </SafeAreaView>
  );
}

// ── Navegação raiz ───────────────────────────────────────────
function RootNavigator() {
  const { user, viewMode } = useAuth();

  if (!user) {
    // Visitante: abre direto na versão pública (browse). O login só é exibido
    // ao tocar na opção "Entrar".
    return <PublicApp />;
  }

  // Admin pode alternar entre o painel administrativo e a aplicação do usuário.
  if (user.is_admin && viewMode === 'painel') {
    return <AdminApp />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
    </Stack.Navigator>
  );
}

// ── App raiz ─────────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
