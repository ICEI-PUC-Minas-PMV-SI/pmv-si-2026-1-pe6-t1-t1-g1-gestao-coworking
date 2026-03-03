# Introdução

A dinâmica dos espaços de trabalho compartilhados exige a operação de alta velocidade na sociedade atual. No entanto, muitas empresas que lidam com a administração de spaces de coworking ainda gerenciam seu espaço de coworking com ajuda de planilhas do Excel ou sistemas genéricos que não atendem às necessidades específicas do espaço de coworking ou dos clientes. Tornando assim, a operação altamente ineficiente e lenta.
A administração realizada dessa maneira acaba gerando gargalos extremamente críticos de operacionalização, com conflitos de agendas, dificuldades no controle de contratos, perda de receitas, ausência de relatórios gerenciais, e falta de controle financeiro, tornando a administração e a experiência de uso dos serviços inviável. Dessa forma, o escopo principal deste projeto é desenvolver um Sistema de Gestão para Coworking que automatize integralmente todos os processos que envolvem a administração, as finanças e as operações dos serviços para que os processos fiquem o mais fluidos possíveis e não tenham-se gargalos que possam vir a prejudicar o processo da empresa ou torná-lo mais lento, dificultando o funcionamento correto.


## Problema
Na sociedade atual muitas empresas de administração de coworking realizam sua gestão por meio de planilhas ou sistemas genéricos que não atendem às necessidades específicas necessárias tanto pelo cliente quanto pela própria administração. Um gerenciamento feito dessa forma pode gerar conflitos de agendamento, dificuldade na gestão de contratos, perda de receita, ausência de relatórios gerenciais, falhas no controle financeiro, dentre outras situações que dificultam a administração e o uso dos serviços por parte dos usuários. Assim, questiona-se: como desenvolver um sistema que otimize a gestão operacional de um coworking?


## Objetivos
### Objetivo Geral
Desenvolver um sistema de gestão para coworking que automatize os processos operacionais.

### Objetivos específicos
Implementar cadastro e gerenciamento de clientes;

Desenvolver módulo de reservas de salas e estações;

## Justificativa

 O mercado de coworking encontra-se em expansão no Brasil, em razão das transformações nas formas de trabalho e da crescente busca por flexibilidade e eficiência na utilização de espaços corporativos. De acordo com o Censo Coworking 2024, o número de espaços ativos no país apresentou crescimento superior a 20% em apenas um ano, evidenciando o aumento da demanda por ambientes de trabalho flexíveis. Destaca-se que capitais como São Paulo e Belo Horizonte concentram a maior parte desses estabelecimentos. Tal crescimento é impulsionado pela consolidação de modelos híbridos de trabalho, pela digitalização das empresas e pela necessidade de redução de custos relacionados à infraestrutura tradicional de escritórios. Nesse contexto, freelancers, pequenas e médias empresas, bem como grandes corporações, passaram a optar por soluções mais dinâmicas, visando ampliar produtividade e conectividade.

 Belo Horizonte é considerada o terceiro maior mercado de coworkings do país, segundo a Associação Nacional de Coworking e Escritórios Virtuais (Ancev), apresentando crescimento médio aproximado de 30% ao ano no setor. Esse cenário tem atraído grandes redes internacionais, como a WeWork, uma das maiores empresas de espaços compartilhados do mundo, evidenciando a consolidação e o desenvolvimento contínuo do segmento. Assim, observa-se a necessidade crescente de profissionalização da gestão e da adoção de soluções tecnológicas especializadas.

 Com o aumento da demanda, os espaços de coworking passaram a oferecer, além de estações de trabalho compartilhadas, salas privativas, escritórios virtuais, eventos corporativos e programas de inovação. Essa diversificação de serviços amplia a complexidade administrativa, envolvendo controle de contratos, gestão de reservas, faturamento, planos e acompanhamento financeiro. A ausência de um sistema especializado pode comprometer a eficiência operacional, ocasionar falhas no controle das informações e dificultar a análise estratégica do negócio, reduzindo sua competitividade em um mercado em expansão.

 Dessa forma, o desenvolvimento de um sistema específico para a gestão de coworking justifica-se pela necessidade de modernização dos processos internos, automação de rotinas administrativas e centralização de dados em uma única plataforma. A solução proposta contribuirá para a redução de erros humanos, melhoria da organização interna e apoio à tomada de decisões estratégicas, tornando o empreendimento mais estruturado, eficiente e preparado para acompanhar a expansão do setor em âmbito municipal e nacional.

## Público-Alvo
O sistema será destinado aos gestores administrativos, recepcionistas e profissionais que utilizam espaços compartilhados.


