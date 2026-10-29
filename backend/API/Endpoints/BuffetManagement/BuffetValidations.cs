using Database.Repository;
using Microsoft.EntityFrameworkCore;

namespace API.Endpoints.BuffetManagement;

public static class BuffetValidations
{
    /// <summary>Most of one product in one sale, as at the kiosk.</summary>
    private const int MaxAmount = 99;

    /// <summary>
    /// A sale already stored is answered with 200, so the kiosk's outbox can retry safely.
    /// 404 for an unknown buffet and 400 for an invalid sale: the kiosk keeps those as
    /// "nicht übertragbar".
    /// </summary>
    public static async ValueTask<object?> CreateOrderValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var dto = context.GetArgument<BuffetEndpoints.CreateOrderDto>(1);

        var orderNumber = dto.OrderNumber.Trim();
        if (await dbContext.Orders.AnyAsync(o => o.OrderNumber == orderNumber))
        {
            return Results.Ok();
        }

        if (!await dbContext.Buffets.AnyAsync(b => b.Id == dto.BuffetId))
        {
            return Results.NotFound($"Buffet {dto.BuffetId} does not exist.");
        }

        if (string.IsNullOrWhiteSpace(orderNumber))
        {
            return Results.BadRequest("The order number is missing.");
        }

        if (dto.SoldUnits.Count == 0)
        {
            return Results.BadRequest("The sale has no products.");
        }

        if (dto.SoldUnits.Any(u => u.Amount is < 1 or > MaxAmount))
        {
            return Results.BadRequest($"Each amount must be between 1 and {MaxAmount}.");
        }

        if (dto.SoldUnits.Select(u => u.ProductId).Distinct().Count() != dto.SoldUnits.Count)
        {
            return Results.BadRequest("A product appears twice in the sale.");
        }

        var menu = await dbContext.BuffetProducts
            .Where(m => m.BuffetId == dto.BuffetId)
            .Select(m => new { m.ProductId, m.Product!.PriceCents })
            .ToDictionaryAsync(m => m.ProductId, m => m.PriceCents);

        if (dto.SoldUnits.Any(u => !menu.ContainsKey(u.ProductId)))
        {
            return Results.BadRequest("A product is not on this buffet's menu.");
        }

        if (dto.SoldUnits.Where(u => menu[u.ProductId] < 0).Sum(u => u.Amount) > 1)
        {
            return Results.BadRequest("Only one voucher per sale.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> SaveProductValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dto = context.Arguments.OfType<BuffetEndpoints.SaveProductDto>().First();

        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return Results.BadRequest("The name is required.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesProductExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var productId = context.GetArgument<int>(1);

        if (!await dbContext.Products.AnyAsync(p => p.Id == productId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteProductValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var productId = context.GetArgument<int>(1);

        if (await dbContext.BuffetProducts.AnyAsync(m => m.ProductId == productId))
        {
            return Results.Conflict("The product is on a buffet's menu. Remove it from the menu first.");
        }

        if (await dbContext.OrderItems.AnyAsync(i => i.ProductId == productId))
        {
            return Results.Conflict("The product has sales. It can be deleted after all sales are deleted.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> SaveBuffetValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dto = context.Arguments.OfType<BuffetEndpoints.SaveBuffetDto>().First();

        if (string.IsNullOrWhiteSpace(dto.Location))
        {
            return Results.BadRequest("The location is required.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesBuffetExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var buffetId = context.GetArgument<int>(1);

        if (!await dbContext.Buffets.AnyAsync(b => b.Id == buffetId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }

    public static async ValueTask<object?> DeleteBuffetValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var buffetId = context.GetArgument<int>(1);

        if (await dbContext.Orders.AnyAsync(o => o.BuffetId == buffetId)
            || await dbContext.CashMovements.AnyAsync(c => c.BuffetId == buffetId))
        {
            return Results.Conflict(
                "The buffet has sales or cash movements. Empty its menu instead to hide it from the cashier.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> UpdateMenuValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var productIds = context.GetArgument<int[]>(2);

        if (productIds.Distinct().Count() != productIds.Length)
        {
            return Results.BadRequest("A product appears twice on the menu.");
        }

        var known = await dbContext.Products.CountAsync(p => productIds.Contains(p.Id));
        if (known != productIds.Length)
        {
            return Results.BadRequest("The menu contains a product that does not exist.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> AddCashMovementValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dto = context.GetArgument<BuffetEndpoints.AddCashMovementDto>(2);

        if (dto.AmountCents == 0)
        {
            return Results.BadRequest("The amount must not be 0.");
        }

        return await next(context);
    }

    public static async ValueTask<object?> DoesCashMovementExistValidationAsync(EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var dbContext = context.GetArgument<TadeoTDbContext>(0);
        var cashMovementId = context.GetArgument<int>(1);

        if (!await dbContext.CashMovements.AnyAsync(c => c.Id == cashMovementId))
        {
            return Results.NotFound();
        }

        return await next(context);
    }
}
