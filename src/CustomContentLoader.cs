using CommonCore.Core;
using SPTarkov.DI.Annotations;
using SPTarkov.Server.Core.DI;
using SPTarkov.Server.Core.Models.Spt.Mod;
using System.Reflection;
using Range = SemanticVersioning.Range;

namespace YetAnotherTraderMod.src;

[Injectable(TypePriority = OnLoadOrder.PostDBModLoader + 50)]
public sealed class CustomContentLoader(
    CommonCore.Core.CommonCore commonCore) : IOnLoad
{
    public async Task OnLoad()
    {
        try
        {
            YATMLogger.Log("[CustomContentLoader] Starting custom content load...");

            var assembly = Assembly.GetExecutingAssembly();
            var modPath = Path.GetDirectoryName(assembly.Location)
                ?? throw new InvalidOperationException("Could not resolve mod path.");

            var dbPath = Path.Combine(modPath, "db");

            YATMLogger.LogDebug($"[CustomContentLoader] Mod path: {modPath}");
            YATMLogger.LogDebug($"[CustomContentLoader] DB path: {dbPath}");

            if (!Directory.Exists(dbPath))
            {
                YATMLogger.Log($"[CustomContentLoader] DB folder not found: {dbPath}");
                return;
            }

            YATMLogger.LogDebug("[CustomContentLoader] Loading Custom Quest Zones...");
            await commonCore.CreateCustomQuestZones(assembly);

            YATMLogger.LogDebug("[CustomContentLoader] Loading Custom Quests...");
            await commonCore.CreateCustomQuests(assembly);

            YATMLogger.Log("[CustomContentLoader] Finished loading all custom content.");
        }
        catch (Exception ex)
        {
            YATMLogger.Log($"[CustomContentLoader] Exception during content load: {ex}");
            YATMLogger.LogDebug(ex.StackTrace ?? "No stack trace");
        }
    }
}