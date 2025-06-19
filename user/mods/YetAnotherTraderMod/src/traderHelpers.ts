import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { ITraderBase, ITraderAssort } from "@spt/models/eft/common/tables/ITrader";
import { ITraderConfig, UpdateTime } from "@spt/models/spt/config/ITraderConfig";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ImageRouter } from "@spt/routers/ImageRouter";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import * as fs from "fs";
import * as path from "path";

export class TraderHelper
{
    /**
     * Add record to trader config to set the refresh time of trader in seconds (default is 60 minutes)
     * @param traderConfig trader config to add our trader to
     * @param baseJson json file for trader (db/base.json)
     * @param refreshTimeSecondsMin How many seconds between trader stock refresh min time
     * @param refreshTimeSecondsMax How many seconds between trader stock refresh max time
     */
    public setTraderUpdateTime(traderConfig: ITraderConfig, baseJson: any, refreshTimeSecondsMin: number, refreshTimeSecondsMax: number): void
    {
        // Add refresh time in seconds to config
        const traderRefreshRecord: UpdateTime = {
            traderId: baseJson._id,
            seconds: {
                min: refreshTimeSecondsMin,
                max: refreshTimeSecondsMax,
            },
        };

        traderConfig.updateTime.push(traderRefreshRecord);
    }

    private mergeNestedObjects(oldObj: any, newObj: any): any {
        if (Array.isArray(oldObj) && Array.isArray(newObj)) {
            const mergedArray = [...oldObj];
            for (const item of newObj) {
                if (!oldObj.some((existing: any) => JSON.stringify(existing) === JSON.stringify(item))) {
                    mergedArray.push(item);
                }
            }
            return mergedArray;
        }

        if (
            typeof oldObj === "object" &&
            oldObj !== null &&
            !Array.isArray(oldObj) &&
            typeof newObj === "object" &&
            newObj !== null &&
            !Array.isArray(newObj)
        ) {
            const result: Record<string, any> = { ...oldObj };
            for (const key in newObj) {
                if (newObj.hasOwnProperty(key)) {
                    result[key] = this.mergeNestedObjects(oldObj[key], newObj[key]);
                }
            }
            return result;
        }

        return newObj;
    }

