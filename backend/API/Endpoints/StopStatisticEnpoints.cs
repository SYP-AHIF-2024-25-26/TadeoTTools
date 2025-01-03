namespace API.Endpoints;

public class StopStatisticEndpoints {
    /*
    [HttpGet]
    [Route("api")]
    public IActionResult GetAllStopStatistics() {
        try {
            return Ok(StopStatisticFunctions.GetInstance().GetAllStopStatistics());
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(500, "Internal server error");
        }
    }


    [HttpPost]
    [Route("{stopId}")]
    public IActionResult CreateStopStats(int stopId) {
        try {
            StopStatisticFunctions.GetInstance().AddStopStatistic(new StopStatistic() {
                IsDone = true,
                StopID = stopId,
                Stop = StopFunctions.GetInstance().GetStopById(stopId),
                Time = DateTime.Now,
            });
            return Ok();
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(404, "Stop not found");
        }
    }

    [HttpPut("{stopStatisticsId}")]
    public IActionResult UpdateStopStats(int stopStatisticsId, [FromQuery] bool isDone) {
        try {
            StopStatistic stats = StopStatisticFunctions.GetInstance().GetStopStatisticById(stopStatisticsId);
            stats.Time = DateTime.Now;
            stats.IsDone = isDone;
            StopStatisticFunctions.GetInstance().UpdateStopStatistic(stats);
            return Ok();
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(404, "StopStatistic not found");
        }
    }

    [HttpDelete("{stopId}")]
    public IActionResult DeleteStopStats(int stopId) {
        try {
            StopStatisticFunctions.GetInstance().DeleteStopStopStatisticById(stopId);
            return Ok();
        }
        catch (TadeoTDatabaseException) {
            return StatusCode(404, "StopStatistic not found");
        }
    }*/
}