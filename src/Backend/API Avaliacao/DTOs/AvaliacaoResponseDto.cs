namespace AvaliacaoApi.DTOs;

public class AvaliacaoResponseDto
{
    public int IdAvaliacao { get; set; }
    public int? IdReserva { get; set; }
    public int Nota { get; set; }
    public string? Corpo { get; set; }
    public DateOnly CriadoEm { get; set; }
    public string NomeUsuario { get; set; } = "Usuario nao informado";
    public string NomeSala { get; set; } = "Sala nao informada";
    public string TipoSala { get; set; } = "Tipo nao informado";
}
