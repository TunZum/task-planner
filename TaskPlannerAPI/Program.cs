using Microsoft.EntityFrameworkCore;
using TaskPlannerAPI.Data;
using TaskPlannerAPI.Models;

var builder = WebApplication.CreateBuilder(args);

// Добавляем контекст БД
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Добавляем CORS (чтобы фронтенд мог обращаться)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();

    });
});

// Добавляем Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Включаем Swagger в development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();

// ========== API ENDPOINTS ==========

// GET /api/tasks - все задачи
app.MapGet("/api/tasks", async (AppDbContext context, bool? completed) =>
{
    var query = context.Tasks.AsQueryable();
    if (completed.HasValue)
        query = query.Where(t => t.IsCompleted == completed.Value);

    return await query.OrderByDescending(t => t.CreatedDate).ToListAsync();
});

// GET /api/tasks/{id} - задача по ID
app.MapGet("/api/tasks/{id}", async (AppDbContext context, int id) =>
{
    var task = await context.Tasks.FindAsync(id);
    return task is not null ? Results.Ok(task) : Results.NotFound();
});

// POST /api/tasks - создать задачу
app.MapPost("/api/tasks", async (AppDbContext context, TaskItem task) =>
{
    if (string.IsNullOrWhiteSpace(task.Title))
        return Results.BadRequest("Title is required");

    task.CreatedDate = DateTime.UtcNow;
    task.IsCompleted = false;
    task.CompletedDate = null;

    context.Tasks.Add(task);
    await context.SaveChangesAsync();

    return Results.Created($"/api/tasks/{task.Id}", task);
});

// PUT /api/tasks/{id} - обновить задачу
app.MapPut("/api/tasks/{id}", async (AppDbContext context, int id, TaskItem updatedTask) =>
{
    var task = await context.Tasks.FindAsync(id);
    if (task is null) return Results.NotFound();

    task.Title = updatedTask.Title;
    task.Description = updatedTask.Description;
    task.IsCompleted = updatedTask.IsCompleted;

    if (updatedTask.IsCompleted && !task.IsCompleted)
        task.CompletedDate = DateTime.UtcNow;
    else if (!updatedTask.IsCompleted && task.IsCompleted)
        task.CompletedDate = null;

    await context.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE /api/tasks/{id} - удалить задачу
app.MapDelete("/api/tasks/{id}", async (AppDbContext context, int id) =>
{
    var task = await context.Tasks.FindAsync(id);
    if (task is null) return Results.NotFound();

    context.Tasks.Remove(task);
    await context.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();