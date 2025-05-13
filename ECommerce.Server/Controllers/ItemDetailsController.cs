// File: Controllers/ItemDetailsController.cs
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
    public class ItemDetailsController : ControllerBase
    {
        private readonly IItemDetailService _itemDetailService;

        public ItemDetailsController(IItemDetailService itemDetailService)
        {
            _itemDetailService = itemDetailService;
        }

        // GET: api/ItemDetails
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemDetailReadDto>>> GetAllItemDetails([FromQuery] bool includeDisabled = false)
        {
            var details = await _itemDetailService.GetAllItemDetailsAsync(includeDisabled);
            return Ok(details);
        }

        // GET: api/Items/{itemId}/details
        [HttpGet("/api/Items/{itemId}/details")] // Example of a nested-like route
        public async Task<ActionResult<IEnumerable<ItemDetailReadDto>>> GetItemDetailsForItem(int itemId, [FromQuery] bool includeDisabled = false)
        {
            // You might want to check if the item itself exists first via IItemService if desired
            var details = await _itemDetailService.GetItemDetailsByItemIdAsync(itemId, includeDisabled);
            if (!details.Any() && !(await HttpContext.RequestServices.GetRequiredService<IItemService>().ItemExistsAsync(itemId)))
            {
                return NotFound(new { message = $"Item with ID {itemId} not found, so no details available." });
            }
            return Ok(details);
        }


        // GET: api/ItemDetails/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ItemDetailReadDto>> GetItemDetail(int id)
        {
            var detailDto = await _itemDetailService.GetItemDetailByIdAsync(id);
            if (detailDto == null)
            {
                return NotFound(new { message = $"ItemDetail with ID {id} not found." });
            }
            return Ok(detailDto);
        }

        // POST: api/ItemDetails
        [HttpPost]
        public async Task<ActionResult<ItemDetailReadDto>> PostItemDetail(ItemDetailWriteDto itemDetailDto)
        {
            var createdDto = await _itemDetailService.CreateItemDetailAsync(itemDetailDto);
            if (createdDto == null)
            {
                return Conflict(new { message = "Failed to create item detail. Duplicate code, duplicate item-unit combination, invalid ItemID/UnitID, or conversion factor for base unit is not 1." });
            }
            return CreatedAtAction(nameof(GetItemDetail), new { id = createdDto.ID }, createdDto);
        }

        // PUT: api/ItemDetails/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutItemDetail(int id, ItemDetailUpdateDto itemDetailDto)
        {
            var success = await _itemDetailService.UpdateItemDetailAsync(id, itemDetailDto);
            if (!success)
            {
                if (!await _itemDetailService.ItemDetailExistsAsync(id))
                {
                    return NotFound(new { message = $"ItemDetail with ID {id} not found for update." });
                }
                return Conflict(new { message = "Failed to update item detail. Duplicate code, duplicate item-unit combination, invalid ItemID/UnitID, conversion factor for base unit is not 1, or concurrency issue." });
            }
            return NoContent();
        }

        // DELETE: api/ItemDetails/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItemDetail(int id)
        {
            var success = await _itemDetailService.SoftDeleteItemDetailAsync(id);
            if (!success)
            {
                if (!await _itemDetailService.ItemDetailExistsAsync(id))
                {
                    return NotFound(new { message = $"ItemDetail with ID {id} not found." });
                }
                return BadRequest(new { message = $"Could not disable ItemDetail with ID {id}. It might be the base unit configuration for its item or another issue occurred." });
            }
            return NoContent();
        }
    }
}