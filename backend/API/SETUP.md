# TadeoT API Setup Guide

## Initial Developer Setup

### 1. Configure Local Settings

Before running the application, you need to configure your local admin ID:

1. **Copy the example configuration:**

   ```bash
   cp appsettings.Local.json.example appsettings.Local.json
   ```

2. **Edit `appsettings.Local.json`:**

   ```json
   {
     "SeedData": {
       "InitialAdminId": "your_actual_id_here"
     }
   }
   ```

   Replace `"your_actual_id_here"` with your university/school ID (e.g., `if210029`).

3. **Important:** The `appsettings.Local.json` file is automatically ignored by Git and will NOT be committed to the repository.

### 2. Configuration Priority

The application loads configuration in this order (later sources override earlier ones):

1. `appsettings.json` (base configuration)
2. `appsettings.{Environment}.json` (e.g., Development, Production)
3. `appsettings.Local.json` (your personal settings - **not tracked by Git**)
4. Environment variables
5. User secrets

### 3. Production Deployment

For production deployments, set the admin ID using one of these methods:

**Option A: Environment Variable**

```bash
export SeedData__InitialAdminId="production_admin_id"
```

**Option B: Production Configuration**
Edit `appsettings.Production.json` on the production server (not in Git):

```json
{
  "SeedData": {
    "InitialAdminId": "production_admin_id"
  }
}
```

**Option C: User Secrets** (recommended for production)

```bash
dotnet user-secrets set "SeedData:InitialAdminId" "production_admin_id"
```

### 4. Verification

When the application starts, check the logs:

- **Success:** `Seeding initial admin: {your_id}` or `Admin '{your_id}' already exists`
- **Warning:** `No initial admin ID configured` - you need to create `appsettings.Local.json`

## Security Notes

- ✅ `appsettings.Local.json` is ignored by Git
- ✅ Never commit personal IDs to the repository
- ✅ Each developer maintains their own local configuration
- ✅ Production uses environment-specific configuration or secrets

## Troubleshooting

**Q: Application starts but doesn't seed an admin**

- Check if `appsettings.Local.json` exists and contains your ID
- Verify the JSON syntax is correct
- Check application logs for configuration warnings

**Q: Can I use a different configuration file name?**

- Yes, but make sure to add it to `.gitignore` and update the configuration loading in `Program.cs`
