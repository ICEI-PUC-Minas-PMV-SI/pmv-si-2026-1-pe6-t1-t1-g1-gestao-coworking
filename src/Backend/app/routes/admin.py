from fastapi import APIRouter, HTTPException, Query, status

from app.services.bootstrap_database import bootstrap_database


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/bootstrap", status_code=status.HTTP_200_OK)
def recriar_banco_inicial(
    confirmar: bool = Query(default=False, description="Deve ser true para recriar o schema e inserir os dados iniciais."),
) -> dict[str, object]:
    if not confirmar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint recria o schema publico e apaga os dados atuais. Chame com ?confirmar=true.",
        )

    resultado = bootstrap_database()
    return {
        "mensagem": "Banco de dados verificado, schema recriado e dados iniciais inseridos.",
        "resultado": resultado,
    }
