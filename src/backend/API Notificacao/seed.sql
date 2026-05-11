BEGIN;

INSERT INTO public.cliente (id_cliente, nome, cpf, email, telefone, senha)
VALUES
    (10, 'Cliente Teste 10', '12345678901', 'cliente10@example.com', '11999999999', 'admin'),
    (11, 'Cliente Teste 11', '12345678902', 'cliente11@example.com', '11999999998', 'admin')
ON CONFLICT (id_cliente) DO NOTHING;

INSERT INTO public.planos (id_plano, nome, acesso, preco)
VALUES
    (10, 'Plano Individual', '2 Sala Individual', 199.90),
    (11, 'Plano Reuniao', '4 Sala de Reunião', 299.90)
ON CONFLICT (id_plano) DO NOTHING;

INSERT INTO public.sala (id_sala, nome, capacidade, tipo, descricao, recursos, criado_em, ativa)
VALUES
    (20, 'Sala Teste 20', 1, '2 Sala Individual', 'Sala para testes automatizados', 'Wi-Fi, Mesa', CURRENT_DATE, TRUE),
    (21, 'Sala Teste 21', 6, '4 Sala de Reunião', 'Sala de reunião para testes automatizados', 'TV, Wi-Fi', CURRENT_DATE, TRUE)
ON CONFLICT (id_sala) DO NOTHING;

INSERT INTO public.assinaturas (id_assinatura, id_cliente, id_plano, status, validade, feita_em)
VALUES
    (10, 10, 10, 'Ativa', CURRENT_DATE + INTERVAL '30 day', CURRENT_DATE),
    (11, 11, 11, 'Ativa', CURRENT_DATE + INTERVAL '30 day', CURRENT_DATE)
ON CONFLICT (id_assinatura) DO NOTHING;

INSERT INTO public.reservas (id_reserva, id_cliente, id_sala, status, feito_em, entrada, saida)
VALUES
    (20, 10, 20, 'Confirmada', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hour'),
    (21, 11, 21, 'Confirmada', CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hour')
ON CONFLICT (id_reserva) DO NOTHING;

INSERT INTO public.notificacao (id_notificacao, id_assinatura, id_reserva, corpo, tipo, lida, criado_em)
VALUES
    (10, 10, 20, 'Alerta inicial para testes', 'Alerta', FALSE, CURRENT_DATE)
ON CONFLICT (id_notificacao) DO NOTHING;

SELECT setval('public.cliente_id_cliente_seq', GREATEST((SELECT COALESCE(MAX(id_cliente), 1) FROM public.cliente), 1), true);
SELECT setval('public.planos_id_plano_seq', GREATEST((SELECT COALESCE(MAX(id_plano), 1) FROM public.planos), 1), true);
SELECT setval('public.sala_id_sala_seq', GREATEST((SELECT COALESCE(MAX(id_sala), 1) FROM public.sala), 1), true);
SELECT setval('public.assinaturas_id_assinatura_seq', GREATEST((SELECT COALESCE(MAX(id_assinatura), 1) FROM public.assinaturas), 1), true);
SELECT setval('public.reservas_id_reserva_seq', GREATEST((SELECT COALESCE(MAX(id_reserva), 1) FROM public.reservas), 1), true);
SELECT setval('public.notificacao_id_notificacao_seq', GREATEST((SELECT COALESCE(MAX(id_notificacao), 1) FROM public.notificacao), 1), true);

COMMIT;
