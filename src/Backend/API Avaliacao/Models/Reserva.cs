using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AvaliacaoApi.Models;

[Table("reservas", Schema = "public")]
public class Reserva
{
    [Key]
    [Column("id_reserva")]
    public int IdReserva { get; set; }

    [Column("id_cliente")]
    public int? IdCliente { get; set; }

    [Column("id_sala")]
    public int? IdSala { get; set; }
}
