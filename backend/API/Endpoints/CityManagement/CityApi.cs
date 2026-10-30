using static API.Endpoints.CityManagement.CityEndpoints;

namespace API.Endpoints.CityManagement;

public static class CityApi
{
    public static void MapCityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        // Registration kiosk
        group.MapGet("cities", GetKioskCities)
            .WithName(nameof(GetKioskCities))
            .WithDescription("Get all towns with their postcode, sorted by name")
            .Produces<List<KioskCityDto>>();

        // Districts
        group.MapGet("api/districts", GetDistricts)
            .WithName(nameof(GetDistricts))
            .WithDescription("Get all districts with their number of towns")
            .Produces<List<DistrictDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/districts", CreateDistrict)
            .AddEndpointFilter(CityValidations.SaveDistrictValidationAsync)
            .WithName(nameof(CreateDistrict))
            .Produces<DistrictDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/districts/{districtId:int}", UpdateDistrict)
            .AddEndpointFilter(CityValidations.DoesDistrictExistValidationAsync)
            .AddEndpointFilter(CityValidations.SaveDistrictValidationAsync)
            .WithName(nameof(UpdateDistrict))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/districts/{districtId:int}", DeleteDistrict)
            .AddEndpointFilter(CityValidations.DoesDistrictExistValidationAsync)
            .AddEndpointFilter(CityValidations.DeleteDistrictValidationAsync)
            .WithName(nameof(DeleteDistrict))
            .WithDescription("Delete a district without towns")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/districts/csv", GetDistrictsCsv)
            .WithName(nameof(GetDistrictsCsv))
            .WithDescription($"Get all districts as csv ({DistrictCsvHeader})")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/districts/csv", ImportDistrictsCsv)
            .Accepts<string>("text/csv")
            .WithName(nameof(ImportDistrictsCsv))
            .WithDescription($"Fill the empty district list from a csv file ({DistrictCsvHeader}); all or nothing")
            .Produces<Utils.CsvImportResultDto>()
            .Produces<Utils.CsvImportErrorsDto>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        // Cities
        group.MapGet("api/cities", GetCities)
            .WithName(nameof(GetCities))
            .WithDescription("Get all towns with their district and number of registrations")
            .Produces<List<CityDto>>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/cities", CreateCity)
            .AddEndpointFilter(CityValidations.SaveCityValidationAsync)
            .WithName(nameof(CreateCity))
            .Produces<CityDto>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/cities/{cityId:int}", UpdateCity)
            .AddEndpointFilter(CityValidations.DoesCityExistValidationAsync)
            .AddEndpointFilter(CityValidations.SaveCityValidationAsync)
            .WithName(nameof(UpdateCity))
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/cities/{cityId:int}", DeleteCity)
            .AddEndpointFilter(CityValidations.DoesCityExistValidationAsync)
            .AddEndpointFilter(CityValidations.DeleteCityValidationAsync)
            .WithName(nameof(DeleteCity))
            .WithDescription("Delete a town without registrations")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/cities/csv", GetCitiesCsv)
            .WithName(nameof(GetCitiesCsv))
            .WithDescription($"Get all towns as csv ({CityCsvHeader})")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/cities/csv", ImportCitiesCsv)
            .Accepts<string>("text/csv")
            .WithName(nameof(ImportCitiesCsv))
            .WithDescription($"Fill the empty town list from a csv file ({CityCsvHeader}); given ids are kept; all or nothing")
            .Produces<Utils.CsvImportResultDto>()
            .Produces<Utils.CsvImportErrorsDto>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
