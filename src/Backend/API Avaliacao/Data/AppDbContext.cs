using AvaliacaoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AvaliacaoApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Avaliacao> Avaliacoes => Set<Avaliacao>();
    public DbSet<Reserva> Reservas => Set<Reserva>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Sala> Salas => Set<Sala>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Avaliacao>(entity =>
        {
            entity.HasKey(a => a.IdAvaliacao);

            entity.Property(a => a.IdCliente).IsRequired();
            entity.Property(a => a.IdSala).IsRequired();
            entity.Property(a => a.IdReserva).IsRequired();
            entity.Property(a => a.Nota).IsRequired();
            entity.Property(a => a.CriadoEm).IsRequired();
            entity.ToTable(table => table.HasCheckConstraint("chk_nota_range", "\"nota\" >= 0 AND \"nota\" <= 5"));
        });
    }
}