    /**
     * Add our new trader to the database
     * @param traderDetailsToAdd trader details
     * @param tables database
     * @param jsonUtil json utility class
     * @param fs FileSystem class
     */
    public addTraderToDb( traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil, assortJson: any, preSptModLoader: any, mod: string, logger: any ): void
    {
        // Add trader to trader table
        tables.traders[traderDetailsToAdd._id] = {
            assort: jsonUtil.deserialize(jsonUtil.serialize(assortJson)) as ITraderAssort,
            base: jsonUtil.deserialize(jsonUtil.serialize(traderDetailsToAdd)) as ITraderBase,
            questassort: {
                started: {},
                success: {},
                fail: {},
            },
        };

        // Load extras-config.json
        const extrasConfigPath = path.join(preSptModLoader.getModPath(mod), "db", "extras-config.json");
        if (!fs.existsSync(extrasConfigPath)) {
            return;
        }

        const extrasConfig = jsonUtil.deserialize(fs.readFileSync(extrasConfigPath, "utf-8")) as any;

        const assort = tables.traders[traderDetailsToAdd._id].assort;

        // --- STEP 1: Apply BASE overridePrices.json ---
        const baseOverridePricesPath = path.join(preSptModLoader.getModPath(mod), "db", "extras", "overridePrices.json");

        if (extrasConfig.base?.overridePrices && fs.existsSync(baseOverridePricesPath)) {
            const baseOverridePricesRaw = fs.readFileSync(baseOverridePricesPath, "utf-8").trim();

            if (baseOverridePricesRaw.length === 0) {
                logger.info(`⚠️ [BASE] overridePrices.json is empty — skipping`);
            } else {
                let baseOverridePricesData: any;

                try {
                    baseOverridePricesData = jsonUtil.deserialize(baseOverridePricesRaw);
                } catch (err) {
                    logger.error(`❌ [BASE] Failed to parse overridePrices.json: ${err}`);
                    baseOverridePricesData = {};
                }

                if (Object.keys(baseOverridePricesData).length === 0) {
                    logger.info(`⚠️ [BASE] overridePrices.json has no entries — skipping`);
                } else {
                    for (const itemId in baseOverridePricesData) {
                        assort.barter_scheme[itemId] = baseOverridePricesData[itemId];
                        logger.info(`🔁 [BASE] Overriding price for item: ${itemId}`);
                    }

                    logger.info(`✅ [BASE] Finished applying overridePrices.json`);
                }
            }
        }


        // --- STEP 2: For each mod ---
        for (const modName in extrasConfig.mods) {
            const modConfig = extrasConfig.mods[modName];

            if (!modConfig.enabled) {
                continue;
            }

            const modFolderPath = path.join(preSptModLoader.getModPath(mod), "..", modName);

            if (!fs.existsSync(modFolderPath)) {
                continue;
            }

            const extrasPath = path.join(preSptModLoader.getModPath(mod), "db", "extras", modName, `assort.json`);

            if (!fs.existsSync(extrasPath)) {
                continue;
            }

            const extrasData = jsonUtil.deserialize(fs.readFileSync(extrasPath, "utf-8")) as any;
            const extrasDataBarterScheme = extrasData.barter_scheme;
            const assortBarterScheme = Object.values(assort.barter_scheme);
            assort.barter_scheme = this.mergeNestedObjects(assortBarterScheme, extrasDataBarterScheme);

            // --- STEP 2a: Load mod overridePrices.json ---
            const modOverridePricesPath = path.join(preSptModLoader.getModPath(mod), "db", "extras", modName, "overridePrices.json");

            if (modConfig.overridePrices && fs.existsSync(modOverridePricesPath)) {
                const modOverridePricesRaw = fs.readFileSync(modOverridePricesPath, "utf-8").trim();

                if (modOverridePricesRaw.length === 0) {
                    logger.info(`⚠️ [${modName}] overridePrices.json is empty — skipping`);
                } else {
                    let allowedOverrides: string[] = [];

                    if (fs.existsSync(modOverridePricesPath)) {
                        const modOverridePricesData = jsonUtil.deserialize(fs.readFileSync(modOverridePricesPath, "utf-8")) as any;
                        allowedOverrides = Object.keys(modOverridePricesData);

                        // Apply mod overrides
                        for (const itemId of allowedOverrides) {
                            assort.barter_scheme[itemId] = modOverridePricesData[itemId];
                            logger.info(`🔁 [${modName}] Overriding price for item: ${itemId}`);
                        }

                        logger.info(`✅ [${modName}] Finished applying overridePrices.json`);
                    }

                    // --- STEP 2b: Process extrasData.barter_scheme ---
                    for (const itemId in extrasDataBarterScheme) {
                        if (!allowedOverrides.includes(itemId)) {
                            // Item not in mod overridePrices.json — skip
                            logger.info(`⏭️ [${modName}] Skipping item (not in overridePrices.json): ${itemId}`);
                            continue;
                        }

                        // Item already overridden — no need to add/merge
                        logger.info(`✅ [${modName}] Item already overridden by overridePrices.json: ${itemId}`);
                    }

                    // --- Merge extrasData.items ---
                    const assortItems = Object.values(assort.items);
                    const extrasDataItems = Object.values(extrasData.items);
                    assort.items = this.mergeNestedObjects(assortItems, extrasDataItems);

                    // --- Merge extrasData.loyal_level_items ---
                    const assortLoyal = assort.loyal_level_items;
                    const extrasDataLoyal = extrasData.loyal_level_items;
                    assort.loyal_level_items = this.mergeNestedObjects(assortLoyal, extrasDataLoyal);
                }
            } else {
                if (!modConfig.overridePrices) {
                    logger.info(`[${modName}] overridePrices disabled by config`);
                }
            }  
        }
    }

    /**
     * Add traders name/location/description to the locale table
     * @param baseJson json file for trader (db/base.json)
     * @param tables database tables
     * @param fullName Complete name of trader
     * @param firstName First name of trader
     * @param nickName Nickname of trader
     * @param location Location of trader (e.g. "Here in the cat shop")
     * @param description Description of trader
     */
    public addTraderToLocales(baseJson: any, tables: IDatabaseTables, fullName: string, firstName: string, nickName: string, location: string, description: string)
    {
        // For each language, add locale for the new trader
        const locales = Object.values(tables.locales.global);

        for (const locale of locales) {
            locale[`${baseJson._id} FullName`] = fullName;
            locale[`${baseJson._id} FirstName`] = firstName;
            locale[`${baseJson._id} Nickname`] = nickName;
            locale[`${baseJson._id} Location`] = location;
            locale[`${baseJson._id} Description`] = description;
        }
    }
}
