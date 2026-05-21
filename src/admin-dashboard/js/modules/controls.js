// Eventos globais e controles de pagina
// Arquivo extraido de admin-coworking.js para organizar o painel por dominio.

function bindStaticControls() {
  document.querySelectorAll('.nav a[data-page]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.page === currentPage);
  });

  document.querySelectorAll('.type-tabs').forEach((tabs) => {
    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.type-tab');
      if (!tab) return;

      tabs.querySelectorAll('.type-tab').forEach((item) => {
        item.classList.toggle('is-active', item === tab);
      });

      if (currentPage === 'rooms') {
        renderRooms({ salas: pageState.salas });
      }
    });
  });

  document.querySelectorAll('.view-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      toggle.querySelectorAll('button').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
    });
  });
}

function bindSearchControls() {
  const usersSearch = document.querySelector('.page[data-page="users"] .toolbar .search-mini input');
  usersSearch?.addEventListener('input', () => {
    pageState.userPagination.page = 1;
    renderUsers({
      clientes: pageState.clientes,
      planos: pageState.planos,
      assinaturas: pageState.assinaturas,
    });
  });

  if (currentPage === 'users') {
    const inviteButton = document.querySelector('.page[data-page="users"] .page-header .btn--ghost');
    const newUserButton = document.querySelector('.page[data-page="users"] .page-header .btn--primary');
    const filterIconButton = document.querySelector('.page[data-page="users"] .toolbar .icon-btn');

    inviteButton?.addEventListener('click', () => openUserFormModal());
    newUserButton?.addEventListener('click', () => openUserFormModal());
    filterIconButton?.addEventListener('click', openUserFiltersModal);
  }

  const roomsSearch = document.querySelector('.page[data-page="rooms"] .search-mini input');
  roomsSearch?.addEventListener('input', () => {
    renderRooms({ salas: pageState.salas });
  });

  if (currentPage === 'rooms') {
    const exportButton = document.querySelector('.page[data-page="rooms"] .page-header .btn--ghost');
    const newRoomButton = document.querySelector('.page[data-page="rooms"] .page-header .btn--primary');
    exportButton?.addEventListener('click', exportRoomsCsv);
    newRoomButton?.addEventListener('click', () => openRoomFormModal());
  }

  const reviewsSearch = document.querySelector('.page[data-page="reviews"] .search-mini input');
  reviewsSearch?.addEventListener('input', () => {
    pageState.reviewFilters.query = reviewsSearch.value;
    renderReviews({
      avaliacoes: pageState.avaliacoes,
      reservas: pageState.reservas,
      salas: pageState.salas,
    });
  });

  if (currentPage === 'reviews') {
    const exportButton = document.querySelector('.page-header .actions .btn--ghost');
    exportButton?.addEventListener('click', exportReviewsCsv);

    const filterButtons = document.querySelectorAll('.page[data-page="reviews"] .filter-chip');
    filterButtons[0]?.addEventListener('click', openStarsFilterModal);
    filterButtons[1]?.addEventListener('click', openStatusFilterModal);
  }

  if (currentPage === 'plans') {
    const plansSearch = document.querySelector('.topbar .search input');
    const reportButton = document.querySelector('.page[data-page="plans"] .page-header .btn--ghost');
    const newPlanButton = document.querySelector('.page[data-page="plans"] .page-header .btn--primary');
    const draftButtons = document.querySelectorAll('.page[data-page="plans"] .promo-row .btn');

    plansSearch?.addEventListener('input', () => {
      renderPlans({
        planos: pageState.planos,
        assinaturas: pageState.assinaturas,
      });
    });
    reportButton?.addEventListener('click', openRevenueReportModal);
    newPlanButton?.addEventListener('click', () => openPlanFormModal());
    draftButtons[0]?.addEventListener('click', () => {
      if (!pageState.planDraft) return;
      openPlanFormModal({
        id_plano: pageState.planDraft.id_plano,
        ...pageState.planDraft.payload,
      });
    });
    draftButtons[1]?.addEventListener('click', savePlanDraft);
    renderPlanDraftCard();
  }
}
