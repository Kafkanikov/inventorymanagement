// File: Controllers/ItemsController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly IItemService _itemService;

        public ItemsController(IItemService itemService)
        {
            _itemService = itemService;
        }

        // GET: api/Items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemReadDto>>> GetItems([FromQuery] bool includeDisabled = false)
        {
            var items = await _itemService.GetAllItemsAsync(includeDisabled);
            return Ok(items);
        }

        // GET: api/Items/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ItemReadDto>> GetItem(int id)
        {
            var itemDto = await _itemService.GetItemByIdAsync(id);
            if (itemDto == null)
            {
                return NotFound(new { message = $"Item with ID {id} not found." });
            }
            return Ok(itemDto);
        }

        // POST: api/Items
        [HttpPost]
        public async Task<ActionResult<ItemReadDto>> PostItem(ItemWriteDto itemDto)
        {
            var createdItemDto = await _itemService.CreateItemAsync(itemDto);
            if (createdItemDto == null)
            {
                // Could be due to duplicate name, invalid CategoryID or BaseUnitID
                return Conflict(new { message = $"Failed to create item. Name may be duplicate, or Category/BaseUnit invalid/disabled." });
            }
            return CreatedAtAction(nameof(GetItem), new { id = createdItemDto.ID }, createdItemDto);
        }

        // PUT: api/Items/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutItem(int id, ItemWriteDto itemDto)
        {
            var success = await _itemService.UpdateItemAsync(id, itemDto);
            if (!success)
            {
                if (!await _itemService.ItemExistsAsync(id))
                {
                    return NotFound(new { message = $"Item with ID {id} not found for update." });
                }
                return Conflict(new { message = "Failed to update item. Name may be duplicate, Category/BaseUnit invalid/disabled, or concurrency issue." });
            }
            return NoContent();
        }

        // DELETE: api/Items/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var success = await _itemService.SoftDeleteItemAsync(id);
            if (!success)
            {
                if (!await _itemService.ItemExistsAsync(id))
                {
                    return NotFound(new { message = $"Item with ID {id} not found." });
                }
                return BadRequest(new { message = $"Could not disable item with ID {id}." }); // Or a more specific error
            }
            return NoContent();
        }
    }
}