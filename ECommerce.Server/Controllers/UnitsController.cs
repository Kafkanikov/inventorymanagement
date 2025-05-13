// File: Controllers/UnitsController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services; // Your service interface
using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Server.Interfaces;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UnitsController : ControllerBase
    {
        private readonly IUnitService _unitService;

        public UnitsController(IUnitService unitService)
        {
            _unitService = unitService;
        }

        // GET: api/Units
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UnitReadDto>>> GetUnits([FromQuery] bool includeDisabled = false)
        {
            var units = await _unitService.GetAllUnitsAsync(includeDisabled);
            return Ok(units);
        }

        // GET: api/Units/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UnitReadDto>> GetUnit(int id)
        {
            var unitDto = await _unitService.GetUnitByIdAsync(id);
            if (unitDto == null)
            {
                return NotFound(new { message = $"Unit with ID {id} not found." });
            }
            return Ok(unitDto);
        }

        // POST: api/Units
        [HttpPost]
        public async Task<ActionResult<UnitReadDto>> PostUnit(UnitWriteDto unitDto)
        {
            var createdUnitDto = await _unitService.CreateUnitAsync(unitDto);
            if (createdUnitDto == null)
            {
                // Likely due to duplicate name
                return Conflict(new { message = $"Failed to create unit. A unit with the name '{unitDto.Name}' may already exist." });
            }
            return CreatedAtAction(nameof(GetUnit), new { id = createdUnitDto.ID }, createdUnitDto);
        }

        // PUT: api/Units/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUnit(int id, UnitWriteDto unitDto)
        {
            var success = await _unitService.UpdateUnitAsync(id, unitDto);
            if (!success)
            {
                if (!await _unitService.UnitExistsAsync(id))
                {
                    return NotFound(new { message = $"Unit with ID {id} not found for update." });
                }
                // If it exists, failure might be due to name conflict or concurrency
                return Conflict(new { message = $"Failed to update unit. A unit with the name '{unitDto.Name}' may already exist, or a concurrency issue occurred." });
            }
            return NoContent();
        }

        // DELETE: api/Units/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUnit(int id)
        {
            var success = await _unitService.SoftDeleteUnitAsync(id);
            if (!success)
            {
                // If unit not found by service, or already disabled (service returns true for already disabled)
                if (!await _unitService.UnitExistsAsync(id))
                {
                    return NotFound(new { message = $"Unit with ID {id} not found for deletion." });
                }
                // This case might be if it was already disabled and service indicates 'true' or if another issue occurred.
                // Given current service logic (returns true if already disabled), a !success and exists is unlikely unless concurrency.
                return NotFound(new { message = $"Unit with ID {id} cannot be disabled. It might be in use as a base unit for items or another issue occurred." });
            }
            return NoContent();
        }
    }
}