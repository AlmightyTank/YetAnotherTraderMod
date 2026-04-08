using CommonLibExtended.Services;
using CommonLibExtended.Traders.Models;
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
public sealed class YetAnotherTraderModMod(
    ModHelper modHelper,
    ImageRouter imageRouter,
    ConfigServer configServer,
    CLETraderBootstrap traderBootstrap)
    : IOnLoad
{
    private readonly TraderConfig _traderConfig = configServer.GetConfig<TraderConfig>();
    private readonly RagfairConfig _ragfairConfig = configServer.GetConfig<RagfairConfig>();

    public Task OnLoad()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var modRoot = modHelper.GetAbsolutePathToModFolder(assembly);

        traderBootstrap.LoadTrader(
            assembly,
            Path.Join("db", "base.json"),
            Path.Join("db", "assort.json"),
            Path.Join("config", "settings.json"),
            _traderConfig,
            _ragfairConfig,
            path => modHelper.GetJsonDataFromFile<TraderBase>(modRoot, Path.GetRelativePath(modRoot, path)),
            path => modHelper.GetJsonDataFromFile<TraderAssort>(modRoot, Path.GetRelativePath(modRoot, path)),
            path => modHelper.GetJsonDataFromFile<CustomTraderSettings>(modRoot, Path.GetRelativePath(modRoot, path)),
            firstName: "Priscilu",
            description: "",
            imageRouter: imageRouter,
            traderImageRelativePath: Path.Join("db", "trader.png"));

        return Task.CompletedTask;
    }
}