"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Loader {
    traderHelper;
    databaseServer;
    constructor(container) {
        this.traderHelper = container.resolve("TraderHelper");
        this.databaseServer = container.resolve("DatabaseServer");
    }
    loadAssorts(traderId, preSptModLoader, mod) {
        const assortBasePath = path_1.default.resolve(preSptModLoader.getModPath(mod), "/db/assort");
        const tables = this.databaseServer.getTables();
        const assort = tables.traders[traderId].assort;
        // Check and load any available "extra" assorts
        const extraPath = path_1.default.join(assortBasePath, "extra");
        if (fs_1.default.existsSync(extraPath)) {
            const files = fs_1.default.readdirSync(extraPath).filter((file) => file.endsWith(".json"));
            for (const file of files) {
                const fullPath = path_1.default.join(extraPath, file);
                try {
                    const extraAssort = fullPath;
                    this.mergeAssortData(assort, extraAssort);
                    console.log(`[CustomTrader] Loaded extra assort: ${file}`);
                }
                catch (err) {
                    console.error(`[CustomTrader] Failed to load assort ${file}:`, err);
                }
            }
        }
    }
    mergeAssortData(assort, newData) {
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
exports.Loader = Loader;
//# sourceMappingURL=loader.js.map