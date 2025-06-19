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
    public addTraderToDb(traderDetailsToAdd: any, tables: IDatabaseTables, jsonUtil: JsonUtil, assortJson: any, preSptModLoader: any, mod: string, logger: any): void
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

                    let counter = 0;

                    if (extrasConfig.autoPricing?.enabled) {
                        const markupPercent = extrasConfig.autoPricing?.percent || 1.05;
                        const fleaPrices = tables.templates.prices;
                        const handbook = tables.templates.handbook.Items;

                        const processedIds = new Set<string>();

                        for (const assortItem of assort.items) {
                            const tpl = assortItem._tpl;
                            const barterId = assortItem._id;

                            if (assort.barter_scheme[barterId] !== undefined && !processedIds.has(barterId)) {

                                const fleaPrice = fleaPrices[tpl];
                                const handbookPrice = handbook.find((h: { Id: any; }) => h.Id === tpl)?.Price;
                                const rawAssortPrice = jsonUtil.deserialize(jsonUtil.serialize(assort.barter_scheme[barterId]?.[0]?.[0]?.count));
                                const assortPrice = (typeof rawAssortPrice === "number") ? rawAssortPrice : Number(rawAssortPrice) || 777;


                                const priceBase = (fleaPrice !== undefined && handbookPrice !== undefined)
                                    ? Math.min(fleaPrice, handbookPrice)
                                    : assortPrice;

                                // Detect if it's a weapon (categories start with "weapon" in handbook categories)
                                const parentId = handbook.find((h: { Id: any; }) => h.Id === tpl)?.ParentId;

                                const weaponParentIds = [
                                    "5b5f78fc86f77409407a7f90",
                                    "5b5f791486f774093f2ed3be",
                                    "5b5f794b86f77409407a7f92",
                                    "5b5f796a86f774093f2ed3c0",
                                    "5b5f798886f77447ed5636b5",
                                    "5b5f78e986f77447ed5636b1"
                                ];

                                const stimParentIds = [
                                    "5448f3a64bdc2d60728b456a",
                                    "5b47574386f77428ca22b33a"
                                ];

                                const medsParentIds = [
                                    "5b47574386f77428ca22b339"
                                ];

                                const magsParentIds = [
                                    "5b5f754a86f774094242f19b"
                                ];

                                const nadsParentIds = [
                                    "5b5f7a2386f774093f2ed3c4"
                                ];

                                const isWeapon = weaponParentIds.includes(parentId);
                                const isStims = stimParentIds.includes(parentId);
                                const isMags = magsParentIds.includes(parentId);
                                const isNads = nadsParentIds.includes(parentId);

                                let finalPrice: number;

                                if (isWeapon) {
                                    const weaponConf = extrasConfig.autoPricing?.weapons || { multiplier: 2, discount: 0.75 };
                                    finalPrice = (Math.max(fleaPrice, handbookPrice, assortPrice)) * weaponConf.multiplier * weaponConf.discount;
                                } else if (isStims) {
                                    const stimConf = extrasConfig.autoPricing?.stims || { multiplier: 2, discount: 0.75, maxDiffPercent: 0.3 };
                                    const candidatePrice = priceBase * stimConf.multiplier * stimConf.discount;; // 1.5x

                                    const maxDiffPercent = stimConf.maxDiffPercent;

                                    const diffFlea = fleaPrice ? Math.abs(candidatePrice - fleaPrice) / fleaPrice : 0;
                                    const diffHandbook = handbookPrice ? Math.abs(candidatePrice - handbookPrice) / handbookPrice : 0;

                                    if (diffFlea <= maxDiffPercent || diffHandbook <= maxDiffPercent) {
                                        finalPrice = candidatePrice;
                                    } else if (fleaPrice !== undefined) {
                                        finalPrice = Math.round(fleaPrice * stimConf.fallbackDiscount);
                                    } else {
                                        finalPrice = candidatePrice;
                                    }
                                } else if (isMags) {
                                    const magsConf = extrasConfig.autoPricing?.mags || { multiplier: 2, discount: 0.75 };
                                    finalPrice = (Math.max(fleaPrice, handbookPrice, assortPrice)) * magsConf.multiplier * magsConf.discount;
                                } else if (isNads) {
                                    const nadsConf = extrasConfig.autoPricing?.nads || { multiplier: 2, discount: 0.75 };
                                    finalPrice = (Math.min(fleaPrice, handbookPrice, assortPrice)) * nadsConf.multiplier * nadsConf.discount;
                                } else {
                                    finalPrice = priceBase * markupPercent;
                                } 

                                finalPrice = Math.round(finalPrice); // Round to nearest whole

                                if (isNaN(finalPrice) || finalPrice <= 0) {
                                    if (extrasConfig.autoPricing?.fallbackPrices?.[tpl]) {
                                        finalPrice = extrasConfig.autoPricing.fallbackPrices[tpl];
                                        logger.warning(`[YATM] Fallback to price from config for item ${tpl}: ${finalPrice}`);
                                    } else {
                                        logger.warning(`[YATM] No fallback price found in config for item ${tpl}, keeping assortPrice`);
                                        finalPrice = assortPrice;
                                    }
                                }

                                //console.log(barterId, finalPrice)

                                assort.barter_scheme[barterId] = [[{
                                    count: finalPrice,
                                    _tpl: "5449016a4bdc2d6f028b456f" // roubles
                                }]];

                                processedIds.add(barterId); // mark as processed
                                counter++;
                            }

                        }
                        logger.log(`[YATM] AutoPricing applied to ${counter} items — ${Math.ceil((markupPercent - 1) * 100)}%`, "cyan");
                    }


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
