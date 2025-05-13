using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class UnitService : IUnitService
    {
        private readonly EcommerceDbContext _context;

        public UnitService(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UnitReadDto>> GetAllUnitsAsync(bool includeDisabled = false)
        {
            var query = _context.Units.AsQueryable();

            if (!includeDisabled)
            {
                query = query.Where(u => !u.Disabled);
            }

            return await query
                .OrderBy(u => u.Name)
                .Select(u => new UnitReadDto
                {
                    ID = u.ID,
                    Name = u.Name,
                    Disabled = u.Disabled
                })
                .ToListAsync();
        }

        public async Task<UnitReadDto?> GetUnitByIdAsync(int id)
        {
            var unit = await _context.Units.FindAsync(id);

            if (unit == null)
            {
                return null;
            }

            return new UnitReadDto
            {
                ID = unit.ID,
                Name = unit.Name,
                Disabled = unit.Disabled
            };
        }

        public async Task<UnitReadDto?> CreateUnitAsync(UnitWriteDto unitDto)
        {
            // Check if unit name already exists, as it's unique
            if (await _context.Units.AnyAsync(u => u.Name == unitDto.Name))
            {
                // Consider throwing a custom DuplicateNameException or returning a specific error indicator
                return null; // Indicates name conflict
            }

            var unit = new Unit
            {
                Name = unitDto.Name,
                Disabled = false // Always active on creation
            };

            _context.Units.Add(unit);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */) // Should be caught by AnyAsync check, but good for other DB issues
            {
                // Log ex
                return null; // General creation failure
            }

            return new UnitReadDto
            {
                ID = unit.ID,
                Name = unit.Name,
                Disabled = unit.Disabled
            };
        }

        public async Task<bool> UpdateUnitAsync(int id, UnitWriteDto unitDto)
        {
            var unitToUpdate = await _context.Units.FindAsync(id);

            if (unitToUpdate == null)
            {
                return false; // Not found
            }

            // Check if the new name is being taken by another unit
            if (unitToUpdate.Name != unitDto.Name &&
                await _context.Units.AnyAsync(u => u.Name == unitDto.Name && u.ID != id))
            {
                // Consider throwing a custom DuplicateNameException
                return false; // Name conflict
            }

            unitToUpdate.Name = unitDto.Name;
            // 'Disabled' status is NOT updated here

            _context.Entry(unitToUpdate).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await UnitExistsAsync(id)) return false;
                throw;
            }
            catch (DbUpdateException /* ex */) // For potential unique constraint violation if not caught by AnyAsync
            {
                return false;
            }
            return true; // Success
        }

        public async Task<bool> SoftDeleteUnitAsync(int id)
        {
            var unit = await _context.Units.FindAsync(id);
            if (unit == null)
            {
                return false; // Not found
            }

            if (unit.Disabled)
            {
                return true; // Already disabled
            }

            bool isUsedAsBaseUnit = await _context.Items
                .AnyAsync(item => item.BaseUnitID == id);

            if (isUsedAsBaseUnit)
            {
                return false;
            }

            unit.Disabled = true;
            _context.Entry(unit).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await UnitExistsAsync(id)) return false;
                throw;
            }
            catch (DbUpdateException /* ex */) // For potential unique constraint violation if not caught by AnyAsync
            {
                return false;
            }

            return true;
        }

        public async Task<bool> UnitExistsAsync(int id)
        {
            return await _context.Units.AnyAsync(e => e.ID == id );
        }
    }
}
