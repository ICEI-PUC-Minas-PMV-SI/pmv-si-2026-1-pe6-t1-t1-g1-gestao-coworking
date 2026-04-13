import models

def listar_planos(db):
    return db.query(models.Plano).all()

def criar_plano(db, plano):
    novo = models.Plano(nome=plano.nome, preco=plano.preco)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

def assinar_plano(db, plano_id):
    assinatura = models.Assinatura(usuario=1, plano_id=plano_id)
    db.add(assinatura)
    db.commit()
    return {"msg": "Plano assinado"}

def ver_assinatura(db):
    assinatura = db.query(models.Assinatura).order_by(models.Assinatura.id.desc()).first()
    return assinatura or {"msg": "Sem assinatura"}

def trocar_plano(db, plano_id):
    assinatura = db.query(models.Assinatura).order_by(models.Assinatura.id.desc()).first()
    if assinatura:
        assinatura.plano_id = plano_id
        db.commit()
        return {"msg": "Plano alterado"}
    return {"erro": "Sem assinatura"}

def cancelar_assinatura(db):
    db.query(models.Assinatura).delete()
    db.commit()
    return {"msg": "Cancelado"}
