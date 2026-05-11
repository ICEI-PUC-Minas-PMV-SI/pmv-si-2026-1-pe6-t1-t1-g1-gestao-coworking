using System.ComponentModel.DataAnnotations.Schema;

namespace coworking_salas.Models
{
    //objeto para montar o link dentro da aplicação
    [NotMapped]
    public class LinkDto
    {
        //id do objeto manipulado
        public int Id { get; set; }

        //link que ele vai usar para navegar, editar, apagar e alterar os dados
        public string Href { get; set; }

        //o link que está relacionado a ele(ação que está sendo executada em relação ao objeto)
        public string Rel { get; set; }

        //método para ficar específico(metodo http que está sendo utilizado sobre a operação)
        public string Metodo { get; set; }

        //construtor para receber as informações
        public LinkDto(int id, string href, string rel, string metodo)
        {
            //id do objeto sendo usado
            Id = id;
            Href = href;
            Rel = rel;
            Metodo = metodo;

           
          
        }

    }
    //relação das listas e links
    public class LinksHATEOS
    {
        [NotMapped]
        public List<LinkDto> Links { get; set; } = new List<LinkDto>();
    }
}
