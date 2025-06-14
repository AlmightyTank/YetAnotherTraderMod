// src/loadFleaAssort.js

"use strict";

const addedToAssort = new Set();

function generateMongoID() {
    const hex = "0123456789abcdef";
    let id = "";
    for (let i = 0; i < 24; i++) {
        id += hex[Math.floor(Math.random() * 16)];
    }
    return id;
}

function addFleaOnlyWeaponPartsToAssort(tables, logger, existingTpls, traderId) {
    const items = tables.templates.items;
    const fleaPrices = tables.templates.prices;
    const assort = tables.traders[traderId].assort;

    const rootWeaponModParents = new Set([
        "55818a594bdc2db9688b456a", // muzzle
        "55818a304bdc2db5418b457d", // mount
        "55818a6f4bdc2db9688b456b", // sights
        "55818a104bdc2db9688b4569", // tactical
        "55818a684bdc2ddd698b456d", // receiver
        "55818b164bdc2ddc698b456c", // stock
        "55818b084bdc2d5b648b4571", // foregrip
        "55818b014bdc2ddc698b456b", // handguard
        "55818a334bdc2db5418b4573", // gasblock
        "55818aeb4bdc2ddc698b456a", // barrel
    ]);

    // Recursive parent check helper
    function isWeaponMod(tpl) {
        let current = items[tpl];
        let depth = 0;
        while (current && current._parent && depth++ < 10) {
            if (rootWeaponModParents.has(current._parent)) return true;
            current = items[current._parent];
        }
        return false;
    }

    // Determine loyalty level based on flea price
    function getLoyaltyLevel(price) {
        if (price < 10000) return 1;
        if (price < 50000) return 2;
        if (price < 150000) return 3;
        return 4;
    }

    const bannedTpls = new Set([
        "62811d61578c54356d6d67ea", // example banned item ID
        "5894a51286f77426d13baf02",
        "66152153a031cbb5570e346f",
        "628120415631d45211793c99",
        "5648b62b4bdc2d9d488b4585"
    ]);

    let addedCount = 0;

    for (const [tpl, item] of Object.entries(items)) {
        if (existingTpls.has(tpl)) continue;
        if (bannedTpls.has(tpl)) continue;  // skip banned tpl
        if (!item?._props) continue;

        // Check if item is not sold by any trader already
        const hasNoTraders = !Object.values(tables.traders).some(trader =>
            trader.assort &&
            Array.isArray(trader.assort.items) &&
            trader.assort.items.some(i => i._tpl === tpl)
        );

        if (!hasNoTraders) continue;

        if (!isWeaponMod(tpl)) continue;

        const basePrice = fleaPrices[tpl] || 20000;
        const price = Math.round(basePrice * 1.05);  // 5% increase
        const uid = generateMongoID();

        assort.items.push({
            _id: uid,
            _tpl: tpl,
            parentId: "hideout",
            slotId: "hideout",
            upd: { UnlimitedCount: true, StackObjectsCount: 99999 }
        });
        assort.barter_scheme[uid] = [[{ count: price, _tpl: "5449016a4bdc2d6f028b456f" }]]; // roubles
        assort.loyal_level_items[uid] = getLoyaltyLevel(price);;

        addedCount++;  // increment count
    }
    logger.log(`[FleaAddon] Added ${addedCount} flea-only weapon parts to trader assort.`, "green");
}


module.exports = { addFleaOnlyWeaponPartsToAssort };