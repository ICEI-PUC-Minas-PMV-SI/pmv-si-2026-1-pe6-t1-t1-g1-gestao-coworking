# Precisa importar todas as bibliotecas e funções que vão ser usadas
from fastapi import FastAPI, status, HTTPException, Depends, Query
from schema import reservaEntrada, reservaEdicao
from model import reservas, cliente, sala
from typing import Optional
from database import criarSessao
from sqlmodel import Session, select, delete
from sqlalchemy import func
from datetime import datetime, date
from zoneinfo import ZoneInfo
from funcoes import verificar

# Criando a instância da aplicação com o FastAPI
appReserva = FastAPI() # Define o nome da variável que chamará a aplicação, se eu alterar tem que alterar em cada rota e no arquivo pyproject.toml

# Criando as rotas que definirão as ações
# Rota de criação da reserva 
@appReserva.post(
        "/api/reserva", 
        status_code=status.HTTP_201_CREATED, # entrega status se não houver levantamento de erro durante a execução
        responses={ # Lista os erros que podem acontecer na execução da rota. Serve para o swagger.
            400: {
                "description": "Erros de entrada do usuário.",
                "content": {
                    "application/json": {
                        "example": {"detail": "Mensagem de erro depende do tipo de falha teve nos dados de entrada. Exemplo: A entrada fornecida é igual ou após a saída."}
                    }
                }
            },
            404: {
                "description": "Não encontrado",
                "content": {
                    "application/json": {
                        "example": {"detail": "Mensagem de erro depende do tipo de dado que não foi encontrado. Exemplo: O id 1 de cliente enviado não existe."}
                    }
                }
            },
            409: {
                "description": "Conflito",
                "content": {
                    "application/json": {
                        "example": {"detail": "A sala já está ocupada neste horário"}
                    }
                }
            }
        }) 
def criarReserva( 
    dadosEntrada: reservaEntrada, # (X:Y) -> o que receberá será armazenado na variável X e deverá ter o formato Y
    sessao: Session = Depends(criarSessao) # Cria a sessão com o banco e diz que depende da minha função, isso força o encerramento quando acabar essa função
    )  -> reservas: # -> diz o que vai entregar no fim da função, ajuda o openapi a montar a documentação
    # Criando a função de gerar o tempo
    agora = lambda: datetime.now(ZoneInfo("America/Sao_Paulo"))
    
    # Garantir limpeza
    verificar(cliente, dadosEntrada.id_cliente, sessao) # verifica se existe o que to informando e já cria o erro se não existir
    verificar(sala, dadosEntrada.id_sala, sessao)

    if dadosEntrada.entrada >= dadosEntrada.saida:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A entrada fornecida é igual ou após a saída.")
    
    if dadosEntrada.entrada <= agora():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reserva não pode ser criada no passado.")
    
    # Regra de negocio: impedir reservas sejam feitas em horários quebrados
    if dadosEntrada.entrada.minute != 0 or dadosEntrada.saida.minute != 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A hora de entrada e saída devem ser horas inteiras (exemplo: 10:00).")

    # Regra de negocio: as reservas nao podem passar de dia, data de entrada = data de saida
    if dadosEntrada.entrada.date() != dadosEntrada.saida.date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A data de entrada difere da data de saída.")

    # Regra de negocio: saber se já existe uma reserva com o a mesma sala que coincida com o horario entregue mesmo que parcialmente
    query = select(reservas).where( # monta a query pro banco
        reservas.id_sala == dadosEntrada.id_sala, # puxa tudo que tiver a sala que recebi
        reservas.entrada < dadosEntrada.saida, # tudo que tiver entrada anterior a saida que recebi
        reservas.saida > dadosEntrada.entrada, # tudo que tiver saida posterior a entrada que recebi, com isso garanto que pega tudo que intercepte esse intervalo
        reservas.status != "Cancelada"
        ) 
    existe = sessao.exec(query).first() # executa e busca a primeira relação, pois se tiver 1 ou 10 iguais tá errado igual, então se achar 1 já poupa de percorrer o resto da tabela
    if existe:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A sala já está ocupada neste horário")
    
    # converter os dados para o modelo
    novaReserva = reservas(**dadosEntrada.model_dump()) 
    
    # criar a reserva no banco
    sessao.add(novaReserva) # prepara o objeto pra escrever
    sessao.commit() # escreve no banco o que ta pendente
    sessao.refresh(novaReserva) # busca a versão atualizada do que enviei e salva (ou seja, vem com o que é resolvido no modelo e no banco)

    return novaReserva # retorna o objeto criado junto com o codigo

