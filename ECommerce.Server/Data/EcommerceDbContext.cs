using ECommerce.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System;

namespace ECommerce.Server.Data
{
    public class EcommerceDbContext : DbContext
    {
        public EcommerceDbContext(DbContextOptions<EcommerceDbContext> options) : base(options) { }
        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<ItemDetail> ItemDetails { get; set; }
        public DbSet<InventoryLog> InventoryLogs { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Optional: Configure unique constraints, indexes, etc.
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Name)
                .IsUnique();
            modelBuilder.Entity<Supplier>()
                .HasIndex(s => s.Name);
            modelBuilder.Entity<Stock>()
                .HasOne(s => s.ManagedByUser)
                .WithMany() // Or with a collection property in User if User can manage multiple Stocks
                .HasForeignKey(s => s.UserID)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<Unit>()
                .HasIndex(u => u.Name)
                .IsUnique();
            modelBuilder.Entity<Item>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();

                entity.HasOne(d => d.Category)
                    .WithMany() // Assuming Category does not have a collection of Items explicitly. If it does: .WithMany(p => p.Items)
                    .HasForeignKey(d => d.CategoryID)
                    .OnDelete(DeleteBehavior.SetNull); // If Category is deleted, Item.CategoryID becomes NULL (since CategoryID is nullable)

                entity.HasOne(d => d.BaseUnit)
                    .WithMany() // Assuming Unit does not have ItemsAsBaseUnit collection. If it does: .WithMany(p => p.ItemsAsBaseUnit)
                    .HasForeignKey(d => d.BaseUnitID)
                    .OnDelete(DeleteBehavior.NoAction); // Prevent deleting a Unit if it's a BaseUnit for an Item
                // This aligns with the previous business rule for soft-deleting Units.
            });

            modelBuilder.Entity<ItemDetail>(entity =>
            {
                entity.HasIndex(e => e.Code).IsUnique();
                entity.HasIndex(e => new { e.ItemID, e.UnitID }).IsUnique(); // Composite unique key

                entity.Property(e => e.Price).HasColumnType("money"); // Explicitly map to SQL money type

                entity.HasOne(d => d.Item)
                    .WithMany(p => p.ItemDetails) // Assumes ICollection<ItemDetail> in Item.cs
                    .HasForeignKey(d => d.ItemID) 
                    .OnDelete(DeleteBehavior.NoAction);
                    //.OnDelete(DeleteBehavior.Cascade); // Your SQL has REFERENCES Item(ID) which defaults to NO ACTION.
                    // Cascade means if Item is deleted, its ItemDetails are also deleted.
                    // This is common. If you want NO ACTION, set it here.
                    // Given we soft delete Item and cascade soft delete of ItemDetails in service,
                    // a DB-level Cascade might be okay for physical cleanup if Item was physically deleted.
                    // For soft deletes, application logic is key.
                    // Let's stick to NoAction to be safe and rely on app logic for soft deletes.

                entity.HasOne(d => d.Unit)
                    .WithMany() // Or .WithMany(p => p.ItemDetails) if Unit has a collection
                    .HasForeignKey(d => d.UnitID)
                    .OnDelete(DeleteBehavior.NoAction); // Prevent deleting Unit if used in ItemDetails
            });

            modelBuilder.Entity<InventoryLog>(entity =>
            {
                // SQL default for Timestamp is GETDATE(). EF Core can also set default.
                // If using Database-First or matching existing schema, SQL default is fine.
                // If Code-First leading, you might set default here or in entity constructor/service.
                entity.Property(e => e.Timestamp)
                    .HasDefaultValueSql("GETUTCDATE()"); // Or GETDATE() if not UTC focus

                entity.HasOne(d => d.Item)
                    .WithMany(p => p.InventoryLogs)
                    .HasForeignKey(d => d.ItemID)
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict

                entity.HasOne(d => d.ItemDetail)
                    .WithMany() // No inverse navigation property in ItemDetail in our current model
                    .HasForeignKey(d => d.ItemDetailID_Transaction)
                    .IsRequired(false) // Corresponds to ItemDetailID_Transaction INT NULL
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict

                entity.HasOne(d => d.User)
                    .WithMany() // No inverse navigation property in User in our current model
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict

                entity.HasOne(d => d.TransactedUnit)
                    .WithMany() // No inverse navigation property in Unit in our current model
                    .HasForeignKey(d => d.UnitIDTransacted)
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict

                // Note: Your SQL CHECK constraints will be enforced by the database.
                // Service layer should validate before attempting to save.
            });

        }
    }
}
