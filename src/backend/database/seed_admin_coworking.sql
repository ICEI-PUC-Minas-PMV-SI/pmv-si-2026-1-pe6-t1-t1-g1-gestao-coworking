SET client_encoding = 'UTF8';

BEGIN;

TRUNCATE TABLE
  notificacao,
  notificacoes,
  avaliacao,
  avaliacoes,
  assinaturas,
  reservas,
  planos,
  sala,
  salas,
  cliente,
  usuario_cliente
RESTART IDENTITY CASCADE;

INSERT INTO cliente (id_cliente, nome, cpf, email, telefone, senha) VALUES
  (1, 'Camila Souza', '11111111111', 'camila.souza@axis.work', '11981000001', 'senha123'),
  (2, 'João Mendes', '22222222222', 'joao.mendes@studiomesh.com', '11981000002', 'senha123'),
  (3, 'Marina Reis', '33333333333', 'marina@axis.work', '11981000003', 'senha123'),
  (4, 'Estúdio Rota Verde', '44444444444', 'contato@rotaverde.co', '11981000004', 'senha123'),
  (5, 'Pedro Lacerda', '55555555555', 'pedro@lacerda.dev', '11981000005', 'senha123'),
  (6, 'Aline Vasques', '66666666666', 'aline.v@meshlab.io', '11981000006', 'senha123'),
  (7, 'Ricardo Barros', '77777777777', 'ricardo@barrosadv.com', '11981000007', 'senha123'),
  (8, 'Studio Cinco', '88888888888', 'ops@studiocinco.cc', '11981000008', 'senha123');

-- Conta de administrador padrão (acesso ao painel). A senha em texto puro é
-- aceita pelo verificador (fallback), como os demais clientes do seed.
-- Sem este registro, o bootstrap deixaria o sistema sem nenhum admin.
INSERT INTO cliente (id_cliente, nome, cpf, email, telefone, senha, is_admin) VALUES
  (9, 'Administrador', '00000000000', 'admin@axiswork.com', NULL, 'admin', true);

INSERT INTO usuario_cliente (id_cliente, nome, cpf, email, telefone, senha) VALUES
  (1, 'Camila Souza', '11111111111', 'camila.souza@axis.work', '11981000001', 'senha123'),
  (2, 'João Mendes', '22222222222', 'joao.mendes@studiomesh.com', '11981000002', 'senha123'),
  (3, 'Marina Reis', '33333333333', 'marina@axis.work', '11981000003', 'senha123'),
  (4, 'Estúdio Rota Verde', '44444444444', 'contato@rotaverde.co', '11981000004', 'senha123'),
  (5, 'Pedro Lacerda', '55555555555', 'pedro@lacerda.dev', '11981000005', 'senha123'),
  (6, 'Aline Vasques', '66666666666', 'aline.v@meshlab.io', '11981000006', 'senha123'),
  (7, 'Ricardo Barros', '77777777777', 'ricardo@barrosadv.com', '11981000007', 'senha123'),
  (8, 'Studio Cinco', '88888888888', 'ops@studiocinco.cc', '11981000008', 'senha123');

INSERT INTO sala (id_sala, nome, capacidade, tipo, descricao, recursos, criado_em, ativa) VALUES
  (1, 'Sala Atlas', 8, '4 Sala de Reunião', 'Sala de reunião no 2º andar. R$ 80/h. Status no painel: ocupada.', 'Monitor 4K, videoconferência, quadro branco, wifi, café', '2026-04-01', true),
  (2, 'Auditório Norte', 60, '4 Sala de Reunião', 'Auditório no térreo. R$ 320/h. Status no painel: disponível.', 'Projetor, palco, som, wifi, apoio de recepção', '2026-04-02', true),
  (3, 'Privativa 02', 4, '2 Sala Individual', 'Sala privativa no 1º andar. R$ 1.800/mês. Status no painel: disponível.', 'Mesa fixa, armários, monitor, controle de acesso', '2026-04-03', true),
  (4, 'Sala Vértice', 12, '4 Sala de Reunião', 'Sala de reunião no 3º andar. R$ 110/h. Status no painel: manutenção.', 'Quadros brancos, TV, videoconferência, wifi', '2026-04-04', false),
  (5, 'Hot Desk Bloco A', 24, '1 Mesa de Trabalho', 'Área hot desk no 1º andar. R$ 60/dia. Status no painel: disponível.', 'Wifi, café, tomadas, lockers compartilhados', '2026-04-05', true),
  (6, 'Privativa 07', 6, '2 Sala Individual', 'Sala privativa no 2º andar. R$ 2.400/mês. Status no painel: ocupada.', 'Mesa fixa, armários, endereço fiscal, estacionamento', '2026-04-06', true),
  (7, 'Sala Cume', 10, '4 Sala de Reunião', 'Sala pendente de avaliação exibida no painel.', 'TV, quadro branco, videoconferência', '2026-04-15', true);

