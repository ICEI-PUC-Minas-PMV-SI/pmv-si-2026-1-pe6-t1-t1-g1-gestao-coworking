using System.ComponentModel.DataAnnotations;

namespace AvaliacaoApi.DTOs;

/// <summary>
/// Dados necessarios para criar uma nova avaliacao.
/// </summary>
public class CreateAvaliacaoDto
{
    /// <summary>
    /// Identificador da reserva relacionada.
    /// </summary>
    public int? IdReserva { get; set; }

    /// <summary>
    /// Nota da avaliacao, entre 0 e 5.
    /// </summary>
    [Range(0, 5, ErrorMessage = "A nota deve estar entre 0 e 5.")]
    public int Nota { get; set; }

    /// <summary>
    /// Comentario complementar da avaliacao.
    /// </summary>
    [StringLength(255)]
    public string? Corpo { get; set; }

    /// <summary>
    /// Data de criacao da avaliacao.
    /// </summary>
    public DateOnly CriadoEm { get; set; }
}
