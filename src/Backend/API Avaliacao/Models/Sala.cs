using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AvaliacaoApi.Models;

[Table("sala", Schema = "public")]
public class Sala
{
    [Key]
    [Column("id_sala")]
    public int IdSala { get; set; }

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("tipo")]
    public string Tipo { get; set; } = string.Empty;
}
