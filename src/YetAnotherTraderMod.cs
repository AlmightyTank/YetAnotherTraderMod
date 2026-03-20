using System.Reflection;
using CommonCore.Traders;
using CommonCore.Traders.Service;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Mod;
using Range = SemanticVersioning.Range;

namespace YetAnotherTraderMod.src;

public record ModMetadata : AbstractModMetadata
{
    public override string ModGuid { get; init; } = "com.amightytank.yatm";
    public override string Name { get; init; } = "YetAnotherTraderMod";
    public override string Author { get; init; } = "AmightyTank";
    public override List<string>? Contributors { get; init; } = [];
    public override SemanticVersioning.Version Version { get; init; } = new("1.1.0");
    public override SemanticVersioning.Range SptVersion { get; init; } = new("~4.0.11");
    public override List<string>? Incompatibilities { get; init; } = [];
    public override Dictionary<string, Range>? ModDependencies { get; init; } = new()
    {
        { "com.amightytank.commoncore", new Range("~1.0.0") }
    };
    public override string? Url { get; init; } = null;
    public override bool? IsBundleMod { get; init; } = true;
    public override string License { get; init; } = "MIT";
}

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 45)]
public sealed class YetAnotherTraderModMod(
    TraderBootstrapService traderBootstrapService) : IOnLoad
{
    public Task OnLoad()
    {
        traderBootstrapService.LoadTrader(
            Assembly.GetExecutingAssembly(),
            new YatmTraderDefinition());

        return Task.CompletedTask;
    }
}