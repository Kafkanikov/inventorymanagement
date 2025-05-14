using ECommerce.Server.Data;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System;
using ECommerce.Server.Controllers;
using ECommerce.Server.Interfaces;
using ECommerce.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<EcommerceDbContext>(options => 
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// --- Authentication & Authorization Services ---
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true; // Important for security
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // Recommended for HTTPS
        options.Cookie.SameSite = SameSiteMode.Strict; // Or Lax, depending on your needs with cross-site requests
        options.ExpireTimeSpan = TimeSpan.FromMinutes(60); // Session duration
        options.SlidingExpiration = true; // Resets expiration on activity
        options.LoginPath = "/api/Auth/unauthorized"; // Redirect path if [Authorize] fails (for UI, API might just return 401)
        options.AccessDeniedPath = "/api/Auth/forbidden"; // Redirect path for 403
        options.Events = new CookieAuthenticationEvents
        {
            // Prevent redirect to LoginPath for API calls, just return 401
            OnRedirectToLogin = context =>
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            },
            // Prevent redirect to AccessDeniedPath for API calls, just return 403
            OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Optional: Define policies here if needed (e.g., based on roles)
    // options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

builder.Services.AddControllers();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IStockService, StockService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUnitService, UnitService>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IItemDetailService, ItemDetailService>();
builder.Services.AddScoped<IInventoryLogService, InventoryLogService>();
builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

var app = builder.Build();


app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var dbContext = services.GetRequiredService<EcommerceDbContext>();
            var logger = services.GetRequiredService<ILogger<Program>>(); // Optional: for logging

            dbContext.Database.EnsureCreated(); // Alternative: only creates if doesn't exist, doesn't use migrations
            //dbContext.Database.Migrate(); // Recommended: applies pending migrations

            // --- Call the seeding method ---
            await SeedInitialUser(dbContext, logger);

        }
        catch (Exception ex)
        {
            // Log errors if seeding fails
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred during database seeding.");
            // Depending on the severity, you might want to stop the application
            // throw;
        }
    } // Scope is disposed here, releasing services
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
};

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
async Task SeedInitialUser(EcommerceDbContext context, ILogger logger)
{
    logger.LogInformation("Checking if initial user seeding is required...");

    // 1. Check if any users already exist
    if (await context.Users.AnyAsync())
    {
        logger.LogInformation("Database already contains users. No seeding needed.");
        return; // Database has been seeded
    }

    logger.LogInformation("Seeding initial user...");

    // 2. Define the first user's details
    var initialUsername = "admin"; // Choose a username
    var initialPassword = "Password123!"; // Choose a strong password (change this!)

    // 4. Create the user object
    var initialUser = new ECommerce.Server.Data.Entities.User // Use the correct namespace for your User model
    {
        Username = initialUsername,
        Password = initialPassword,
    };

    // 5. Add the user to the context and save changes
    context.Users.Add(initialUser);
    await context.SaveChangesAsync();

    logger.LogInformation($"Initial user '{initialUsername}' created successfully.");
}

