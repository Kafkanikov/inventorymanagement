using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class JournalPageCreateDto
    {
        public int? CurrencyID { get; set; } // Optional, if you have a currencies table

        [StringLength(50)]
        public string? Ref { get; set; } // Overall reference for the journal page

        [Required(ErrorMessage = "Source of the journal page is required (e.g., 'Manual Entry', 'Sale', 'Purchase').")]
        [StringLength(50)]
        public string Source { get; set; }

        [StringLength(500)]
        public string? Description { get; set; } // Overall description for the journal page

        [Required(ErrorMessage = "At least one journal entry is required.")]
        [MinLength(1, ErrorMessage = "At least one journal entry is required.")]
        public List<JournalPostCreateDto> JournalEntries { get; set; } = new List<JournalPostCreateDto>();
    }
}