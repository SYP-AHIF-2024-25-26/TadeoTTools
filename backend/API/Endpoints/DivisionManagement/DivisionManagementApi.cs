using Database.Entities;
using Database.Repository.Functions;

namespace API.Endpoints.DivisionManagement;

public static class DivisionManagementApi
{
    public static void MapDivisionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");
        group.MapGet("divisions", DivisionManagementEndpoints.GetDivisions)
            .WithName(nameof(DivisionManagementEndpoints.GetDivisions))
            .WithDescription("Get all divisions without images")
            .Produces<List<DivisionFunctions.DivisionWithoutImageDto>>();
        
        group.MapPost("api/divisions", DivisionManagementEndpoints.CreateDivision)
            .AddEndpointFilter(DivisionManagementValidations.CreateDivisionValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.CreateDivision))
            .Produces(StatusCodes.Status400BadRequest)
            .Produces<Division>()
            .RequireAuthorization(Setup.AdminPolicyName)
            .DisableAntiforgery();

        group.MapDelete("api/divisions/{divisionId}", DivisionManagementEndpoints.DeleteDivisionById)
            .AddEndpointFilter(DivisionManagementValidations.DoesDivisionExistValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.DeleteDivisionById))
            .WithDescription("Delete a Division by its id")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/divisions", DivisionManagementEndpoints.UpdateDivision)
            .AddEndpointFilter(DivisionManagementValidations.UpdateDivisionValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.UpdateDivision))
            .WithDescription("Update a division entity")
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/divisions/image", DivisionManagementEndpoints.UpdateDivisionImage)
            .AddEndpointFilter(DivisionManagementValidations.UpdateDivisionImageValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.UpdateDivisionImage))
            .WithDescription("Update the image of a division")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .DisableAntiforgery()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("divisions/{divisionId}/image", DivisionManagementEndpoints.GetImageByDivisionId)
            .AddEndpointFilter(DivisionManagementValidations.DoesDivisionExistValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.GetImageByDivisionId))
            .WithDescription("Get Image by its division id")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .Produces<byte[]>(StatusCodes.Status206PartialContent)
            .DisableAntiforgery();

        group.MapDelete("api/divisions/{divisionId}/image", DivisionManagementEndpoints.DeleteImage)
            .AddEndpointFilter(DivisionManagementValidations.DoesDivisionExistValidationAsync)
            .WithName(nameof(DivisionManagementEndpoints.DeleteImage))
            .WithDescription("Delete an Image of an division")
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);
        
        group.MapGet("api/divisions/csv", DivisionManagementEndpoints.GetDivisionsCsv)
            .WithName(nameof(DivisionManagementEndpoints.GetDivisionsCsv))
            .WithDescription("Get all divisions in a csv file")
            .Produces(StatusCodes.Status206PartialContent)
            .Produces(StatusCodes.Status416RangeNotSatisfiable)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}