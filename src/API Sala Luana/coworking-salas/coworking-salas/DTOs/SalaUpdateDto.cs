namespace coworking_salas.DTOs
{
    public class SalaUpdateDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string TipoSala { get; set; }
        public int Capacidade { get; set; }
        public string Descricao { get; set; }
        public string Recursos { get; set; }
        public DateTime CriadoEm { get; set; }
    }
}