# Rota de listagens 
# Todas as reservas, com filtro de cliente, sala ou data
@appReserva.get(
        "/api/reserva", 
        status_code=status.HTTP_200_OK,
        responses={
            400: {
                "description": "Erros de entrada do usuário.",
                "content": {
                    "application/json": {
                        "example": {"detail": "Se fornecer inicio ou fim, deve fornecer o outro."}
                    }
                }
            }
        })
def listarReserva( # preciso listar tudo, pois método get não pode ter corpo, se eu usar schema, ele pede um objeto no corpo
    id_cliente: Optional[int] = None, # Com esse default em None não preciso criar 4 rotas, o que não forcer eu não faço
    id_sala: Optional[int] = None, # Se fornecer mais de um, só vai incrementar o filtro
    inicio: Optional[date] = None,
    fim: Optional[date] = None, # Se não fornecer nenhum entrega todas as reservas
    offset: int = 0, # Se for carregar pagina 2 vai me entregar valor, se nao, é os primeiros valores
    limit: int = Query(default= 10, le= 100), # limita para proteger a memoria, se nao entregar, lista 10, se entregar mais que 100, muda pra 100 
    sessao: Session = Depends(criarSessao)
    ) -> list[reservas]: 
    # Garantir limpeza
    if bool(inicio) ^ bool(fim):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se fornecer inicio ou fim, deve fornecer o outro.")
    
    # criar as variável que vou precisar 
    query = select(reservas)

    # implementando os filtros
    if id_cliente:
        verificar(cliente, id_cliente, sessao) # verifico só se me entregar
        query = query.where(reservas.id_cliente == id_cliente)

    if id_sala:
        verificar(sala, id_sala, sessao)
        query = query.where(reservas.id_sala == id_sala)

    if inicio and fim:
        query = query.where(
            func.date(reservas.entrada) >= inicio,
            func.date(reservas.entrada) <= fim
            )
    
    # Fazer a busca 
    listaReservas = sessao.exec(query.offset(offset).limit(limit)).all()

    return listaReservas # retorna a lista com tudo

# Uma reserva específica
@appReserva.get(
        "/api/reserva/{id}", 
        status_code=status.HTTP_200_OK,
        responses={ # Lista os erros que podem acontecer na execução da rota. Serve para o swagger.
            404: {
                "description": "Não encontrado",
                "content": {
                    "application/json": {
                        "example": {"detail": "O id 'X' de reserva enviado não existe."}
                    }
                }
            }
        }) 
def buscarReserva(
    id: int,
    sessao: Session = Depends(criarSessao)
    ) -> reservas:
    # busco no banco
    objeto = verificar(reservas, id, sessao) # essa funcao verifica e devolve o objeto se existir  

    return objeto

# Rota para edição de reservas ( talvez não faça sentido diretamente no negócio mas entendo ser ok de implementar pelo caso de um dia ser necessário e então já ter )
@appReserva.patch(
        "/api/reserva/{id}", 
        status_code=status.HTTP_200_OK,
        responses={ # Lista os erros que podem acontecer na execução da rota. Serve para o swagger.
            400: {
                "description": "Erros de entrada do usuário.",
                "content": {
                    "application/json": {
                        "example": {"detail": "Mensagem de erro depende do tipo de falha teve nos dados de entrada. Exemplo: A entrada fornecida é igual ou após a saída."}
                    }
                }
            },
            404: {
                "description": "Não encontrado",
                "content": {
                    "application/json": {
                        "example": {"detail": "Mensagem de erro depende do tipo de dado que não foi encontrado. Exemplo: O id 1 de cliente enviado não existe."}
                    }
                }
            },
            409: {
                "description": "Conflito",
                "content": {
                    "application/json": {
                        "example": {"detail": "A sala já está ocupada neste horário"}
                    }
                }
            }
        })
