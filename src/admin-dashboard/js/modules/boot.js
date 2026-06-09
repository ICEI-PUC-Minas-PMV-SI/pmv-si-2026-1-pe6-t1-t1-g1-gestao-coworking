// Inicializacao do painel
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

async function boot() {
  const authenticated = await ensureAdminSession();
  if (!authenticated) return;

  if (typeof readPlanDraft === 'function') {
    pageState.planDraft = readPlanDraft();
  }

  bindStaticControls();
  bindSearchControls();
  bindNotificationBell();

  try {
    if (currentPage === 'dashboard') {
      let data = await loadCoreData().catch(() => bootstrapAndRetry(loadCoreData));
      if (!hasInitialData(data)) {
        data = await bootstrapAndRetry(loadCoreData);
      }
      renderDashboard(data);
      return;
    }

    if (currentPage === 'users') {
      let [clientes, planos, assinaturas] = await Promise.all([
        apiGet('/clientes'),
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/clientes'),
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ])));
      if (!clientes.length || !planos.length) {
        [clientes, planos, assinaturas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/clientes'),
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]));
      }
      applyUserFiltersFromUrl();
      renderUsers({ clientes, planos, assinaturas });
      return;
    }

    if (currentPage === 'rooms') {
      let salas = await apiGet('/salas').catch(() => bootstrapAndRetry(() => apiGet('/salas')));
      if (!salas.length) {
        salas = await bootstrapAndRetry(() => apiGet('/salas'));
      }
      renderRooms({ salas });
      return;
    }

    if (currentPage === 'plans') {
      let [planos, assinaturas] = await Promise.all([
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/planos'),
        apiGet('/assinaturas'),
      ])));
      if (!planos.length) {
        [planos, assinaturas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/planos'),
          apiGet('/assinaturas'),
        ]));
      }
      renderPlans({ planos, assinaturas });
      return;
    }

    if (currentPage === 'reviews') {
      let [avaliacoes, reservas, salas] = await Promise.all([
        apiGet('/avaliacoes'),
        apiGet('/reservas?limit=100'),
        apiGet('/salas'),
      ]).catch(() => bootstrapAndRetry(async () => Promise.all([
        apiGet('/avaliacoes'),
        apiGet('/reservas?limit=100'),
        apiGet('/salas'),
      ])));
      if (!salas.length || !reservas.length) {
        [avaliacoes, reservas, salas] = await bootstrapAndRetry(async () => Promise.all([
          apiGet('/avaliacoes'),
          apiGet('/reservas?limit=100'),
          apiGet('/salas'),
        ]));
      }
      renderReviews({ avaliacoes, reservas, salas });
    }
  } catch (error) {
    showLoadError(error);
  }
}

boot();
