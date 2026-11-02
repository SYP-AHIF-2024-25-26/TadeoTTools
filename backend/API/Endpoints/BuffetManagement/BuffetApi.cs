using static API.Endpoints.BuffetManagement.BuffetEndpoints;

namespace API.Endpoints.BuffetManagement;

public static class BuffetApi
{
    public static void MapBuffetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        // Cashier kiosk
        group.MapGet("buffets", GetCashierBuffets)
            .WithName(nameof(GetCashierBuffets))
            .WithDescription("Get the buffets with a menu, with their products in counter order (prices in cents)")
            .Produces<List<CashierBuffetDto>>()
            .RequireAuthorization(Setup.CashierPolicyName);

        group.MapPost("orders", CreateOrder)
            .AddEndpointFilter(BuffetValidations.CreateOrderValidationAsync)
            .WithName(nameof(CreateOrder))
            .WithDescription("Store a sale; a sale with an order number already stored is accepted without storing it again")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.CashierPolicyName);

        // Products
        group.MapGet("api/products", GetProducts)
            .WithName(nameof(GetProducts))
            .WithDescription("Get all buffet products with how many menus they are on and how many were sold")
            .Produces<List<ProductDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/products", CreateProduct)
            .AddEndpointFilter(BuffetValidations.SaveProductValidationAsync)
            .WithName(nameof(CreateProduct))
            .Produces<ProductDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/products/{productId:int}", UpdateProduct)
            .AddEndpointFilter(BuffetValidations.DoesProductExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.SaveProductValidationAsync)
            .WithName(nameof(UpdateProduct))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/products/{productId:int}", DeleteProduct)
            .AddEndpointFilter(BuffetValidations.DoesProductExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.DeleteProductValidationAsync)
            .WithName(nameof(DeleteProduct))
            .WithDescription("Delete a product that is on no menu and has no sales")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        // Buffets
        group.MapGet("api/buffets", GetBuffets)
            .WithName(nameof(GetBuffets))
            .WithDescription("Get all buffets with their menu, cash movements and number of sales")
            .Produces<List<BuffetDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/buffets", CreateBuffet)
            .AddEndpointFilter(BuffetValidations.SaveBuffetValidationAsync)
            .WithName(nameof(CreateBuffet))
            .Produces<BuffetDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/buffets/{buffetId:int}", UpdateBuffet)
            .AddEndpointFilter(BuffetValidations.DoesBuffetExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.SaveBuffetValidationAsync)
            .WithName(nameof(UpdateBuffet))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/buffets/{buffetId:int}", DeleteBuffet)
            .AddEndpointFilter(BuffetValidations.DoesBuffetExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.DeleteBuffetValidationAsync)
            .WithName(nameof(DeleteBuffet))
            .WithDescription("Delete a buffet without sales and cash movements")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/buffets/{buffetId:int}/menu", UpdateMenu)
            .AddEndpointFilter(BuffetValidations.DoesBuffetExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.UpdateMenuValidationAsync)
            .WithName(nameof(UpdateMenu))
            .WithDescription("Replace a buffet's menu with the given product ids, in counter order")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/buffets/{buffetId:int}/cash-movements", AddCashMovement)
            .AddEndpointFilter(BuffetValidations.DoesBuffetExistValidationAsync)
            .AddEndpointFilter(BuffetValidations.AddCashMovementValidationAsync)
            .WithName(nameof(AddCashMovement))
            .WithDescription("Record cash put into (positive) or taken out of (negative) a buffet's till")
            .Produces<CashMovementDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/cash-movements/{cashMovementId:int}", DeleteCashMovement)
            .AddEndpointFilter(BuffetValidations.DoesCashMovementExistValidationAsync)
            .WithName(nameof(DeleteCashMovement))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        // Sales
        group.MapGet("api/sales", GetSales)
            .WithName(nameof(GetSales))
            .WithDescription("Get the revenue per buffet and product, from the prices the items were sold at")
            .Produces<SalesDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/sales/statistics", GetSalesStatistics)
            .WithName(nameof(GetSalesStatistics))
            .WithDescription("Get key figures, sales per hour in Vienna time and the products by quantity sold")
            .Produces<SalesStatisticsDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/sales/csv", GetSalesCsv)
            .WithName(nameof(GetSalesCsv))
            .WithDescription("Get all sold items in a csv file")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/sales", DeleteSales)
            .WithName(nameof(DeleteSales))
            .WithDescription("Delete all sales, keeping products, buffets and cash movements")
            .Produces(StatusCodes.Status204NoContent)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
