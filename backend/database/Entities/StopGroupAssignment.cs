using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Database.Entities
{
    public class StopGroupAssignment
    {
        [Key]
        public int Id { get; set; }
        public int StopId { get; set; }
        public Stop? Stop { get; set; }
        public int StopGroupId { get; set; }
        public StopGroup? StopGroup { get; set; }
        public int Order { get; set; }
    }
}
