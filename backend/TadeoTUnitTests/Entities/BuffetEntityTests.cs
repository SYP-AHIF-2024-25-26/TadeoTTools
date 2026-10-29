using Database.Entities;
using NUnit.Framework;

namespace TadeoTUnitTests.Entities;

[TestFixture]
public class BuffetEntityTests
{
    [Test]
    public void Buffet_ShouldBeInvalid_WhenLocationIsLongerThanThreeCharacters()
    {
        var buffet = new Buffet { Location = "AULA" };

        var results = ValidationHelper.ValidateModel(buffet);
        ValidationHelper.AssertPropertyError(results, nameof(Buffet.Location));
    }

    [Test]
    public void Buffet_ShouldBeInvalid_WhenLocationIsEmpty()
    {
        var buffet = new Buffet { Location = "" };

        var results = ValidationHelper.ValidateModel(buffet);
        ValidationHelper.AssertPropertyError(results, nameof(Buffet.Location));
    }

    [Test]
    public void Buffet_ShouldBeInvalid_WhenDescriptionIsTooLong()
    {
        var buffet = new Buffet { Location = "OG", Description = new string('a', 101) };

        var results = ValidationHelper.ValidateModel(buffet);
        ValidationHelper.AssertPropertyError(results, nameof(Buffet.Description));
    }

    [Test]
    public void Buffet_ShouldBeValid_WhenPropertiesAreWithinLimits()
    {
        var buffet = new Buffet { Location = "OG", Description = new string('a', 100) };

        var results = ValidationHelper.ValidateModel(buffet);
        Assert.That(results, Is.Empty);
        Assert.That(buffet.Menu, Is.Empty);
    }

    [Test]
    public void Product_ShouldBeInvalid_WhenNameIsTooLong()
    {
        var product = new Product { Name = new string('a', 41) };

        var results = ValidationHelper.ValidateModel(product);
        ValidationHelper.AssertPropertyError(results, nameof(Product.Name));
    }

    [Test]
    public void Product_ShouldBeInvalid_WhenUnitIsTooLong()
    {
        var product = new Product { Name = "Kaffee", Unit = new string('a', 21) };

        var results = ValidationHelper.ValidateModel(product);
        ValidationHelper.AssertPropertyError(results, nameof(Product.Unit));
    }

    [Test]
    public void Product_ShouldBeValid_WithNegativePrice()
    {
        // A negative price is a voucher.
        var product = new Product { Name = "Gutschein", Unit = "Stück", PriceCents = -200 };

        var results = ValidationHelper.ValidateModel(product);
        Assert.That(results, Is.Empty);
    }

    [Test]
    public void Order_ShouldBeInvalid_WhenOrderNumberIsTooLong()
    {
        var order = new Order { OrderNumber = new string('a', 51) };

        var results = ValidationHelper.ValidateModel(order);
        ValidationHelper.AssertPropertyError(results, nameof(Order.OrderNumber));
    }

    [Test]
    public void OrderItem_ShouldBeInvalid_WhenQuantityIsZero()
    {
        var item = new OrderItem { Quantity = 0, UnitPriceCents = 150 };

        var results = ValidationHelper.ValidateModel(item);
        ValidationHelper.AssertPropertyError(results, nameof(OrderItem.Quantity));
    }

    [Test]
    public void OrderItem_ShouldBeValid_WithPositiveQuantity()
    {
        var item = new OrderItem { Quantity = 3, UnitPriceCents = -200 };

        var results = ValidationHelper.ValidateModel(item);
        Assert.That(results, Is.Empty);
    }
}
