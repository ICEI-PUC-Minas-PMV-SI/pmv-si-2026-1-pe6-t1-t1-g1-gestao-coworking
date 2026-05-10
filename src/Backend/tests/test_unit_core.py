import base64
import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.schemas import ClienteCreate, NotificacaoCreate, ReservaCreate, SalaCreate
from app.security import criar_token, hash_senha, verificar_senha, verificar_token


class SecurityUnitTests(unittest.TestCase):
    def test_hash_senha_nao_guarda_texto_puro(self):
        senha = "senha123"
        senha_hash = hash_senha(senha)

        self.assertTrue(senha_hash.startswith("sha256$"))
        self.assertNotEqual(senha_hash, senha)
        self.assertTrue(verificar_senha(senha, senha_hash))
        self.assertFalse(verificar_senha("senha-errada", senha_hash))

    def test_token_valido_retorna_subject(self):
        token = criar_token("cliente-1", minutos=5)

        self.assertEqual(verificar_token(token), "cliente-1")

    def test_token_expirado_e_rejeitado(self):
        payload = {
            "sub": "cliente-1",
            "exp": int((datetime.now(timezone.utc) - timedelta(minutes=1)).timestamp()),
        }
        body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
        token = f"{body}.assinatura-invalida"

        with self.assertRaises(HTTPException):
            verificar_token(token)


class SchemaUnitTests(unittest.TestCase):
    def test_cliente_exige_cpf_com_11_digitos(self):
        with self.assertRaises(ValidationError):
            ClienteCreate(nome="Ana", cpf="123", email="ana@teste.com", senha="senha123")

    def test_sala_aceita_alias_tipo_sala(self):
        sala = SalaCreate(nome="Sala Teste", capacidade=4, tipoSala="4 Sala de Reunião")

        self.assertEqual(sala.tipo.value, "4 Sala de Reunião")

    def test_reserva_normaliza_datetime_com_timezone(self):
        reserva = ReservaCreate(
            id_cliente=1,
            id_sala=1,
            entrada="2026-06-01T10:00:00-03:00",
            saida="2026-06-01T11:00:00-03:00",
        )

        self.assertIsNone(reserva.entrada.tzinfo)
        self.assertEqual(reserva.entrada.hour, 10)

    def test_notificacao_normaliza_alias_sem_acentos(self):
        notificacao = NotificacaoCreate(
            id_cliente=1,
            corpo="Reserva confirmada",
            tipo="Confirmacao de Reserva",
        )

        self.assertIn("Reserva", notificacao.tipo.value)


if __name__ == "__main__":
    unittest.main()
