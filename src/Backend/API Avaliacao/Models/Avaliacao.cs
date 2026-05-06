using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AvaliacaoApi.Models;

/// <summary>
/// Representa uma avaliacao registrada para uma reserva.
/// </summary>
[Table("avaliacao", Schema = "public")]
public class Avaliacao
{
    /// <summary>
    /// Identificador unico da avaliacao.
    /// </summary>
    [Key]
    [Column("id_avaliacao")]
    public int IdAvaliacao { get; set; }

    /// <summary>
    /// Identificador da reserva associada a avaliacao.
    /// </summary>
    [Column("id_reserva")]
    public int? IdReserva { get; set; }

    /// <summary>
    /// Nota atribuida, de 0 a 5.
    /// </summary>
    [Required]
    [Column("nota")]
    public int Nota { get; set; }

    /// <summary>
    /// Comentario textual da avaliacao.
    /// </summary>
    [StringLength(255)]
    [Column("corpo")]
    public string? Corpo { get; set; }

    /// <summary>
    /// Data de criacao da avaliacao.
    /// </summary>
    [Required]
    [Column("criado_em")]
    public DateOnly CriadoEm { get; set; }
}
