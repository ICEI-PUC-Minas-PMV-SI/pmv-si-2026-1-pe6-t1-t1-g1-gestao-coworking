import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import settings


def hash_senha(senha: str) -> str:
    digest = hashlib.sha256(senha.encode("utf-8")).digest()
    token = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")
    return f"sha256${token}"


def verificar_senha(senha: str, senha_salva: str) -> bool:
    if senha_salva.startswith("sha256$"):
        return hmac.compare_digest(hash_senha(senha), senha_salva)
    return hmac.compare_digest(senha, senha_salva)


def criar_token(subject: str, minutos: int = 30) -> str:
    payload = {
        "sub": subject,
        "exp": int((datetime.now(timezone.utc) + timedelta(minutes=minutos)).timestamp()),
    }
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")).decode("ascii").rstrip("=")
    signature = hmac.new(settings.secret_key.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
    signed = base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
    return f"{body}.{signed}"


def verificar_token(token: str) -> str:
    try:
        body, signed = token.split(".", 1)
        expected = hmac.new(settings.secret_key.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest()
        received = base64.urlsafe_b64decode(signed + "=" * (-len(signed) % 4))
        if not hmac.compare_digest(expected, received):
            raise ValueError

        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return str(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido") from exc

