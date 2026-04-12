using coworking_salas.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace coworking_salas.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsosController(AppDbContext context)
        {
            _context = context;

        }

        // Recupera todos
        [HttpGet]
        public async Task<ActionResult> GetAll()
        {
            List<Uso> model = await _context.Usos.ToListAsync();

            return Ok(model);
        }
        // Cria um uso no banco de dados

        [HttpPost]
        public async Task<ActionResult> Create(Uso model)
        {
            
            _context.Usos.Add(model);
            await _context.SaveChangesAsync();
           
            
            return CreatedAtAction("GetByID", new { id = model.Id }, model);

        }

        // recupera pelo id
        [HttpGet("{id}")]
        public async Task<ActionResult> GetByID(int id)
        {
            var model = await _context.Usos
                .FirstOrDefaultAsync(c => c.Id == id);
            if (model == null) return NotFound();
            return Ok(model);

        }
        // atualizar os dados de uso

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, Uso model)
        {
            //se o id for diferente dá um bad request
            if (id != model.Id) return BadRequest();

            // ver se o modelo existe na base de dados e o asnotracking tira a tag de alteração de dados
            var modeloDb = await _context.Usos.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);
            //se for null retorna not found
            if (modeloDb == null) return NotFound();

            //se uso existir vai atualizar os dados
            _context.Usos.Update(model);
            await _context.SaveChangesAsync();

            //não precisa retornar conteúdo porque você só quer atualizar a informação
            return NoContent();
        }
        // apagar
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            // mesma função do FirstOrDefaultAsyn ele vai recuperar as funções da chave primária do ido que foi passado como parâmetro
            var model = await _context.Usos.FindAsync(id);

            if (model == null) return NotFound();
            //se ele não retornou not found o conteúdo existe então entõ faz:
            _context.Usos.Remove(model);
            //depois manda atualizar e salvar as alterações
            await _context.SaveChangesAsync();

            return NoContent();

        }


    }

}
