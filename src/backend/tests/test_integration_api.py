import json
import os
import sys
import time
import unittest
import urllib.error
import urllib.request
from datetime import date, timedelta


API_BASE_URL = os.getenv("AXIS_API_BASE_URL", "http://127.0.0.1:8001")


def request(method, path, payload=None, expected=(200,)):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API_BASE_URL + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            parsed = json.loads(body) if body else None
            status_code = response.status
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body) if body else None
        except json.JSONDecodeError:
            parsed = body
        status_code = exc.code
    except urllib.error.URLError as exc:
        raise unittest.SkipTest(f"API indisponivel em {API_BASE_URL}: {exc}") from exc

    if status_code not in expected:
        raise AssertionError(f"{method} {path} -> {status_code}: {parsed}")
    return parsed, status_code


class ApiIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        request("GET", "/health")
        cls.stamp = str(int(time.time()))[-8:]
        cls.created = {
            "cliente": None,
            "sala": None,
            "plano": None,
            "assinatura": None,
            "reserva": None,
            "avaliacao": None,
            "notificacao": None,
        }

    @classmethod
    def tearDownClass(cls):
        cleanup = [
            ("avaliacao", lambda value: ("DELETE", f"/api/avaliacoes/{value}", (204,))),
            ("notificacao", lambda value: ("DELETE", f"/notificacoes/{value}", (200,))),
            ("reserva", lambda value: ("DELETE", f"/api/reservas/{value}", (204,))),
            ("assinatura", lambda value: ("DELETE", f"/api/assinaturas/{value}", (204,))),
            ("plano", lambda value: ("DELETE", f"/api/planos/{value}", (204,))),
            ("sala", lambda value: ("DELETE", f"/api/salas/{value}", (204,))),
            ("cliente", lambda value: ("DELETE", f"/api/clientes/{value}", (204,))),
        ]
        for key, factory in cleanup:
            value = cls.created.get(key)
            if not value:
                continue
            try:
                method, path, expected = factory(value)
                request(method, path, expected=expected)
            except Exception:
                pass

    def test_01_cliente_login_patch(self):
        cpf = ("97" + self.stamp + "1")[:11].ljust(11, "5")
        payload = {
            "nome": "Teste Integracao",
            "cpf": cpf,
            "email": f"integracao.{self.stamp}@axis.test",
            "telefone": "11999990000",
            "senha": "senha123",
        }

        cliente, _ = request("POST", "/api/clientes", payload, expected=(201,))
        self.created["cliente"] = cliente["id_cliente"]

        login, _ = request("POST", "/api/login", {"cpf": cpf, "senha": "senha123"})
        self.assertTrue(login["access_token"])

        atualizado, _ = request(
            "PATCH",
            f"/api/clientes/{cliente['id_cliente']}",
            {"nome": "Teste Integracao Editado", "telefone": "11888880000"},
        )
        self.assertEqual(atualizado["cpf"], cpf)
        self.assertEqual(atualizado["nome"], "Teste Integracao Editado")

    def test_02_sala_plano_assinatura(self):
        sala, _ = request(
            "POST",
            "/api/salas",
            {
                "nome": f"Sala Integracao {self.stamp}",
                "capacidade": 4,
                "tipoSala": "1 Mesa de Trabalho",
                "descricao": "Sala criada por teste de integracao",
                "recursos": "Wi-Fi",
            },
            expected=(201,),
        )
        self.created["sala"] = sala["id_sala"]

        plano, _ = request(
            "POST",
            "/api/planos",
            {"nome": f"Plano Integracao {self.stamp}", "acesso": "1 Mesa de Trabalho", "preco": "99.90"},
            expected=(201,),
        )
        self.created["plano"] = plano["id_plano"]

        assinatura, _ = request(
            "POST",
            "/api/assinaturas",
            {
                "id_cliente": self.created["cliente"],
                "id_plano": self.created["plano"],
                "validade": str(date.today() + timedelta(days=30)),
            },
            expected=(201,),
        )
        self.created["assinatura"] = assinatura["id_assinatura"]

        atualizada, _ = request("PUT", f"/api/assinaturas/{assinatura['id_assinatura']}", {"status": "Cancelada"})
        self.assertEqual(atualizada["status"], "Cancelada")

    def test_03_reserva_avaliacao_notificacao(self):
        reserva, _ = request(
            "POST",
            "/api/reservas",
            {
                "id_cliente": 1,
                "id_sala": 1,
                "entrada": "2026-07-10T10:00:00",
                "saida": "2026-07-10T11:00:00",
            },
            expected=(201,),
        )
        self.created["reserva"] = reserva["id_reserva"]

        cancelada, _ = request("PATCH", f"/api/reservas/{reserva['id_reserva']}", {"status": "Cancelada"})
        self.assertEqual(cancelada["status"], "Cancelada")

        avaliacao, _ = request(
            "POST",
            "/api/avaliacoes",
            {"id_reserva": reserva["id_reserva"], "nota": 4, "corpo": "Teste de integracao"},
            expected=(201,),
        )
        self.created["avaliacao"] = avaliacao["id_avaliacao"]

        avaliacoes_cliente, _ = request("GET", "/api/avaliacoes/cliente/1")
        self.assertTrue(any(item["id_avaliacao"] == avaliacao["id_avaliacao"] for item in avaliacoes_cliente))

        notificacao, _ = request(
            "POST",
            "/notificacoes",
            {"id_cliente": 1, "corpo": "Teste de integracao", "tipo": "Alerta", "lida": False},
            expected=(201,),
        )
        self.created["notificacao"] = notificacao["id_notificacao"]

        lida, _ = request("PATCH", f"/notificacoes/{notificacao['id_notificacao']}/lida")
        self.assertTrue(lida["lida"])


if __name__ == "__main__":
    sys.exit(unittest.main())
