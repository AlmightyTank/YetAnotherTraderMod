using CommonLibExtended.Services;
using CommonLibExtended.Traders.Models;
using CommonLibExtended.Traders.Services;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Utils;
using System.Reflection;
using Range = SemanticVersioning.Range;
using Version = SemanticVersioning.Version;

namespace YetAnotherTraderMod.src;

public record ModMetadata : AbstractModMetadata
{
    public override string ModGuid { get; init; } = "com.amightytank.yatm";
    public override string Name { get; init; } = "YetAnotherTraderMod";
    public override string Author { get; init; } = "AmightyTank";
    public override List<string>? Contributors { get; init; } = [];
    public override Version Version { get; init; } = new("1.1.0");
    public override Range SptVersion { get; init; } = new("~4.0.11");
    public override List<string>? Incompatibilities { get; init; } = [];
    public override Dictionary<string, Range>? ModDependencies { get; init; } = new()
    {
        { "com.wtt.commonlib", new Range("~2.0.17") },
        { "com.amightytank.commonlibextended", new Range("~1.0.0") }
    };
    public override string? Url { get; init; } = null;
    public override bool? IsBundleMod { get; init; } = true;
    public override string License { get; init; } = "MIT";
}

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 4)]
public sealed class YetAnotherTraderMod(
    CLETraderBootstrap traderBootstrap,
    JsonUtil jsonUtil)
    : IOnLoad
{
    private readonly CLETraderBootstrap _bootstrap = traderBootstrap;
    private readonly JsonUtil _jsonUtil = jsonUtil;

    public Task OnLoad()
    {
        var assembly = Assembly.GetExecutingAssembly();

        _bootstrap.LoadTrader(
            assembly: assembly,
            traderBaseRelativePath: "db/base.json",
            assortRelativePath: "db/assort.json",
            settingsRelativePath: "config/settings.json",
            firstName: "Tony",
            description: "An unseen sponsor of discreet logistics, moving high-value equipment through Tarkov without noise, witnesses, or mistakes.",
            traderImageRelativePath: "db/trader.png");

        return Task.CompletedTask;
    }
}