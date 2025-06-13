# 🛒 Tony - The Jack-of-All-Trades Trader (SPT-AKI 3.11)

Tony is a custom trader mod for SPT-AKI 3.11 designed to help new and low-level players thrive without flea market access. He provides a wide selection of helpful gear at each loyalty level, including armor, rigs, and essential items.

---

## 📦 Features

- 🧢 **Trader Name**: Tony  
- 🛡️ **Function**: Sells all item categories  
- 🎯 **Target Audience**: New players / Flea-disabled players  
- 🛠️ **Includes**:
  - Full custom assortments across 4 loyalty levels
  - Repair and insurance services
  - Dynamic loading of extra assortments from other mods
  - Full localization support (working on this)
  - Custom avatar and in-game trader info

---

## 📁 Installation

1. **Extract** the folder into your `user/mods` directory:
SPT-AKI/
└── user/
└── mods/
└── YetAnotherTraderMod/

2. Make sure the structure looks like this:
YetAnotherTraderMod/
├── src/
├── db/
│ └── assort/
│ ├── base.json
│ └── extra/
├── config/
│ └── trader.json
├── mod.js
├── package.json
└── README.md

3. Launch your server!

---

## 📜 Trader Overview

| Loyalty | Equipment Tier | Examples |
|---------|----------------|----------|
| **LL1** | Budget gear     | PACA, BlackRock rig, 6B5-15 armor |
| **LL2** | Mid-entry       | AVS rig, Gzhel (damaged), UMTBS |
| **LL3** | Mid-tier        | Fort Redut-M, Crye AVS, Korund |
| **LL4** | High-end        | Gen4, Slicks, Hexgrid, Crye CPC |

---

## 🧩 Mod Interoperability

You can place additional assortments in:
YetAnotherTraderMod/db/assort/extra/

These will be automatically loaded if present, allowing easy extension by other mods.

---

## 🖼️ Credits

- Trader Avatar: AI-generated composite styled after Tagilla in military gear  
- Original idea and concept: AlmightyTank
- SPT-AKI Team for their fantastic framework

---

## ✅ Compatibility

- ✅ SPT-AKI Version: **3.11.x**
- ❌ Not tested on older versions

---

## 📣 Feedback & Suggestions

Have ideas for balance or want to submit your own assort?  
Join the SPT-AKI Discord or message the mod creator directly.

Enjoy and stay safe in Tarkov, PMC.