/**
 * Configuração compartilhada do front-end web (Axis Work).
 *
 * O backend é UM único servidor FastAPI na porta 8000, com TODOS os endpoints
 * sob o prefixo /api (ver backend/README.md). Centralizamos a base aqui para
 * que o site público e o painel administrativo usem a mesma origem.
 *
 * Para apontar para outro host/porta, basta definir window.API_BASE_URL antes
 * de carregar este arquivo (ou editar a linha abaixo).
 */
window.API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api';
window.API_ROOT_URL = window.API_BASE_URL.replace(/\/api\/?$/, '');
