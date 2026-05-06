using AvaliacaoApi.Data;
using AvaliacaoApi.DTOs;
using AvaliacaoApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Data;

namespace AvaliacaoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvaliacaoController(AppDbContext context) : ControllerBase
{
    [HttpGet("opcoes/reservas")]
    [ProducesResponseType(typeof(IEnumerable<ReservaOptionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReservaOptionDto>>> GetReservationOptions()
    {
        try
        {
            var options = await GetReservationOptionsAsync();
            return Ok(options);
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Nao foi possivel carregar as opcoes de reserva.");
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AvaliacaoResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status408RequestTimeout)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<AvaliacaoResponseDto>>> GetAll()
    {
        try
        {
            return Ok(await GetReviewDtosAsync());
        }
        catch (OperationCanceledException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A consulta demorou mais do que o esperado.");
        }
        catch (TimeoutException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A consulta demorou mais do que o esperado.");
        }
        catch (NpgsqlException ex) when (ex.IsTransient)
        {
            return CreateProblem(StatusCodes.Status503ServiceUnavailable, "Banco de dados indisponivel.", "Nao foi possivel consultar o banco de dados no momento.");
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Ocorreu um erro inesperado ao listar as avaliacoes.");
        }
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(AvaliacaoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status408RequestTimeout)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AvaliacaoResponseDto>> GetById(int id)
    {
        if (id <= 0)
        {
            return CreateProblem(StatusCodes.Status400BadRequest, "Identificador invalido.", "O ID da avaliacao deve ser maior que zero.");
        }

        try
        {
            var avaliacao = (await GetReviewDtosAsync(id)).FirstOrDefault();
            if (avaliacao is null)
            {
                return NotFound(new { message = "Avaliacao nao encontrada." });
            }

            return Ok(avaliacao);
        }
        catch (OperationCanceledException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A consulta demorou mais do que o esperado.");
        }
        catch (TimeoutException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A consulta demorou mais do que o esperado.");
        }
        catch (NpgsqlException ex) when (ex.IsTransient)
        {
            return CreateProblem(StatusCodes.Status503ServiceUnavailable, "Banco de dados indisponivel.", "Nao foi possivel consultar o banco de dados no momento.");
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Ocorreu um erro inesperado ao buscar a avaliacao.");
        }
    }

    [HttpPost]
    [ProducesResponseType(typeof(AvaliacaoResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status408RequestTimeout)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AvaliacaoResponseDto>> Create([FromBody] CreateAvaliacaoDto dto)
    {
        try
        {
            if (!dto.IdReserva.HasValue)
            {
                return CreateProblem(StatusCodes.Status400BadRequest, "Reserva obrigatoria.", "Selecione uma reserva valida para criar a avaliacao.");
            }

            var avaliacao = new Avaliacao
            {
                IdReserva = dto.IdReserva,
                Nota = dto.Nota,
                Corpo = dto.Corpo,
                CriadoEm = dto.CriadoEm
            };

            context.Avaliacoes.Add(avaliacao);
            await context.SaveChangesAsync();

            var response = (await GetReviewDtosAsync(avaliacao.IdAvaliacao)).First();
            return CreatedAtAction(nameof(GetById), new { id = avaliacao.IdAvaliacao }, response);
        }
        catch (DbUpdateException ex) when (IsValidationFailure(ex))
        {
            return CreateProblem(StatusCodes.Status400BadRequest, "Dados invalidos.", "Os dados enviados violam uma regra de validacao do banco.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito de concorrencia.", "O registro foi alterado por outro processo. Tente novamente.");
        }
        catch (DbUpdateException ex)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito ao salvar.", BuildConflictMessage(ex));
        }
        catch (OperationCanceledException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de gravacao demorou mais do que o esperado.");
        }
        catch (TimeoutException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de gravacao demorou mais do que o esperado.");
        }
        catch (NpgsqlException ex) when (ex.IsTransient)
        {
            return CreateProblem(StatusCodes.Status503ServiceUnavailable, "Banco de dados indisponivel.", "Nao foi possivel gravar no banco de dados no momento.");
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Ocorreu um erro inesperado ao criar a avaliacao.");
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(AvaliacaoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status408RequestTimeout)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AvaliacaoResponseDto>> Update(int id, [FromBody] UpdateAvaliacaoDto dto)
    {
        if (id <= 0)
        {
            return CreateProblem(StatusCodes.Status400BadRequest, "Identificador invalido.", "O ID da avaliacao deve ser maior que zero.");
        }

        try
        {
            if (!dto.IdReserva.HasValue)
            {
                return CreateProblem(StatusCodes.Status400BadRequest, "Reserva obrigatoria.", "Selecione uma reserva valida para atualizar a avaliacao.");
            }

            var avaliacao = await context.Avaliacoes.FirstOrDefaultAsync(a => a.IdAvaliacao == id);
            if (avaliacao is null)
            {
                return NotFound(new { message = "Avaliacao nao encontrada." });
            }

            avaliacao.IdReserva = dto.IdReserva;
            avaliacao.Nota = dto.Nota;
            avaliacao.Corpo = dto.Corpo;
            avaliacao.CriadoEm = dto.CriadoEm;

            await context.SaveChangesAsync();

            var response = (await GetReviewDtosAsync(avaliacao.IdAvaliacao)).First();
            return Ok(response);
        }
        catch (DbUpdateException ex) when (IsValidationFailure(ex))
        {
            return CreateProblem(StatusCodes.Status400BadRequest, "Dados invalidos.", "Os dados enviados violam uma regra de validacao do banco.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito de concorrencia.", "O registro foi alterado por outro processo. Tente novamente.");
        }
        catch (DbUpdateException ex)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito ao salvar.", BuildConflictMessage(ex));
        }
        catch (OperationCanceledException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de gravacao demorou mais do que o esperado.");
        }
        catch (TimeoutException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de gravacao demorou mais do que o esperado.");
        }
        catch (NpgsqlException ex) when (ex.IsTransient)
        {
            return CreateProblem(StatusCodes.Status503ServiceUnavailable, "Banco de dados indisponivel.", "Nao foi possivel atualizar o banco de dados no momento.");
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Ocorreu um erro inesperado ao atualizar a avaliacao.");
        }
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status408RequestTimeout)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status503ServiceUnavailable)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Delete(int id)
    {
        if (id <= 0)
        {
            return CreateProblem(StatusCodes.Status400BadRequest, "Identificador invalido.", "O ID da avaliacao deve ser maior que zero.");
        }

        try
        {
            var avaliacao = await context.Avaliacoes.FirstOrDefaultAsync(a => a.IdAvaliacao == id);
            if (avaliacao is null)
            {
                return NotFound(new { message = "Avaliacao nao encontrada." });
            }

            context.Avaliacoes.Remove(avaliacao);
            await context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito de concorrencia.", "O registro foi alterado por outro processo. Tente novamente.");
        }
        catch (DbUpdateException ex)
        {
            return CreateProblem(StatusCodes.Status409Conflict, "Conflito ao excluir.", BuildConflictMessage(ex));
        }
        catch (OperationCanceledException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de exclusao demorou mais do que o esperado.");
        }
        catch (TimeoutException)
        {
            return CreateProblem(StatusCodes.Status408RequestTimeout, "Tempo limite excedido.", "A operacao de exclusao demorou mais do que o esperado.");
        }
        catch (NpgsqlException ex) when (ex.IsTransient)
        {
            return CreateProblem(StatusCodes.Status503ServiceUnavailable, "Banco de dados indisponivel.", "Nao foi possivel excluir no banco de dados no momento.");
        }
        catch (Exception)
        {
            return CreateProblem(StatusCodes.Status500InternalServerError, "Erro interno.", "Ocorreu um erro inesperado ao remover a avaliacao.");
        }
    }

    private ObjectResult CreateProblem(int statusCode, string title, string detail)
    {
        return Problem(statusCode: statusCode, title: title, detail: detail);
    }

    private async Task<List<AvaliacaoResponseDto>> GetReviewDtosAsync(int? id = null)
    {
        if (IsInMemoryProvider())
        {
            var query = context.Avaliacoes.AsNoTracking();
            if (id.HasValue)
            {
                query = query.Where(a => a.IdAvaliacao == id.Value);
            }

            return await query
                .OrderByDescending(a => a.CriadoEm)
                .ThenByDescending(a => a.IdAvaliacao)
                .Select(a => new AvaliacaoResponseDto
                {
                    IdAvaliacao = a.IdAvaliacao,
                    IdReserva = a.IdReserva,
                    Nota = a.Nota,
                    Corpo = a.Corpo,
                    CriadoEm = a.CriadoEm
                })
                .ToListAsync();
        }

        const string sql = """
            SELECT
                a.id_avaliacao,
                a.id_reserva,
                a.nota,
                a.corpo,
                a.criado_em,
                COALESCE(c.nome, 'Usuario nao informado') AS nome_usuario,
                COALESCE(s.nome, 'Sala nao informada') AS nome_sala,
                COALESCE(s.tipo::text, 'Tipo nao informado') AS tipo_sala
            FROM public.avaliacao a
            LEFT JOIN public.reservas r ON r.id_reserva = a.id_reserva
            LEFT JOIN public.cliente c ON c.id_cliente = r.id_cliente
            LEFT JOIN public.sala s ON s.id_sala = r.id_sala
            WHERE (@id IS NULL OR a.id_avaliacao = @id)
            ORDER BY a.criado_em DESC, a.id_avaliacao DESC;
            """;

        await using var connection = context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var parameter = command.CreateParameter();
        parameter.ParameterName = "@id";
        parameter.Value = id.HasValue ? id.Value : DBNull.Value;
        command.Parameters.Add(parameter);

        var items = new List<AvaliacaoResponseDto>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(new AvaliacaoResponseDto
            {
                IdAvaliacao = reader.GetInt32(0),
                IdReserva = reader.IsDBNull(1) ? null : reader.GetInt32(1),
                Nota = reader.GetInt32(2),
                Corpo = reader.IsDBNull(3) ? null : reader.GetString(3),
                CriadoEm = DateOnly.FromDateTime(reader.GetDateTime(4)),
                NomeUsuario = reader.GetString(5),
                NomeSala = reader.GetString(6),
                TipoSala = reader.GetString(7)
            });
        }

        return items;
    }

    private async Task<List<ReservaOptionDto>> GetReservationOptionsAsync()
    {
        if (IsInMemoryProvider())
        {
            return await context.Reservas.AsNoTracking()
                .OrderBy(r => r.IdReserva)
                .Select(r => new ReservaOptionDto
                {
                    IdReserva = r.IdReserva
                })
                .ToListAsync();
        }

        const string sql = """
            SELECT
                r.id_reserva,
                COALESCE(c.nome, 'Usuario nao informado') AS nome_usuario,
                COALESCE(s.nome, 'Sala nao informada') AS nome_sala,
                COALESCE(s.tipo::text, 'Tipo nao informado') AS tipo_sala
            FROM public.reservas r
            LEFT JOIN public.cliente c ON c.id_cliente = r.id_cliente
            LEFT JOIN public.sala s ON s.id_sala = r.id_sala
            ORDER BY c.nome, s.nome, r.id_reserva;
            """;

        await using var connection = context.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        await using var command = connection.CreateCommand();
        command.CommandText = sql;

        var items = new List<ReservaOptionDto>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(new ReservaOptionDto
            {
                IdReserva = reader.GetInt32(0),
                NomeUsuario = reader.GetString(1),
                NomeSala = reader.GetString(2),
                TipoSala = reader.GetString(3)
            });
        }

        return items;
    }

    private static bool IsValidationFailure(DbUpdateException ex)
    {
        return ex.InnerException is PostgresException postgresException &&
               postgresException.SqlState == PostgresErrorCodes.CheckViolation;
    }

    private static string BuildConflictMessage(DbUpdateException ex)
    {
        if (ex.InnerException is not PostgresException postgresException)
        {
            return "Nao foi possivel concluir a operacao devido a um conflito de dados.";
        }

        return postgresException.SqlState switch
        {
            PostgresErrorCodes.ForeignKeyViolation => "O recurso informado referencia uma reserva inexistente ou invalida.",
            PostgresErrorCodes.UniqueViolation => "Ja existe um registro com os mesmos dados unicos.",
            _ => "Nao foi possivel concluir a operacao devido a um conflito de dados."
        };
    }

    private bool IsInMemoryProvider()
    {
        return string.Equals(context.Database.ProviderName, "Microsoft.EntityFrameworkCore.InMemory", StringComparison.OrdinalIgnoreCase);
    }
}
