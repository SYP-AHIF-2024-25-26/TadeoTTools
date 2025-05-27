FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ./Database/Database.csproj ./database/
COPY ./API/API.csproj ./API/
RUN dotnet restore ./API/API.csproj

# Copy everything else and build
COPY . .
RUN dotnet publish ./API/API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:5005
EXPOSE 5005
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]