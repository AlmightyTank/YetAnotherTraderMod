import path from "path";
import fs from "fs";
import { TraderHelper } from "./traderHelpers";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { ITraderAssort } from "@spt/models/eft/common/tables/ITrader";

export class Loader {

    private traderHelper: TraderHelper;
    private databaseServer: DatabaseServer;

    constructor(container) {
        this.traderHelper = container.resolve("TraderHelper");
        this.databaseServer = container.resolve("DatabaseServer");
    }

    loadAssorts(traderId: string, preSptModLoader: PreSptModLoader, mod: string) {
        const assortBasePath = path.resolve(preSptModLoader.getModPath(mod), "/db/assort");
        const tables = this.databaseServer.getTables();
        const assort = tables.traders[traderId].assort;

        // Check and load any available "extra" assorts
        const extraPath = path.join(assortBasePath, "extra");
        if (fs.existsSync(extraPath)) {
            const files = fs.readdirSync(extraPath).filter((file: string) => file.endsWith(".json"));

            for (const file of files) {
                const fullPath = path.join(extraPath, file);
                try {
                    const extraAssort = fullPath;
                    this.mergeAssortData(assort, extraAssort);
                    console.log(`[CustomTrader] Loaded extra assort: ${file}`);
                } catch (err) {
                    console.error(`[CustomTrader] Failed to load assort ${file}:`, err);
                }
            }
        }
    }

    mergeAssortData(assort: ITraderAssort, newData: { items: any; barter_scheme: { [x: string]: any; }; loyal_level_items: { [x: string]: any; }; }) {
        if (newData.items) {
            for (const item of newData.items) {
                assort.items[item._id] = item;
            }
        }

        if (newData.barter_scheme) {
            for (const key in newData.barter_scheme) {
                assort.barter_scheme[key] = newData.barter_scheme[key];
            }
        }

        if (newData.loyal_level_items) {
            for (const key in newData.loyal_level_items) {
                assort.loyal_level_items[key] = newData.loyal_level_items[key];
            }
        }
    }
}