INSERT INTO salas (id_sala, nome, capacidade, tipo, descricao, recursos, criado_em) VALUES
  (1, 'Sala Atlas', 8, '4 Sala de Reunião', 'Sala de reunião no 2º andar. R$ 80/h. Status no painel: ocupada.', 'Monitor 4K, videoconferência, quadro branco, wifi, café', '2026-04-01'),
  (2, 'Auditório Norte', 60, '4 Sala de Reunião', 'Auditório no térreo. R$ 320/h. Status no painel: disponível.', 'Projetor, palco, som, wifi, apoio de recepção', '2026-04-02'),
  (3, 'Privativa 02', 4, '2 Sala Individual', 'Sala privativa no 1º andar. R$ 1.800/mês. Status no painel: disponível.', 'Mesa fixa, armários, monitor, controle de acesso', '2026-04-03'),
  (4, 'Sala Vértice', 12, '4 Sala de Reunião', 'Sala de reunião no 3º andar. R$ 110/h. Status no painel: manutenção.', 'Quadros brancos, TV, videoconferência, wifi', '2026-04-04'),
  (5, 'Hot Desk Bloco A', 24, '1 Mesa de Trabalho', 'Área hot desk no 1º andar. R$ 60/dia. Status no painel: disponível.', 'Wifi, café, tomadas, lockers compartilhados', '2026-04-05'),
  (6, 'Privativa 07', 6, '2 Sala Individual', 'Sala privativa no 2º andar. R$ 2.400/mês. Status no painel: ocupada.', 'Mesa fixa, armários, endereço fiscal, estacionamento', '2026-04-06'),
  (7, 'Sala Cume', 10, '4 Sala de Reunião', 'Sala pendente de avaliação exibida no painel.', 'TV, quadro branco, videoconferência', '2026-04-15');

INSERT INTO planos (id_plano, nome, acesso, preco, nivel) VALUES
  (1, 'Day Pass', '1 Mesa de Trabalho', 60.00, 1),
  (2, 'Flex', '1 Mesa de Trabalho', 480.00, 2),
  (3, 'Dedicated', '1 Mesa de Trabalho', 1180.00, 3),
  (4, 'Office', '2 Sala Individual', 3200.00, 4);

INSERT INTO assinaturas (id_assinatura, id_cliente, id_plano, status, validade, feita_em) VALUES
  (1, 1, 3, 'Ativa', '2026-05-31', '2026-02-02'),
  (2, 2, 2, 'Ativa', '2026-05-31', '2026-03-15'),
  (3, 3, 4, 'Ativa', '2026-05-31', '2026-01-05'),
  (4, 4, 4, 'Ativa', '2026-05-31', '2026-03-21'),
  (5, 5, 1, 'Vencida', '2026-04-30', '2026-04-18'),
  (6, 6, 2, 'Ativa', '2026-05-31', '2026-02-26'),
  (7, 7, 3, 'Cancelada', '2026-03-31', '2026-01-30'),
  (8, 8, 4, 'Ativa', '2026-05-31', '2026-02-11');

INSERT INTO reservas (id_reserva, id_cliente, id_sala, status, feito_em, entrada, saida) VALUES
  (1, 1, 1, 'Confirmada', '2026-04-29', '2026-04-29 09:00:00', '2026-04-29 11:00:00'),
  (2, 4, 2, 'Confirmada', '2026-04-29', '2026-04-29 10:30:00', '2026-04-29 12:30:00'),
  (3, 2, 3, 'Em Andamento', '2026-04-29', '2026-04-29 13:00:00', '2026-04-29 14:00:00'),
  (4, 3, 5, 'Confirmada', '2026-04-29', '2026-04-29 14:00:00', '2026-04-29 18:00:00'),
  (5, 2, 4, 'Cancelada', '2026-04-29', '2026-04-29 16:00:00', '2026-04-29 18:00:00'),
  (6, 1, 1, 'Finalizada', '2026-04-24', '2026-04-24 09:00:00', '2026-04-24 11:00:00'),
  (7, 2, 3, 'Finalizada', '2026-04-23', '2026-04-23 13:00:00', '2026-04-23 17:00:00'),
  (8, 4, 2, 'Finalizada', '2026-04-22', '2026-04-22 10:00:00', '2026-04-22 18:00:00'),
  (9, 5, 5, 'Finalizada', '2026-04-21', '2026-04-21 13:00:00', '2026-04-21 18:00:00'),
  (10, 6, 4, 'Finalizada', '2026-04-20', '2026-04-20 14:00:00', '2026-04-20 16:00:00'),
  (11, 7, 6, 'Finalizada', '2026-04-17', '2026-04-17 09:00:00', '2026-04-17 12:00:00'),
  (12, 8, 7, 'Finalizada', '2026-04-15', '2026-04-15 09:00:00', '2026-04-15 11:00:00');