def editar(
    id: int,
    dadosEdicao: reservaEdicao,
    sessao: Session = Depends(criarSessao)
    ) -> reservas:
    # Buscar a reserva informada
    reservaEditar = verificar(reservas, id, sessao)
    
    # Se tiver entrada ou saida mas não os dois, vou pegar o que não tem da reserva original para prencher e fazer validações
    # Se tiver os dois não faz nada e valida os dados novos, se não tiver nenhum não vai precisar validar as horas 
    # Se tiver um dos dos dois ou os dois e não tiver sala vou precisar pegar pra validar lá na frente se não vai ter conflito
    if bool(dadosEdicao.entrada) ^ bool(dadosEdicao.saida):
        if dadosEdicao.entrada:
            dadosEdicao.saida = reservaEditar.saida
        else:
            dadosEdicao.entrada = reservaEditar.entrada

    if dadosEdicao.entrada or dadosEdicao.saida:
        if not dadosEdicao.id_sala:
            dadosEdicao.id_sala = reservaEditar.id_sala

    # Criando a função de gerar o tempo
    agora = lambda: datetime.now(ZoneInfo("America/Sao_Paulo"))
    
    # Garantir limpeza
    if dadosEdicao.id_cliente or dadosEdicao.id_cliente == 0:
        verificar(cliente, dadosEdicao.id_cliente, sessao)
    
    if dadosEdicao.id_sala or dadosEdicao.id_sala == 0:
        verificar(sala, dadosEdicao.id_sala, sessao)

    if dadosEdicao.entrada:
        if dadosEdicao.entrada >= dadosEdicao.saida:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A entrada fornecida é igual ou após a saída")
        
        if dadosEdicao.entrada <= agora():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A reserva não pode ser criada no passado")
        
        # Regra de negocio: impedir reservas sejam feitas em horários quebrados
        if dadosEdicao.entrada.minute != 0 or dadosEdicao.saida.minute != 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A hora de entrada e saída devem ser horas inteiras (exemplo: 10:00)")

        # Regra de negocio: as reservas nao podem passar de dia, data de entrada = data de saida
        if dadosEdicao.entrada.date() != dadosEdicao.saida.date():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A data de entrada difere da data de saída.")

        # Regra de negocio: saber se já existe uma reserva com o a mesma sala que coincida com o horario entregue mesmo que parcialmente
        query = select(reservas).where( # monta a query pro banco
            reservas.id_sala == dadosEdicao.id_sala, # puxa tudo que tiver a sala que recebi
            reservas.entrada < dadosEdicao.saida, # tudo que tiver entrada anterior a saida que recebi
            reservas.saida > dadosEdicao.entrada, # tudo que tiver saida posterior a entrada que recebi, com isso garanto que pega tudo que intercepte esse intervalo
            reservas.id_reserva != id # Se eu não excluir a própria reserva e eu mudar apenas um horario ele vai se encontrar e dar erro
            ) 
        existe = sessao.exec(query).first() # executa e busca a primeira relação, pois se tiver 1 ou 10 iguais tá errado igual, então se achar 1 já poupa de percorrer o resto da tabela
        if existe:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A sala já está ocupada neste horário")
        
    novosDados = dadosEdicao.model_dump(exclude_unset=True) # pego a entrada e excluo todos os itens nulos e só sobram atributos que vão ser modificados no objeto

    reservaEditar.sqlmodel_update(novosDados)

    sessao.add(reservaEditar)
    sessao.commit()
    sessao.refresh(reservaEditar)

    return reservaEditar

# Rota para exclusão de reservas ( talvez não faça sentido diretamente no negócio mas entendo ser ok de implementar pelo caso de um dia ser necessário e então já ter )
# Pra mim nem deveria implementar essas rotas, além da questão de segurança não consigo enxergar uso no dia a dia do negócio.
# Vou colocar inicialmente so pra deletar sem nenhuma segurança se for preciso faço depois
# Todas as reservas 
# @appReserva.delete("/api/reserva", status_code=status.HTTP_204_NO_CONTENT)
# def deletarTudo(sessao: Session = Depends(criarSessao)) -> None:
#     sessao.exec(delete(reservas))
#     sessao.commit()
#     return None

# Uma reserva específica
@appReserva.delete(
        "/api/reserva/{id}", 
        status_code=status.HTTP_204_NO_CONTENT,
        responses={ # Lista os erros que podem acontecer na execução da rota. Serve para o swagger.
            404: {
                "description": "Não encontrado",
                "content": {
                    "application/json": {
                        "example": {"detail": "O id 'X' de reservas enviado não existe."}
                    }
                }
            }
        })
def deletarUm(
    id: int,
    sessao: Session = Depends(criarSessao)
    ) -> None:
    alvo = verificar(reservas, id, sessao)

    sessao.delete(alvo)
    sessao.commit()

    return None