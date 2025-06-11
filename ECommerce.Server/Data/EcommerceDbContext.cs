using ECommerce.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities;
using ECommerce.Server.Data.Views;
using ECommerce.Server.Data.DTO.Response;

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
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<PurchaseDetail> PurchaseDetails { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleDetail> SaleDetails { get; set; }
        public DbSet<CurrentStockViewResult> CurrentStockLevels { get; set; }
        public DbSet<ItemDetailStockViewResult> ItemDetailStockLevels { get; set; }
        public DbSet<ItemFinancialSummaryViewResult> ItemFinancialSummaries { get; set; }
        public DbSet<JournalPage> JournalPages { get; set; }
        public DbSet<JournalPost> JournalEntries { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<AccountCategory> AccountCategories { get; set; }
        public DbSet<AccountSubCategory> AccountSubCategories { get; set; }
        public DbSet<SalesPerformanceByItemDto> SalesPerformanceByItem { get; set; }
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
                modelBuilder.Entity<Purchase>(entity =>
                {
                    entity.HasIndex(e => e.Code).IsUnique(); // From your SQL schema

                    entity.Property(e => e.Date).HasColumnType("date");
                    entity.Property(e => e.Cost).HasColumnType("money");

                    entity.HasOne(d => d.User)
                        .WithMany() // Or specific collection if User has one for Purchases
                        .HasForeignKey(d => d.UserID)
                        .OnDelete(DeleteBehavior.SetNull); // If UserID is nullable and User deleted

                    entity.HasOne(d => d.Supplier)
                        .WithMany() // Or specific collection
                        .HasForeignKey(d => d.SupplierID)
                        .OnDelete(DeleteBehavior.SetNull); // If SupplierID is nullable

                    entity.HasOne(d => d.StockLocation) // Matched navigation property name
                        .WithMany() // Or specific collection
                        .HasForeignKey(d => d.StockID)
                        .OnDelete(DeleteBehavior.SetNull); // If StockID is nullable
                    entity.ToTable(tb => tb.UseSqlOutputClause(false));
                });

                modelBuilder.Entity<PurchaseDetail>(entity =>
                {
                    entity.Property(e => e.Cost).HasColumnType("money");

                    // Configuring relationship based on Alternate Key (Code)
                    // 1. PurchaseDetail -> Purchase (Many-to-One)
                    entity.HasOne(d => d.Purchase)
                        .WithMany(p => p.PurchaseDetails)
                        .HasPrincipalKey(p => p.Code) // Purchase.Code is the principal key for this relationship
                        .HasForeignKey(d => d.PurchaseCode) // PurchaseDetail.PurchaseCode is the foreign key
                        .OnDelete(DeleteBehavior.Cascade); // If a Purchase order is deleted, its details are deleted.
                                                           // Given soft delete on Purchase, this DB cascade won't fire for soft deletes.
                                                           // For physical deletes, this is standard.

                    // 2. PurchaseDetail -> ItemDetail (Many-to-One)
                    // This assumes ItemDetails.Code is a suitable alternate key on ItemDetail.
                    // Ensure ItemDetails.Code has a unique index (which it does in your schema).
                    entity.HasOne(d => d.ItemDetail)
                        .WithMany() // Assuming ItemDetail doesn't have a direct collection of PurchaseDetails
                        .HasPrincipalKey(id => id.Code) // ItemDetails.Code is the principal key
                        .HasForeignKey(d => d.ItemCode) // PurchaseDetail.ItemCode is the foreign key
                        .OnDelete(DeleteBehavior.NoAction); // Prevent deleting ItemDetail if in PurchaseDetail.
                                                            // This means you must disable ItemDetail instead.
                });
            });
            modelBuilder.Entity<Sale>(entity =>
            {
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Date).HasColumnType("date");
                entity.Property(e => e.Price).HasColumnType("money");

                entity.HasOne(d => d.User)
                    .WithMany() // Or specific collection if User has one for Sales
                    .HasForeignKey(d => d.UserID)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(d => d.StockLocation)
                    .WithMany() // Or specific collection
                    .HasForeignKey(d => d.StockID)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.ToTable(tb => tb.UseSqlOutputClause(false));
            });

            modelBuilder.Entity<SaleDetail>(entity =>
            {
                entity.Property(e => e.Cost).HasColumnType("money"); // Maps to SaleDetails.Cost

                entity.HasOne(d => d.Sale)
                    .WithMany(p => p.SaleDetails)
                    .HasPrincipalKey(p => p.Code) // Sale.Code is the principal key
                    .HasForeignKey(d => d.SaleCode) // SaleDetail.SaleCode is the foreign key
                    .OnDelete(DeleteBehavior.Cascade); // If Sale is deleted, its details are deleted

                entity.HasOne(d => d.ItemDetail)
                    .WithMany() // Assuming ItemDetail doesn't have a direct collection of SaleDetails
                    .HasPrincipalKey(id => id.Code) // ItemDetails.Code is the principal key
                    .HasForeignKey(d => d.ItemCode) // SaleDetail.ItemCode is the foreign key
                    .OnDelete(DeleteBehavior.NoAction); // Prevent deleting ItemDetail if in SaleDetail
            });
            modelBuilder.Entity<CurrentStockViewResult>(eb =>
            {
                eb.HasNoKey(); 
                eb.ToView("V_CurrentStock"); // Maps this entity to the database view named "V_CurrentStock"
            });
            modelBuilder.Entity<ItemDetailStockViewResult>(eb =>
            {
                eb.HasNoKey(); // Views are query-only
                eb.ToView("V_ItemDetailStockOnHand");
            });
            modelBuilder.Entity<ItemFinancialSummaryViewResult>(eb =>
            {
                eb.HasNoKey(); // Views are query-only
                eb.ToView("V_ItemFinancialSummary");
            });
            modelBuilder.Entity<JournalPage>(entity =>
            {
                entity.HasOne(jp => jp.User) // Assuming User navigation property on JournalPage
                      .WithMany() // Assuming User doesn't have a direct collection of JournalPages
                      .HasForeignKey(jp => jp.UserID)
                      .OnDelete(DeleteBehavior.SetNull); // Or NoAction, if UserID can be null

                // Define relationship for JournalPage.CurrencyID if you have a Currency table/entity
                // entity.HasOne(jp => jp.Currency)
                //       .WithMany()
                //       .HasForeignKey(jp => jp.CurrencyID)
                //       .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<JournalPost>(entity =>
            {
                entity.Property(e => e.Debit).HasColumnType("money");
                entity.Property(e => e.Credit).HasColumnType("money");

                // Relationship from JournalPost to JournalPage (Many-to-One)
                entity.HasOne(je => je.JournalPage)
                    .WithMany(jp => jp.JournalEntries) // Assumes ICollection<JournalPost> in JournalPage.cs
                    .HasForeignKey(je => je.JournalPageID)
                    .OnDelete(DeleteBehavior.Cascade); // If JournalPage is deleted, its entries are deleted

                // Relationship from JournalPost to Account (Many-to-One)
                // This uses Account.AccountNumber (mapped from Account.Code in your SQL) as the principal key
                // and JournalPost.Account as the foreign key.
                entity.HasOne(je => je.AccountEntity) // Navigation property in JournalPost to Account
                    .WithMany(a => a.JournalEntries) // ICollection<JournalPost> in Account.cs
                    .HasPrincipalKey(a => a.AccountNumber) // The principal key in Account is AccountNumber (SQL Code)
                    .HasForeignKey(je => je.Account) // The foreign key in JournalPost is Account (which stores AccountNumber)
                    .OnDelete(DeleteBehavior.NoAction); // Prevent deleting an Account if it has journal entries
            });

            modelBuilder.Entity<Account>(entity =>
            {
                entity.ToTable("Account");
                entity.HasKey(e => e.ID);

                entity.Property(e => e.AccountNumber) // This maps to 'Code' column in SQL
                    .HasColumnName("Code")
                    .IsRequired()
                    .HasMaxLength(20);
                entity.HasIndex(e => e.AccountNumber).IsUnique(); // Your SQL has Account.Code as UNIQUE

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(150);
                // Your SQL didn't explicitly state UNIQUE for Account.Name, but it's common.
                // If it should be unique: entity.HasIndex(e => e.Name).IsUnique();

                entity.Property(e => e.NormalBalance) // This maps to 'Bal' column in SQL
                    .HasColumnName("Bal")
                    .IsRequired()
                    .HasMaxLength(10);



                // Relationship: Account to AccountCategory (Many-to-One)
                entity.HasOne(a => a.AccountCategory)
                    .WithMany(ac => ac.Accounts) // Assumes ICollection<Account> Accounts in AccountCategory
                    .HasForeignKey(a => a.CategoryID)
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict, as per your SQL FK

                // Relationship: Account to AccountSubCategory (Many-to-One, optional)
                entity.HasOne(a => a.AccountSubCategory)
                    .WithMany(asb => asb.Accounts) // Assumes ICollection<Account> Accounts in AccountSubCategory
                    .HasForeignKey(a => a.SubCategoryID)
                    .IsRequired(false) // Since SubCategoryID is nullable
                    .OnDelete(DeleteBehavior.NoAction); // Or Restrict / SetNull
            });
            modelBuilder.Entity<AccountCategory>(entity =>
            {
                entity.ToTable("AccCategory"); // Explicit table name
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.HasIndex(e => e.Name).IsUnique(); 
            });

            modelBuilder.Entity<AccountSubCategory>(entity =>
            {
                entity.ToTable("AccSubCategory");
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Code).HasMaxLength(50); 
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);
            });
            modelBuilder.Entity<SalesPerformanceByItemDto>().HasNoKey();
        }
    }
}
