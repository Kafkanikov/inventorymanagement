using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class SupplierService : ISupplierService
    {
        private readonly EcommerceDbContext _context;

        public SupplierService(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SupplierReadDto>> GetAllSuppliersAsync(bool includeDisabled)
        {
            var query = _context.Suppliers.AsQueryable();
            if (!includeDisabled)
            {
                query = query.Where(s => s.Disabled == false);
            }
            return await query
                .OrderBy(s => s.Name) // Optional: Order by name
                .Select(s => new SupplierReadDto
                {
                    ID = s.ID,
                    Name = s.Name,
                    Address = s.Address,
                    Tel = s.Tel,
                    Email = s.Email,
                    Disabled = s.Disabled
                })
                .ToListAsync();
        }

        public async Task<SupplierReadDto?> GetSupplierByIdAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return null;
            }

            return new SupplierReadDto
            {
                ID = supplier.ID,
                Name = supplier.Name,
                Address = supplier.Address,
                Tel = supplier.Tel,
                Email = supplier.Email,
                Disabled = supplier.Disabled
            };
        }

        public async Task<SupplierReadDto?> CreateSupplierAsync(SupplierWriteDto supplierWriteDto)
        {
            var supplier = new Supplier
            {
                Name = supplierWriteDto.Name,
                Address = supplierWriteDto.Address,
                Tel = supplierWriteDto.Tel,
                Email = supplierWriteDto.Email,
                Disabled = false // Default to not disabled
            };

            _context.Suppliers.Add(supplier);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) // Catch potential unique constraint violation
            {
                if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true &&
                    (ex.InnerException.Message.Contains("Supplier.Name") ||
                     ex.InnerException.Message.Contains("UK_Supplier_Name"))) // Example constraint names
                {
                    return null; // Indicate failure due to duplicate, controller can return Conflict
                }

                // Re-throw other exceptions
                throw;
            }

            return new SupplierReadDto
            {
                ID = supplier.ID,
                Name = supplier.Name,
                Address = supplier.Address,
                Tel = supplier.Tel,
                Email = supplier.Email,
                Disabled = supplier.Disabled
            };
        }
        public async Task<bool> UpdateSupplierAsync(int id, SupplierWriteDto supplierWriteDto)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return false; // Not found
            }
            supplier.Name = supplierWriteDto.Name;
            supplier.Address = supplierWriteDto.Address;
            supplier.Tel = supplierWriteDto.Tel;
            supplier.Email = supplierWriteDto.Email;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await SupplierExistsAsync(id))
                {
                    return false; // Not found
                }
                throw;
            }
            return true; // Update successful
        }

        public async Task<bool> SoftDeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
            {
                return false; // Not found
            }
            supplier.Disabled = true; // Soft delete
            await _context.SaveChangesAsync();
            return true; // Soft delete successful
        }
        public async Task<bool> SupplierExistsAsync(int id)
        {
            return await _context.Suppliers.AnyAsync(e => e.ID == id);
        }
    }
}
