using CommonCore.Traders;
using CommonCore.Traders.Models;

namespace YetAnotherTraderMod.src;

public sealed class YatmTraderDefinition : ITraderDefinition
{
    public string TraderId => "698f904cd0fa772942d237c7";
    public string BaseFilePath => "db/base.json";
    public string AssortFilePath => "db/assort.json";
    public string AvatarFilePath => "db/trader.png";
    public string ConfigFilePath => "config/settings.json";
    public string DefaultLocaleName => "YATM";
    public string DefaultLocaleDescription => string.Empty;

    public void Configure(TraderLoadContext context)
    {
        // Trader-specific custom behavior only.
    }
}