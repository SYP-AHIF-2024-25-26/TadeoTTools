FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ./Database/Database.csproj ./Database/
COPY ./API/API.csproj ./API/
RUN dotnet restore ./API/API.csproj

# Copy only the projects needed for the API (exclude AppHost, Tests, etc.)
COPY ./Database/ ./Database/
COPY ./API/ ./API/

RUN dotnet publish ./API/API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5005
EXPOSE 5005
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "API.dll"]