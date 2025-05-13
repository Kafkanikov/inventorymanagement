// File: Services/StockService.cs
using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class StockService : IStockService
    {
        private readonly EcommerceDbContext _context;

        public StockService(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockReadDto>> GetAllStocksAsync(bool includeDisabled)
        {
            var query = _context.Stocks
                                .Include(s => s.ManagedByUser) // Include user data
                                .AsQueryable();

            if (!includeDisabled)
            {
                query = query.Where(s => !s.Disabled);
            }

            return await query
                .OrderBy(s => s.Name)
                .Select(s => new StockReadDto
                {
                    ID = s.ID,
                    Name = s.Name,
                    Address = s.Address,
                    UserID = s.UserID,
                    ManagedByUsername = s.ManagedByUser != null ? s.ManagedByUser.Username : null, // Display username
                    Disabled = s.Disabled
                })
                .ToListAsync();
        }

        public async Task<StockReadDto?> GetStockByIdAsync(int id)
        {
            var stock = await _context.Stocks
                                    .Include(s => s.ManagedByUser)
                                    .FirstOrDefaultAsync(s => s.ID == id);

            if (stock == null)
            {
                return null;
            }

            return new StockReadDto
            {
                ID = stock.ID,
                Name = stock.Name,
                Address = stock.Address,
                UserID = stock.UserID,
                ManagedByUsername = stock.ManagedByUser != null ? stock.ManagedByUser.Username : null,
                Disabled = stock.Disabled
            };
        }

        public async Task<StockReadDto?> CreateStockAsync(StockWriteDto stockDto)
        {
            // Optional: Check if UserID exists if provided
            if (stockDto.UserID.HasValue && !await _context.Users.AnyAsync(u => u.Id == stockDto.UserID.Value))
            {
                // Handle UserID not found - perhaps return null or throw specific exception
                // For simplicity, we can let the DB FK constraint catch it if it's an issue,
                // or the service can return null indicating a validation failure.
                // For now, let's assume valid UserID if provided.
            }

            var stock = new Stock
            {
                Name = stockDto.Name,
                Address = stockDto.Address,
                UserID = stockDto.UserID,
                Disabled = false // Always false on creation
            };

            _context.Stocks.Add(stock);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) // Handle potential unique constraint on Name if you add one
            {
                // if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true &&
                //     ex.InnerException.Message.Contains("Stock.Name"))
                // {
                //     return null; // Or throw custom exception
                // }
                throw;
            }

            // To return the ManagedByUsername, we might need to re-fetch or ensure the User entity is loaded
            // For simplicity after create, we might not have ManagedByUser loaded yet unless we explicitly load it.
            // Let's fetch it again to include managed by user details.
            var createdStockWithUser = await _context.Stocks
                                          .Include(s => s.ManagedByUser)
                                          .FirstOrDefaultAsync(s => s.ID == stock.ID);

            if (createdStockWithUser == null) return null; // Should not happen if save was successful

            return new StockReadDto
            {
                ID = createdStockWithUser.ID,
                Name = createdStockWithUser.Name,
                Address = createdStockWithUser.Address,
                UserID = createdStockWithUser.UserID,
                ManagedByUsername = createdStockWithUser.ManagedByUser?.Username,
                Disabled = createdStockWithUser.Disabled
            };
        }

        public async Task<bool> UpdateStockAsync(int id, StockWriteDto stockDto)
        {
            var stockToUpdate = await _context.Stocks.FindAsync(id);

            if (stockToUpdate == null)
            {
                return false; // Not found
            }

            // Optional: Check if UserID exists if provided and changed
            if (stockDto.UserID.HasValue && stockToUpdate.UserID != stockDto.UserID &&
                !await _context.Users.AnyAsync(u => u.Id == stockDto.UserID.Value))
            {
                // Handle UserID not found for update.
                return false; // Or throw specific exception
            }


            stockToUpdate.Name = stockDto.Name;
            stockToUpdate.Address = stockDto.Address;
            stockToUpdate.UserID = stockDto.UserID;
            // 'Disabled' status is NOT updated here

            _context.Entry(stockToUpdate).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await StockExistsAsync(id))
                {
                    return false;
                }
                throw;
            }
            // Handle DbUpdateException for unique constraints if any
            return true; // Success
        }

        public async Task<bool> SoftDeleteStockAsync(int id)
        {
            var stock = await _context.Stocks.FindAsync(id);

            if (stock == null)
            {
                return false; // Not found
            }

            if (stock.Disabled) // Already disabled
            {
                return true;
            }

            stock.Disabled = true;
            _context.Entry(stock).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await StockExistsAsync(id))
                {
                    return false;
                }
                throw;
            }
            return true; // Success
        }

        public async Task<bool> StockExistsAsync(int id)
        {
            return await _context.Stocks.AnyAsync(e => e.ID == id);
        }
    }
}