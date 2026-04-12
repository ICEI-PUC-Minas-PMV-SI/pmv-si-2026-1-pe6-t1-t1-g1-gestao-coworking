using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace coworking_salas.Models
{
    [Table("Usos")]
    public class Uso : LinksHATEOS
    {
        [Key]
        public int Id { get; set; }
        [Required] 
        public string Descricao { get; set; }
        [Required]
        public DateTime Data { get; set; }
        [Required]
        [Column (TypeName ="decimal(18,2)")]
        public decimal Valor { get; set; }
        [Required]
        public TipoSala Tipo { get; set; }
        [Required]
        //Falar que uma sala tem vários usos/ relação 1 para n
        public int SalaId { get; set; }
        //Navegação virtual
        [JsonIgnore]
        public Sala Sala { get; set; }

    }
      public enum TipoSala
    {
        Privativa,
        MesaCompartilhada,
        EstacaoFixa,
        SalaDeReuniao
    }
}
