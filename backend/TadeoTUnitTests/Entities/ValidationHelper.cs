using System.ComponentModel.DataAnnotations;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

public static class ValidationHelper
{
    public static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, validationContext, validationResults, true);
        return validationResults;
    }

    public static void AssertPropertyError(IList<ValidationResult> results, string propertyName, string errorMessagePartial = "")
    {
        var result = results.FirstOrDefault(r => r.MemberNames.Contains(propertyName));
        if (result == null)
        {
            Assert.Fail($"Expected validation error for property '{propertyName}', but found none.");
        }

        if (!string.IsNullOrEmpty(errorMessagePartial) && !result!.ErrorMessage!.Contains(errorMessagePartial))
        {
            Assert.Fail($"Expected validation error message to contain '{errorMessagePartial}', but was '{result.ErrorMessage}'.");
        }
    }
}