# Especificações do Projeto
## Tema para Desenvolvimento do projeto: 
Sistema de Gestão para Coworking – Plataforma para reserva de espaços e controle de uso de salas em ambientes de coworking distribuídos.
### Descrição da Persona Jurídica
#### Nome do Sistema
Axis Work
#### Slogan 
”O centro estratégico do seu trabalho.”
#### Identidade Visual e Cultural
História: A Axis Work foi fundada em Belo Horizonte, Minas Gerais, com o propósito de oferecer uma solução moderna e estruturada para profissionais que atuam em ambientes corporativos compartilhados. A empresa combina infraestrutura executiva com tecnologia, por meio de uma plataforma digital para reserva de salas e controle de utilização em coworkings distribuídos. Inspirada no conceito de “eixo”, a Axis Work busca ser o ponto central que conecta produtividade, planejamento e inovação no ambiente de trabalho.
##### Missão: Oferecer serviços de gestão de ambientes de coworking, centralizando e automatizando tais processos, proporcionando maior organização e eficiência administrativa.
#### Visão: Ser reconhecida como a principal empresa de gerenciamento de coworking de Belo Horizonte, destacando-se pela inovação tecnológica, praticidade, organização e confiabilidade.
#### Valores:
Transparência e ética;
Inovação;
Confiabilidade;
Organização.
#### Logo:

## Requisitos

As tabelas que se seguem apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto. Para determinar a prioridade de requisitos, aplicar uma técnica de priorização de requisitos e detalhar como a técnica foi aplicada.

### Requisitos Funcionais

|ID    | Descrição do Requisito  | Prioridade |
|------|-----------------------------------------|----|
|RF-001| Permitir que o usuário cadastre tarefas | ALTA | 
|RF-002| Emitir um relatório de tarefas no mês   | MÉDIA |

### Requisitos não Funcionais

|ID     | Descrição do Requisito  |Prioridade |
|-------|-------------------------|----|
|RNF-001| O sistema deve ser responsivo para rodar em um dispositivos móvel | MÉDIA | 
|RNF-002| Deve processar requisições do usuário em no máximo 3s |  BAIXA | 

Com base nas Histórias de Usuário, enumere os requisitos da sua solução. Classifique esses requisitos em dois grupos:

- [Requisitos Funcionais
 (RF)](https://pt.wikipedia.org/wiki/Requisito_funcional):
 correspondem a uma funcionalidade que deve estar presente na
  plataforma (ex: cadastro de usuário).
- [Requisitos Não Funcionais
  (RNF)](https://pt.wikipedia.org/wiki/Requisito_n%C3%A3o_funcional):
  correspondem a uma característica técnica, seja de usabilidade,
  desempenho, confiabilidade, segurança ou outro (ex: suporte a
  dispositivos iOS e Android).
Lembre-se que cada requisito deve corresponder à uma e somente uma
característica alvo da sua solução. Além disso, certifique-se de que
todos os aspectos capturados nas Histórias de Usuário foram cobertos.

## Restrições

O projeto está restrito pelos itens apresentados na tabela a seguir.

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|01| O projeto deverá ser concluído no prazo máximo de 4 meses. |
|02| As entregas parciais deverão ocorrer conforme cronograma mensal estabelecido.  |
|03| A equipe será composta exclusivamente por 6 integrantes.  |
|04| Cada integrante deverá exercer a função previamente definida no planejamento. |
|05| O projeto deverá ser desenvolvido utilizando ferramentas gratuitas.  |
|06| Não haverá investimento em infraestrutura física adicional.  |
|07| O sistema deverá funcionar em ambiente online. |
|08| O acesso dependerá de conexão com a internet.  |


# Catálogo de Serviços

## Serviços oferecidos:
### Gestão de Usuários:
Controle de permissões (Administração, Recepção).
### Gestão de Clientes:
Cadastro completo;
Login;
Histórico de reservas.
### Serviço de Salas:
Cadastro de salas;
Disponibilidade.
### Serviço de Reservas:
Verificação de disponibilidade;
Criação e cancelamento de reservas;
Checkout.
### Serviço de Avaliações:
Comentários.
### Serviço de Notificações:
Alerta.


# Arquitetura da Solução

Definição de como o software é estruturado em termos dos componentes que fazem parte da solução e do ambiente de hospedagem da aplicação.

![arq](https://github.com/user-attachments/assets/b9402e05-8445-47c3-9d47-f11696e38a3d)


## Tecnologias Utilizadas
### Front-end
Linguagens: HTML5, CSS3, JavaScript.

### Back-end


### Banco de Dados e Armazenamento
Bancos Relacionais: PostgreSQL.

### Ferramentas de Desenvolvimento
Visual Studio Code
Git / GitHub 



Descreva aqui qual(is) tecnologias você vai usar para resolver o seu problema, ou seja, implementar a sua solução. Liste todas as tecnologias envolvidas, linguagens a serem utilizadas, serviços web, frameworks, bibliotecas, IDEs de desenvolvimento, e ferramentas.

Apresente também uma figura explicando como as tecnologias estão relacionadas ou como uma interação do usuário com o sistema vai ser conduzida, por onde ela passa até retornar uma resposta ao usuário.

## Hospedagem

Explique como a hospedagem e o lançamento da plataforma foi feita.
