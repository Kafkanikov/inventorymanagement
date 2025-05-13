using System.ComponentModel.DataAnnotations;
using ECommerce.Server.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Data.DTO.Request
{
    public class LoginRequest
    {
        [Required] public string Username { get; set; } = string.Empty;
        [Required] public string Password { get; set; } = string.Empty;
    }
}