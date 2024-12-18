namespace API.RequestDto;

public class RequestStopDto
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string RoomNr { get; set; }
    public int? StopGroupID { get; set; }
    public int DivisionID { get; set; }
}