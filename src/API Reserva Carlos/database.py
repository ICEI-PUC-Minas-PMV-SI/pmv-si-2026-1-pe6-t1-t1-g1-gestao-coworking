from os import getenv
from dotenv import load_dotenv
from sqlmodel import create_engine, Session

# usando variável de ambiente pois com isso ela não será enviada para um repositório quando eu subir em algum lugar ( pelo gitignore ) e é mais seguro por assim não expor o usuário e senha presente no URL

# carregar as variáveis de ambiente
load_dotenv() 

# puxa a variável e atribui pra uma nesse arquivo
databaseURL = getenv("databaseURL") 

# cria o motor de conexão, é o meio que será utilizada para conectar
motor = create_engine(databaseURL) 

# define a função que vai abrir a conexão com o banco, usar with garante que quando acabar ela vai fechar a conexão
def criarSessao():
    with Session(motor) as sessao:
        yield sessao