using System.IO;
using System.Text.Json;
using Backend.Data;
using Backend.Extensions;
using Backend.Interfaces;
using Backend.Services;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var dataProtectionDirectory = new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, ".data-protection"));
if (!dataProtectionDirectory.Exists)
{
    dataProtectionDirectory.Create();
}

builder.Services
    .AddDataProtection()
    .PersistKeysToFileSystem(dataProtectionDirectory)
    .SetApplicationName("ConvoEaseBackend");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var message = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Validation failed." : e.ErrorMessage)
            .FirstOrDefault() ?? "Validation failed.";

        return new BadRequestObjectResult(new
        {
            message,
            statusCode = 400
        });
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
    try
    {
        var sessionRepository = scope.ServiceProvider.GetRequiredService<IUserSessionRepository>();
        await sessionRepository.EnsureSchemaAsync();
    }
    catch (Exception ex) when (ex.Message.Contains("duplicate column name", StringComparison.OrdinalIgnoreCase))
    {
        // Existing SQLite files will hit this path once the column is already present.
    }

    var seeder = scope.ServiceProvider.GetRequiredService<ApplicationDbSeeder>();
    await seeder.SeedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (builder.Configuration.GetValue("UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}
app.UseApiInfrastructure();
app.MapControllers();

app.Run();
