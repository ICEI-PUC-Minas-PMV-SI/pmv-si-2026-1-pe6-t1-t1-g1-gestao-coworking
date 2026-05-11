using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace coworking_salas.Models
{
    //Fixar o nome das tabelas, porque a conotação em inglês é diferente
    [Table("Salas")]
    public class Sala : LinksHATEOS
    {
        [Key]
        public int Id { get; set; }
        //Required, prop é obrigatório
        [Required]
        public string Nome { get; set; }
        [Required]
        public string TipoSala { get; set; }
        [Required]
        public int Capacidade { get; set; }
        [Required]
        public string Descricao { get; set; }
        [Required]
        public string Recursos { get; set; }
        [Required]
        public DateTime CriadoEm { get; set; }

        //Na classe Uso foi criada uma relação 1 para n com o SalaId, aqui não precisa criar uma propriedade para o uso
        //mas pode criar uma navegação virtual, do tipo Uso que eu chamo de Usos
        //Sala possui ligada a ela uma coleção de Usos
        //Uma sala está ligada a vários usos, mas o uso está ligado a apenas uma sala
        public ICollection<Uso> Usos { get; set; }

        public ICollection<SalaUsuarios> Usuarios { get; set; }
    }
}
