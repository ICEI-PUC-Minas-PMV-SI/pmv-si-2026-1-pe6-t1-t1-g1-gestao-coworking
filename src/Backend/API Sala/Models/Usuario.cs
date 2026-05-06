using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


//not sure if this is my function in this team

namespace coworking_salas.Models
{
    [Table("Usuarios")]
    public class Usuario
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Nome { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        [JsonIgnore]
        public Perfil Perfil { get; set; }
        
        // usuário vai estar ligado a uma coleção com vários usuários
        //então adiciona uma navegação uma icolletion
        //meu usuário possui várias salas
        public ICollection<SalaUsuarios> Salas { get; set; }

    }
    //relacionamento n para n porque o usuário possui várias salas-
    //uma ou mais salas relacionadas a ele e a sala pode estar relacionada a mais de um usuário
    //não pode colocar uum id , nem de usuário e nem de salas porque são vários dos dois
    //então precisa de uma tabela intermediária, então cria a classe SalaUsuarios
    //Etão vai ser uma nova tabela no banco de dados
    
    public enum Perfil
    {
        [Display(Name = "Administrador")]
        Administrador,
        [Display(Name = "Usuario")]
        Usuario
    }
}
