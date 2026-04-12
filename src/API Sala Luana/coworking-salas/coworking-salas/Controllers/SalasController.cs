//Endpoints ficam aqui nos Controllers ficam responsáveis pela requisições http da WEB API
//Padrão normalmente usa a entidade no plural(Salas)
using coworking_salas.DTOs;
using coworking_salas.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;

namespace coworking_salas.Controllers
{
    //Rota do controlador dominios/api/salas
    [Route("api/[controller]")]
    [ApiController]
    //Está herdando as configurações do controller base
    public class SalasController : ControllerBase
    {
        //toda vez que precisar acessar o banco de dados para leitura ou gravação essa variável será utilizada
        private readonly AppDbContext _context;

        //injeção de depedência, em cima criou uma entidade de somente leitura e nesse construtor(ctor) diz que recebeu um objeto do tipo AppDbContext
        //que foi configuraddo na classe de programa
        //toda classe que precisar usar o banco de dados basta fazer essa configuração que o banco já está disponível
        public SalasController(AppDbContext context)
        {
            _context = context;

        }

        //Get é usado para recuperar dados
        [HttpGet]
        //rota de index para mostrar todas as salas cadastradas
        //ActionREsult é o resultado da requisição Http para o serviço rest
        public async Task<ActionResult> GetAll()
        {
            //a variável _context é o banco de dados e o ToListAsync é para fazer uma requisição assincrona
            //para não bloquear quando existirem muitas requisiçõess
            List<Sala> model = await _context.Salas.ToListAsync();

            return Ok(model);
        }

        //Post é usado quando queremos criar algo.
        // Cria uma sala no banco de dados
        //HttpPost diz que o métodp responde a requisições
        //recebe JSON, transforma em DTO, de DTO converte para a entidade sala, prepara/add a sala, salva ela no banco, retorna 201 se der certo e 400 se der erro
        [HttpPost]
        public async Task<ActionResult> Create(SalaCreateDto dto)
        {
            //Converter JSON da requisição em objeto C#
            try
            {
                //Converte o DTO em Entidade
                var model = new Sala
                {
                    Nome = dto.Nome,
                    TipoSala = dto.TipoSala,
                    Capacidade = dto.Capacidade,
                    Descricao = dto.Descricao,
                    Recursos = dto.Recursos,
                    CriadoEm = dto.CriadoEm
                };

                //adiciona sala ao banco
                _context.Salas.Add(model);
                //salva no banco de dados
                await _context.SaveChangesAsync();

                //retorna status http e indica onde acessar o recurso criado
                return CreatedAtAction("GetByID", new { id = model.Id }, model);
            }
            //retorna se der erro
            //ex.InnerException?.Message ?? ex.Message tenta pegar erro interno mais detalhado e se não conseguir pega normal
            catch (Exception ex)
            {
                return BadRequest(ex.InnerException?.Message ?? ex.Message);
            }
        }
        [HttpGet("{id}")]
        public async Task<ActionResult> GetByID(int id)
        {
            var model = await _context.Salas
                .Include(t => t.Usos)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (model == null) return NotFound();

            GerarLinks(model);
            return Ok(model);

        }

        //Put é usado para atualizar dados.
        // atualizar os dados da sala

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, SalaUpdateDto dto)
        {
            //if (id != dto.Id) return BadRequest();

            var model = await _context.Salas.FindAsync(id);
            if (model == null) return NotFound();

            model.Nome = dto.Nome;
            model.TipoSala = dto.TipoSala;
            model.Capacidade = dto.Capacidade;
            model.Descricao = dto.Descricao;
            model.Recursos = dto.Recursos;
            model.CriadoEm = dto.CriadoEm;

            await _context.SaveChangesAsync();

            return NoContent();
        }
        //Delete é usado para excluir dados. Tudo que você precisa é o Id:

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            // mesma função do FirstOrDefaultAsyn ele vai recuperar as funções da chave primária do ido que foi passado como parâmetro
            var model = await _context.Salas.FindAsync(id);

            if (model == null) return NotFound();
            //se ele não retornou not found o conteúdo existe então então faz:
            _context.Salas.Remove(model);
            //depois manda atualizar e salvar as alterações
            await _context.SaveChangesAsync();

            return NoContent();

        }

        private void GerarLinks(Sala model)
        {
            //para que o próprio sistema possa recuperar a rota de forma automatica
            model.Links.Add(new LinkDto(model.Id, Url.ActionLink(), rel: "self", metodo: "GET"));
            model.Links.Add(new LinkDto(model.Id, Url.ActionLink(), rel: "update", metodo: "PUT"));
            model.Links.Add(new LinkDto(model.Id, Url.ActionLink(), rel: "delete", metodo: "DELETE"));
        }
    }
    
}
