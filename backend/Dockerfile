FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ./database/database.csproj ./database/
COPY ./API/API.csproj ./API/
RUN dotnet restore ./API/API.csproj

# Copy everything else and build
COPY . .
RUN dotnet publish ./API/API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]