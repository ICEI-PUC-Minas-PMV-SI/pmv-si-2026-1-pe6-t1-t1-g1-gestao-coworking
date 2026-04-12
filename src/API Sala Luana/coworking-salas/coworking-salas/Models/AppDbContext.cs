
//Tradução de modelo orientado a objetos para modelo de banco de dados relacional
using Microsoft.EntityFrameworkCore;

namespace coworking_salas.Models
{
    //AppContext (herda) de DbContext(do EntityFrameWorkCore)
    //pega essas configurações por injeção de dependência( que é quando não quer ficar criando instâncias das classes de forma programática)
    //não ficar criando uma depedência entre os objetos, vai fazer via configuração em que o programa vai injetar a classe automaticamente através de
    //configuração e não via progrmação criando uma nova instância e faz a configuração na classe de programa(Program.cs)
    //configura as tabelas no banco de dados
    public class AppDbContext : DbContext
    {
        //Cria um ctor(atalho para construtor) recebe DbContextOptions(injeção de depedência) que são as opções que ele vai receber do sistema
        //e ele passa para a sua base que é a classe pai (base(options)) que é o DbContext pré configurado
        public AppDbContext(DbContextOptions options) : base(options)
        { 

        }
        //O On ModelCreating faz com que quando cria um modelo tem como de modo programático configurar as relações
        protected override void OnModelCreating(ModelBuilder builder)
        {
            //Entity é a entidade que quer configurar que no caso é a SalaUsuarios
            builder.Entity<SalaUsuarios>()
                //o que será feito nessa configuração: colocar uma chave - HasKey
                //essa chave vai ter uma chave composta (que possui mais de um campo)
                ////ela vai criar New SalaId e UsuarioId
                //o que significa que não pode ter uma mesma sala associada ao mesmo usuário
                .HasKey(c => new { c.SalaId, c.UsuarioId });
            //tem que criar as foreign keys
            builder.Entity<SalaUsuarios>()
                //fazer os relacionamentos
                //relacionado a uma sala
                //para cada sala pode ter muito usuários
                .HasOne(c => c.Sala).WithMany(c => c.Usuarios)
                //essa relação é definida pela Foreign key
                .HasForeignKey(c => c.SalaId);
            //então repete a relação
            builder.Entity<SalaUsuarios>()
               .HasOne(c => c.Usuario).WithMany(c => c.Salas)
               .HasForeignKey(c => c.UsuarioId);

        }
        //Objetos, as tabelas/ entidades que vão ser criadas
        //DbSet é um conjunto de dados da tabela de dados, a tabela <Sala>...
        //tabela chamada salas baseada na classe sala
        public DbSet<Sala> Salas { get; set; }
        public DbSet<Uso> Usos { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<SalaUsuarios> SalasUsuarios { get; set; }

        //public object Salas { get; internal set; }

        //não sei se deveria ter adicionado esse
        //public object Usos { get; internal set; }
    }
    
}
