﻿namespace TadeoT.Database.Model;

public class StopGroup
{
    public int StopGroupID { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required bool IsPublic { get; set; }
}