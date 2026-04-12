using System.Text.Json.Serialization;

namespace coworking_salas.DTOs
{
    public class SalaCreateDto
    {
        public string Nome { get; set; }
        
        [JsonPropertyName("tipoSala")]
        public string TipoSala { get; set; }
        public int Capacidade { get; set; }
        public string Descricao { get; set; }
        public string Recursos { get; set; }
        public DateTime CriadoEm { get; set; }
    }
}
