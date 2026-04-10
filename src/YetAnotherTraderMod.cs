using CommonLibExtended.Services;
using CommonLibExtended.Traders.Models;
using CommonLibExtended.Traders.Services;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Helpers;
using SPTarkov.Server.Core.Models.Eft.Common.Tables;
using SPTarkov.Server.Core.Models.Spt.Config;
using SPTarkov.Server.Core.Models.Spt.Mod;
using SPTarkov.Server.Core.Routers;
using SPTarkov.Server.Core.Servers;
using SPTarkov.Server.Core.Utils;
using System.Reflection;
using Path = System.IO.Path;
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
        { "com.amightytank.commonlibextended", new Range("~1.0.0") }
    };
    public override string? Url { get; init; } = null;
    public override bool? IsBundleMod { get; init; } = false;
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