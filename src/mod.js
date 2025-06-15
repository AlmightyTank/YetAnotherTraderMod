"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const Traders_1 = require("C:/snapshot/project/obj/models/enums/Traders");
// New trader settings
const baseJson = require("../db/base.json");
const assortJson = require("../db/assort.json");
const questJson = require("../db/questassort.json");
const traderHelpers_1 = require("./traderHelpers");
const addFleaOnlyWeaponPartsToAssort_1 = require("./addFleaOnlyWeaponPartsToAssort");
const loader_1 = require("./loader");
class YetAnotherTraderMod {
    mod;
    traderImgPath;
    logger;
    traderHelper;
    preSptModLoader;
    constructor() {
        this.mod = "YetAnotherTraderMod"; // Set name of mod so we can log it to console later - match this to your folder name that's built for \user\mods\
        this.traderImgPath = "res/trader.png"; // Set path to trader image
    }
    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    preSptLoad(container) {
        // Get a logger
        this.logger = container.resolve("WinstonLogger");
        this.logger.debug(`[${this.mod}] preSpt Loading... `);
        // Get SPT code/data we need later
        const preSptModLoader = container.resolve("PreSptModLoader");
        this.preSptModLoader = preSptModLoader;
        const imageRouter = container.resolve("ImageRouter");
        const configServer = container.resolve("ConfigServer");
        const traderConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        const ragfairConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
        // Create helper class and use it to register our traders image/icon + set its stock refresh time
        this.traderHelper = new traderHelpers_1.TraderHelper();
        imageRouter.addRoute(baseJson.avatar.replace(".png", ""), `${preSptModLoader.getModPath(this.mod)}${this.traderImgPath}`);
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600, 4000);
        // Add trader to trader enum
        Traders_1.Traders[baseJson._id] = baseJson._id;
        // Add trader to flea market
        ragfairConfig.traders[baseJson._id] = true;
        this.logger.debug(`[${this.mod}] preSpt Loaded`);
    }
    /**
     * Majority of trader-related work occurs after the spt database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    postDBLoad(container) {
        this.logger.debug(`[${this.mod}] postDb Loading... `);
        // Resolve SPT classes we'll use
        const databaseServer = container.resolve("DatabaseServer");
        const jsonUtil = container.resolve("JsonUtil");
        // Get a reference to the database tables
        const tables = databaseServer.getTables();
        // Add new trader to the trader dictionary in DatabaseServer - this is where the assort json is loaded
        this.traderHelper.addTraderToDb(baseJson, tables, jsonUtil, assortJson);
        tables.traders[baseJson._id].questassort = questJson;
        this.traderHelper.addTraderToLocales(baseJson, tables, baseJson.name, "Human", baseJson.nickname, baseJson.location, "A streetwise fixer with deep underworld ties. Tony trades rare gear, meds and guns, no questions asked. If you’ve got the cash, he’s got the connections.");
        const existingTpls = new Set(tables.traders[baseJson._id].assort.items.map(i => i._tpl));
        (0, addFleaOnlyWeaponPartsToAssort_1.addFleaOnlyWeaponPartsToAssort)(tables, this.logger, existingTpls, baseJson._id);
        const loader = new loader_1.Loader(container);
        loader.loadAssorts(baseJson._id, this.preSptModLoader, this.mod);
        this.logger.debug(`[${this.mod}] postDb Loaded`);
    }
}
exports.mod = new YetAnotherTraderMod();
//# sourceMappingURL=mod.js.map