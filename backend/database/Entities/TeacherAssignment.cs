﻿using System.ComponentModel.DataAnnotations;

namespace Database.Entities;

public class TeacherAssignment
{
    [Key]
    public int Id { get; set; }
    public string TeacherId { get; set; }
    public Teacher? Teacher { get; set; }
    public int StopId { get; set; }
    public Stop? Stop { get; set; }
}
