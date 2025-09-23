using LeoAuth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace API;

internal static class Setup
{
    public const string CorsPolicyName = "AllowOrigins";
    public const string AdminPolicyName = "IsAdmin";
    public const string TeacherOrAdminPolicyName = "IsTeacherOrAdmin";
    
    public static void AddLeoAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    options.MetadataAddress
                        = "https://auth.htl-leonding.ac.at/realms/htlleonding/.well-known/openid-configuration";
                    options.Authority = "https://auth.htl-leonding.ac.at/realms/htlleonding";
                    options.Audience = "htlleonding-service";
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        ValidateIssuer = true,
                        // currently the audience is not set by KeyCloak for access_token - turn off if not using id_token (which you should do only for testing purposes)
                        ValidateAudience = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromMinutes(1)
                    };
                    options.RequireHttpsMetadata = false;
                });
    }

    public static void AddSwaggerWithAuth(this IServiceCollection services)
    {
        const string Version = "v1";

        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc(Version, new OpenApiInfo
            {
                Title = "DemoAuth Backend",
                Version = Version
            });
            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme"
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    []
                }
            });
        });
    }

    public static void AddBasicAuthorization(this IServiceCollection services)
    {
        services.AddAuthorizationBuilder()
            .AddPolicy(nameof(LeoUserRole.Student), policy => policy.Requirements
                                              .Add(new LeoAuthRequirement(LeoUserRole.Student, true)))
            .AddPolicy(nameof(LeoUserRole.Teacher), policy => policy.Requirements
                                              .Add(new LeoAuthRequirement(LeoUserRole.Teacher, true)))
            .AddPolicy(AdminPolicyName, policy => policy.Requirements
                                              .Add(new AdminRequirement()))
            .AddPolicy(TeacherOrAdminPolicyName, policy => policy.Requirements
                                              .Add(new TeacherOrAdminRequirement()));
        services.AddScoped<IAuthorizationHandler, TeacherOrAdminHandler>();
        services.AddScoped<IAuthorizationHandler, AdminAuthorizationHandler>();
        services.AddSingleton<IAuthorizationHandler, LeoAuthorizationHandler>();
    }
}
