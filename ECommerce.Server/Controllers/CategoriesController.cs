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
using ECommerce.Server.Services;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryReadDto>>> GetCategories([FromQuery] bool includeDisabled = false)
        {
            var categories = await _categoryService.GetAllCategoriesAsync(includeDisabled);
            return Ok(categories);
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryReadDto>> GetCategory(int id)
        {
            var categoryDto = await _categoryService.GetCategoryByIdAsync(id);
            if (categoryDto == null)
            {
                return NotFound(new {message = $"Category with ID {id} not found." });
            }

            return categoryDto;
        }

        // PUT: api/Categories/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(int id, CategoryWriteDto categoryWriteDto)
        {
            var success = await _categoryService.UpdateCategoryAsync(id, categoryWriteDto);
            if (!success)
            {
                if (!await _categoryService.CategoryExistsAsync(id)) // Check if it was a "not found" scenario
                {
                    return NotFound(new { message = $"Category with ID {id} not found for update." });
                }
                return Conflict(new { message = "Failed to update category. A concurrency issue occurred." });
            }
            return NoContent();
        }

        // POST: api/Categories
        [HttpPost]
        public async Task<ActionResult<CategoryWriteDto>> PostCategory(CategoryWriteDto categoryWriteDto)
        {
            var createdCategoryDto = await _categoryService.CreateCategoryAsync(categoryWriteDto);

            if (createdCategoryDto == null)
            {
                return BadRequest(new { message = "Failed to create category. A category with the same name might already exist." });
            }

            // Returns HTTP 201 Created, with the location of the new resource in the Location header, and the new resource in the body.
            return CreatedAtAction(nameof(GetCategory), new { id = createdCategoryDto.ID }, createdCategoryDto);
        }

        // DELETE: api/Categories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var success = await _categoryService.SoftDeleteCategoryAsync(id);

            if (!success)
            {
                return NotFound(new { message = $"Category with ID {id} not found for deletion." });
            }

            return NoContent(); // Returns HTTP 204 No Content, indicating the operation was successful
        }
    }
}
