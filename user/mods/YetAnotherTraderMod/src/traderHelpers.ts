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

    /**
     * Add our new trader to the database
     * @param traderDetailsToAdd trader details
     * @param tables database
     * @param jsonUtil json utility class
     * @param fs FileSystem class
     */
    public addTraderToDb(traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil, assortJson: any, preSptModLoader: any, mod: string): void
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
            //console.warn(`⚠️ extras-config.json not found at ${extrasConfigPath}`);
            return;
        }

        const extrasConfig = jsonUtil.deserialize(fs.readFileSync(extrasConfigPath, "utf-8")) as any;

        for (const modName in extrasConfig.mods) {
            const modConfig = extrasConfig.mods[modName];

            if (!modConfig.enabled) {
                //console.log(`⛔ Skipping mod ${modName} — not enabled`);
                continue;
            }

            const modFolderPath = path.join(preSptModLoader.getModPath(mod), "..", modName);

            if (fs.existsSync(modFolderPath)) {
               // console.log(`✅ Loading extras for mod: ${modName}`);

                const extrasPath = path.join(preSptModLoader.getModPath(mod), "db", "extras", modName, `assort.json`);
                if (fs.existsSync(extrasPath)) {
                    const extrasData = jsonUtil.deserialize(fs.readFileSync(extrasPath, "utf-8")) as any;

                    const assort = tables.traders[traderDetailsToAdd._id].assort;

                    function mergeNestedObjects(oldObj: any, newObj: any): any {
                        // If both are arrays, merge with deduplication
                        if (Array.isArray(oldObj) && Array.isArray(newObj)) {
                            const mergedArray = [...oldObj];
                            for (const item of newObj) {
                                if (!oldObj.some((existing: any) => JSON.stringify(existing) === JSON.stringify(item))) {
                                    mergedArray.push(item);
                                }
                            }
                            return mergedArray;
                        }

                        // If both are plain objects, merge keys recursively
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
                                    result[key] = mergeNestedObjects(oldObj[key], newObj[key]);
                                }
                            }
                            return result;
                        }

                        // Otherwise, overwrite with new value
                        return newObj;
                    }

                    const assortItems = Object.values(assort.items);
                    const extrasDataItems = Object.values(extrasData.items);

                    assort.items = mergeNestedObjects(assortItems, extrasDataItems);

                    const assortBarterScheme = assort.barter_scheme;
                    const extrasDataBarterScheme = extrasData.barter_scheme;

                    assort.barter_scheme = mergeNestedObjects(assortBarterScheme, extrasDataBarterScheme);

                    const assortLoyal = assort.loyal_level_items;
                    const extrasDataLoyal = extrasData.loyal_level_items;

                    assort.loyal_level_items = mergeNestedObjects(assortLoyal, extrasDataLoyal);


                    //console.log(`✅ Finished loading extras for mod: ${modName}`);
                } else {
                   // console.warn(`⚠️ No extras JSON found for mod: ${modName} at ${extrasPath}`);
                }
            } else {
                //console.log(`⛔ Skipping mod ${modName} — folder not found in user/mods/`);
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
