using System.Text.Json.Serialization;

namespace Database.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FeedbackQuestionType
{
    Text,
    Rating,
    SingleChoice,
    MultipleChoice
}
