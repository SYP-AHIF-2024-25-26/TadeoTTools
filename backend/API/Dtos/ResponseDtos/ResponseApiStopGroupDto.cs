namespace API.Dtos.ResponseDtos;

public class ResponseApiStopGroupDto
{
    public int StopGroupID { get; set; }
    public required String Name { get; set; }
    public required string Description { get; set; }
    public required bool IsPublic { get; set; }

    
}