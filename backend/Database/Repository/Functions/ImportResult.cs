namespace Database.Repository.Functions;

/// <summary>Outcome of a CSV import, shown to the admin after uploading.</summary>
/// <param name="Added">Rows that created a new record.</param>
/// <param name="Skipped">Rows ignored because the record already existed.</param>
public record ImportResult(int Added, int Skipped);
