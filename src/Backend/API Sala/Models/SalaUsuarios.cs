//cria uma relação n para n criando a classe SalaUsuarios(essa)
//cria as foreign keys de Sala e Usuario
//coloca a relação que tem que um sala possui vários usuários criando a icolletion na classe de Sala 
//o Usuarios também são ligados a várias salas crindo o icolletion na classe de usuários
//precisa configurar indo no AppDbContext para dar contexto e informar o que é foreign key
//precisa fazer de forma programática para não ter ciclo
//então tem que ccriar um metodo de sobreescrita de um método do próprio dbcontext, o protected
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace coworking_salas.Models
{
    //tabela lista todos os usuários relacionados a uma sala
    [Table("SalaUsuarios")]
    public class SalaUsuarios
    {
        //como é uma tabela de relacionamento ela só precisa ter as foreign keys para as outras tabelas
        //se eu preciso ligar uma tabela n para n eu preciso de uma tabela intermediária ligando por uma foreign key
        public int SalaId { get; set; }
        //pode adicionar aqui uma navegação virtual, caso deseje recuperar eles em alguma consulta
        public Sala Sala { get; set; }
        public int UsuarioId { get; set; }
        [JsonIgnore]
        public Usuario Usuario { get; set; }
    }
}
