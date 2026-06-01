# Axis Work Admin Mobile

Aplicativo mobile em React Native/Expo para administrar o sistema de coworking Axis Work.

## Estrutura

- `src/api`: cliente HTTP e carregamento centralizado dos dados.
- `src/components`: componentes reutilizaveis do app.
- `src/screens`: telas do painel administrativo.
- `src/utils`: formatacao, CSV e compartilhamento.
- `src/theme.ts`: tokens visuais do app.
- `src/types.ts`: contratos usados pelo frontend mobile.

## Funcionalidades

- Dashboard com indicadores, ultimas reservas, relatorio de receita e criacao de reserva.
- Reservas com criacao, filtro por status e exportacao CSV.
- Usuarios com busca, filtros, paginacao, criacao, edicao, exclusao e troca de plano.
- Salas com criacao, edicao, exclusao, selecao de fotos e exportacao CSV.
- Planos com criacao, edicao, exclusao, beneficios e relatorio de rentabilidade.
- Avaliacoes com filtros, edicao, exclusao, resposta e exportacao CSV.
- Notificacoes com criacao de gatilhos para usuarios, leitura, detalhes e exclusao.

## Executar

```bash
npm install
npm run start
```

A API precisa estar ativa na porta `8000`. Em Android Emulator, use:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
npm run android
```

Em dispositivo fisico, troque `EXPO_PUBLIC_API_BASE_URL` pelo IP da maquina na rede, por exemplo:

```bash
set EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8000/api
npm run start
```

Para que um celular fisico consiga acessar a API, suba o backend ouvindo na rede:

```bash
cd ../backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

O app tenta detectar automaticamente o IP usado pelo Expo e acessar `http://IP_DA_MAQUINA:8000/api`. Se a rede bloquear ou se a API estiver em outro host, use `EXPO_PUBLIC_API_BASE_URL`.
