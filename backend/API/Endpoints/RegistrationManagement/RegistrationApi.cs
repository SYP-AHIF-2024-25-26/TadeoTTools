using static API.Endpoints.RegistrationManagement.RegistrationEndpoints;

namespace API.Endpoints.RegistrationManagement;

public static class RegistrationApi
{
    public static void MapRegistrationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("v1");

        // Registration kiosk; only saving needs the login, the lists and the count load before it
        group.MapGet("registration-options", GetRegistrationOptions)
            .WithName(nameof(GetRegistrationOptions))
            .WithDescription("Get the reasons for a visit and the school types, each in kiosk order")
            .Produces<RegistrationOptionsDto>();

        group.MapGet("visitors/count", GetVisitorCount)
            .WithName(nameof(GetVisitorCount))
            .WithDescription("Get the number of registrations and of the adults who came with them")
            .Produces<VisitorCountDto>();

        group.MapPost("visitors", AddVisitor)
            .AddEndpointFilter(RegistrationValidations.AddVisitorValidationAsync)
            .WithName(nameof(AddVisitor))
            .WithDescription("Register a visitor, optionally with a photo (PNG data URL); returns the new id. " +
                             "Stores who is logged in at the kiosk")
            .Produces<int>()
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status500InternalServerError)
            .RequireAuthorization(Setup.RegistrarPolicyName);

        // Statistics kiosk
        group.MapGet("visitor-statistics", GetVisitorStatistics)
            .WithName(nameof(GetVisitorStatistics))
            .WithDescription("Get everything the statistics slideshow shows; hours in Vienna time")
            .Produces<VisitorStatisticsDto>();

        // PhotoDownloader; the files themselves are static files under the same path
        group.MapGet("visitor-photos", GetVisitorPhotos)
            .WithName(nameof(GetVisitorPhotos))
            .WithDescription("Get the file names of all visitor photos, each served at /v1/visitor-photos/{name}")
            .Produces<List<string>>();

        // Registration options (admin); kind is reasons-for-visit or school-types
        group.MapGet("api/registration-options", GetRegistrationOptions)
            .WithName("GetAdminRegistrationOptions")
            .Produces<RegistrationOptionsDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPut("api/registration-options/{kind}", UpdateRegistrationOptions)
            .AddEndpointFilter(RegistrationValidations.DoesOptionKindExistValidationAsync)
            .AddEndpointFilter(RegistrationValidations.UpdateOptionsValidationAsync)
            .WithName(nameof(UpdateRegistrationOptions))
            .WithDescription("Replace one list with the given names, in kiosk order; past registrations keep their text")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/registration-options/{kind}/csv", GetRegistrationOptionsCsv)
            .AddEndpointFilter(RegistrationValidations.DoesOptionKindExistValidationAsync)
            .WithName(nameof(GetRegistrationOptionsCsv))
            .WithDescription($"Get one list as csv ({OptionCsvHeader})")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapPost("api/registration-options/{kind}/csv", ImportRegistrationOptionsCsv)
            .AddEndpointFilter(RegistrationValidations.DoesOptionKindExistValidationAsync)
            .Accepts<string>("text/csv")
            .WithName(nameof(ImportRegistrationOptionsCsv))
            .WithDescription($"Fill one empty list from a csv file ({OptionCsvHeader}); all or nothing")
            .Produces<Utils.CsvImportResultDto>()
            .Produces<Utils.CsvImportErrorsDto>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .RequireAuthorization(Setup.AdminPolicyName);

        // Registrations and photos (admin)
        group.MapGet("api/visitors/summary", GetVisitorSummary)
            .WithName(nameof(GetVisitorSummary))
            .WithDescription("Get the number of registrations, accompanying adults and photos")
            .Produces<VisitorSummaryDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapGet("api/visitors/csv", GetVisitorsCsv)
            .WithName(nameof(GetVisitorsCsv))
            .WithDescription("Get all registrations in a csv file (Vienna time)")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.AdminPolicyName);

        group.MapDelete("api/visitors", DeleteVisitors)
            .WithName(nameof(DeleteVisitors))
            .WithDescription("Delete all registrations and all photo files; the next registration gets id 1")
            .Produces<DeleteVisitorsResultDto>()
            .RequireAuthorization(Setup.AdminPolicyName);

        // Photo section in the dashboard (Roboterführerschein stop and admins)
        group.MapGet("api/visitor-photos", GetVisitorPhotoIndex)
            .WithName(nameof(GetVisitorPhotoIndex))
            .WithDescription("Get all photos with their registration time, newest first; " +
                             "each file is served at /v1/visitor-photos/{fileName}")
            .Produces<List<VisitorPhotoDto>>()
            .RequireAuthorization(Setup.PhotoViewerPolicyName);

        group.MapGet("api/visitor-photos/zip", GetVisitorPhotosZip)
            .WithName(nameof(GetVisitorPhotosZip))
            .WithDescription("Get all photo files in one zip file")
            .Produces(StatusCodes.Status200OK)
            .RequireAuthorization(Setup.PhotoViewerPolicyName);

        group.MapDelete("api/visitor-photos", DeleteVisitorPhotos)
            .WithName(nameof(DeleteVisitorPhotos))
            .WithDescription("Delete all photo files and keep the registrations")
            .Produces<DeleteVisitorsResultDto>()
            .RequireAuthorization(Setup.AdminPolicyName);
    }
}
