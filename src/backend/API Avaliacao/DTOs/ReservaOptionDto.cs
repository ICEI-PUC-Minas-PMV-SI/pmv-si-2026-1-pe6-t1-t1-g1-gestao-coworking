namespace AvaliacaoApi.DTOs;

public class ReservaOptionDto
{
    public int IdReserva { get; set; }
    public string NomeUsuario { get; set; } = "Usuario nao informado";
    public string NomeSala { get; set; } = "Sala nao informada";
    public string TipoSala { get; set; } = "Tipo nao informado";
}
