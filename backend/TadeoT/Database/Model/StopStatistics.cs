﻿namespace TadeoT.Database.Model;

public class StopStatistic
{
    public int StopStatisticID { get; set; }
    public required DateTime Time { get; set; }
    public required bool IsDone { get; set; }

    public required int StopID { get; set; }
    public required Stop Stop { get; set; }
}