INSERT INTO avaliacao (id_avaliacao, id_reserva, nota, corpo, criado_em) VALUES
  (1, 6, 5, 'Excelente acústica e iluminação natural. Monitor 4K funcionou perfeitamente para a apresentação do cliente. Voltarei com certeza.', '2026-04-24'),
  (2, 7, 4, 'Espaço confortável e silencioso. Só achei que o ar-condicionado estava um pouco alto demais; talvez ajustar o termostato.', '2026-04-23'),
  (3, 8, 5, 'Recebemos 48 pessoas para um workshop e tudo correu impecavelmente. A equipe de apoio foi atenciosa do início ao fim.', '2026-04-22'),
  (4, 9, 3, 'Boa estrutura, mas a área estava bem cheia no início da tarde. Difícil encontrar mesa próxima às tomadas.', '2026-04-21'),
  (5, 10, 4, 'Ótima sala para brainstorm; quadros brancos amplos e ambiente bem iluminado.', '2026-04-20');

INSERT INTO avaliacoes (id_avaliacao, id_cliente, id_sala, id_reserva, nota, corpo, criado_em) VALUES
  (1, 1, 1, 6, 5, 'Excelente acústica e iluminação natural. Monitor 4K funcionou perfeitamente para a apresentação do cliente. Voltarei com certeza.', '2026-04-24'),
  (2, 2, 3, 7, 4, 'Espaço confortável e silencioso. Só achei que o ar-condicionado estava um pouco alto demais; talvez ajustar o termostato.', '2026-04-23'),
  (3, 4, 2, 8, 5, 'Recebemos 48 pessoas para um workshop e tudo correu impecavelmente. A equipe de apoio foi atenciosa do início ao fim.', '2026-04-22'),
  (4, 5, 5, 9, 3, 'Boa estrutura, mas a área estava bem cheia no início da tarde. Difícil encontrar mesa próxima às tomadas.', '2026-04-21'),
  (5, 6, 4, 10, 4, 'Ótima sala para brainstorm; quadros brancos amplos e ambiente bem iluminado.', '2026-04-20');

INSERT INTO notificacao (id_notificacao, id_assinatura, id_reserva, corpo, tipo, lida, criado_em) VALUES
  (1, NULL, 1, 'Reserva da Sala Atlas confirmada para Camila Souza.', 'Confirmação de Reserva', false, '2026-04-29'),
  (2, NULL, 2, 'Reserva do Auditório Norte confirmada para Estúdio Rota Verde.', 'Confirmação de Reserva', false, '2026-04-29'),
  (3, 5, NULL, 'Assinatura Day Pass de Pedro Lacerda venceu em 30/04/2026.', 'Renovação de Plano', false, '2026-04-30'),
  (4, NULL, 4, 'Lembrete: Hot Desk Bloco A reservado por Marina Reis hoje às 14:00.', 'Lembrete', true, '2026-04-29'),
  (5, NULL, NULL, 'Sala Vértice marcada para manutenção preventiva.', 'Alerta', false, '2026-04-28');

INSERT INTO notificacoes (id_notificacao, id_cliente, corpo, tipo, lida, criado_em) VALUES
  (1, 1, 'Reserva da Sala Atlas confirmada para Camila Souza.', 'Confirmação de Reserva', false, '2026-04-29'),
  (2, 4, 'Reserva do Auditório Norte confirmada para Estúdio Rota Verde.', 'Confirmação de Reserva', false, '2026-04-29'),
  (3, 5, 'Assinatura Day Pass de Pedro Lacerda venceu em 30/04/2026.', 'Renovação de Plano', false, '2026-04-30'),
  (4, 3, 'Lembrete: Hot Desk Bloco A reservado por Marina Reis hoje às 14:00.', 'Lembrete', true, '2026-04-29'),
  (5, 6, 'Sala Vértice marcada para manutenção preventiva.', 'Alerta', false, '2026-04-28');

SELECT setval('cliente_id_cliente_seq', (SELECT MAX(id_cliente) FROM cliente), true);
SELECT setval('usuario_cliente_id_cliente_seq', (SELECT MAX(id_cliente) FROM usuario_cliente), true);
SELECT setval('sala_id_sala_seq', (SELECT MAX(id_sala) FROM sala), true);
SELECT setval('salas_id_sala_seq', (SELECT MAX(id_sala) FROM salas), true);
SELECT setval('planos_id_plano_seq', (SELECT MAX(id_plano) FROM planos), true);
SELECT setval('assinaturas_id_assinatura_seq', (SELECT MAX(id_assinatura) FROM assinaturas), true);
SELECT setval('reservas_id_reserva_seq', (SELECT MAX(id_reserva) FROM reservas), true);
SELECT setval('avaliacao_id_avaliacao_seq', (SELECT MAX(id_avaliacao) FROM avaliacao), true);
SELECT setval('avaliacoes_id_avaliacao_seq', (SELECT MAX(id_avaliacao) FROM avaliacoes), true);
SELECT setval('notificacao_id_notificacao_seq', (SELECT MAX(id_notificacao) FROM notificacao), true);
SELECT setval('notificacoes_id_notificacao_seq', (SELECT MAX(id_notificacao) FROM notificacoes), true);

COMMIT;
