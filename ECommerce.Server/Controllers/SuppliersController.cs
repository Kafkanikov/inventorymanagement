using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;

        public SuppliersController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        // GET: api/Suppliers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierReadDto>>> GetSuppliers([FromQuery] bool includeDisabled = false)
        {
            var suppliers = await _supplierService.GetAllSuppliersAsync(includeDisabled);
            return Ok(suppliers);
        }

        // GET: api/Suppliers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierReadDto>> GetSupplier(int id)
        {
            var supplierDto = await _supplierService.GetSupplierByIdAsync(id);

            if (supplierDto == null)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found." });
            }

            return Ok(supplierDto);
        }

        // PUT: api/Suppliers/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSupplier(int id, SupplierWriteDto supplierWriteDto)
        {
            var success = await _supplierService.UpdateSupplierAsync(id, supplierWriteDto);
            if (!success)
            {
                if (!await _supplierService.SupplierExistsAsync(id)) // Check if it was a "not found" scenario
                {
                    return NotFound(new { message = $"Supplier with ID {id} not found for update." });
                }
                return Conflict(new { message = "Failed to update supplier. A supplier with the same name or email might already exist, or a concurrency issue occurred." });
            }
            return NoContent();
        }

        // POST: api/Suppliers
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Supplier>> PostSupplier(SupplierWriteDto supplierWriteDto)
        {
            var createdSupplierDto = await _supplierService.CreateSupplierAsync(supplierWriteDto);

            if (createdSupplierDto == null)
            {
                // This indicates a failure in the service, possibly due to a unique constraint
                return Conflict(new { message = $"Failed to create supplier. A supplier with the name '{supplierWriteDto.Name}' or similar unique field might already exist." });
            }

            // Corrected to return the DTO of the created resource (SupplierReadDto)
            return CreatedAtAction(nameof(GetSupplier), new { id = createdSupplierDto.ID }, createdSupplierDto);
        }

        // DELETE: api/Suppliers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var success = await _supplierService.SoftDeleteSupplierAsync(id);

            if (!success)
            {
                return NotFound(new { message = $"Supplier with ID {id} not found for deletion." });
            }

            return NoContent();
        }
    }
}
