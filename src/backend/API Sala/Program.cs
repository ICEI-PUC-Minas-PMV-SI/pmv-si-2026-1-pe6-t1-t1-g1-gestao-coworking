//É para esse local que vem as configurações do AppDbContext
using coworking_salas.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


//Serviços tem que ficar antes do Builder
// Controllers + JSON (evitar ciclos)
//AddJsonOptions é para evitar ciclos infinitos de ligação entre usos e salas

builder.Services.AddControllers()
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext
//Serviço adicionado por meio da injeção de dependência lá do AppDbContext
//Services é o serviço que ele vai adicionar e a classe é AppDbContext
//As configurações são adicionadas depois do options
//Do SQLServer adiciona a string de conexão que fica no appsettings
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// Pipeline
app.UseAuthorization();
app.MapControllers();

app.Run();