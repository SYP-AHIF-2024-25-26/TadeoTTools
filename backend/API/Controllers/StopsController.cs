using Microsoft.AspNetCore.Mvc;
using TadeoT.Database;
using TadeoT.Database.Functions;

namespace API.Controllers;

[ApiController]
[Route("v1/stops")]
public class StopsController : ControllerBase {
    [HttpGet("{stopId}")]
    public IActionResult GetStopById(int stopId) {
        try {
            return Ok(StopFunctions.GetInstance().GetStopById(stopId));
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(404, "Could not find Stop");
        }
    }

    [HttpPost("api")]
    public IActionResult CreateStop([FromBody] StopDto stop) {
        try {
            try {
                StopGroupFunctions.GetInstance().GetStopGroupById(stop.StopGroupID);
            }
            catch (TadeoTDatabaseException) {
                return StatusCode(404, "Could not find StopGroup");
            }

            int stopId = StopFunctions.GetInstance().AddStop(new Stop() {
                Name = stop.Name,
                Description = stop.Description,
                RoomNr = stop.RoomNr,
                StopGroup = StopGroupFunctions.GetInstance().GetStopGroupById(stop.StopGroupID),
            });
            return Ok(StopFunctions.GetInstance().GetStopById(stopId));
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(500, "Could not add Stop");
        }
    }

    [HttpPut("{stopId}")]
    public IActionResult UpdateStop(int stopId, [FromBody] Stop stop) {
        try {
            StopFunctions.GetInstance().UpdateStop(stop);
            return Ok();
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(500, "Could not update Stop");
        }
    }

    [HttpDelete("{stopId}")]
    public IActionResult DeleteStop(int stopId) {
        Stop? stopToUpdate = null;
        try {
            stopToUpdate = StopFunctions.GetInstance().GetStopById(stopId);
            StopFunctions.GetInstance().DeleteStopById(stopId);
            return Ok();
        }
        catch (TadeoTDatabaseException) {
            if (stopToUpdate == null) {
                return StatusCode(404, "Stop not found");
            }

            return StatusCode(500, "Could not delete Stop");
        }
    }

    [HttpGet("groups/{groupId}")]
    public IActionResult GetStopsByGroupId(int groupId) {
        StopGroup? stopGroup = null;
        try {
            stopGroup = StopGroupFunctions.GetInstance().GetStopGroupById(groupId);
            List<Stop> stops = StopGroupFunctions.GetInstance().GetStopsOfStopGroup(groupId);
            return Ok(stops);
        }
        catch (TadeoTDatabaseException) {
            if (stopGroup == null) {
                return StatusCode(404, "Stopgroup not found");
            }
            return StatusCode(500, "Cannot get Stops");
        }
    }
}