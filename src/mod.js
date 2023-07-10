"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const config = __importStar(require("../config/config.json"));
const QuestStatus_1 = require("C:/snapshot/project/obj/models/enums/QuestStatus");
class Mod {
    constructor() {
        this.path = require("path");
    }
    preAkiLoad(container) {
        Mod.container = container;
        this.router = container.resolve("DynamicRouterModService");
        this.jsonUtil = container.resolve("JsonUtil");
        this.getTraderAssort = this.getTraderAssort.bind(this);
        container.afterResolution("TraderController", (_t, result) => {
            const oldGetTraderAssort = result.getAssort.bind(result);
            result.getAssort = (sessionId, traderId) => {
                return this.getTraderAssort(sessionId, traderId, oldGetTraderAssort);
            };
        }, { frequency: "Always" });
        container.afterResolution("InraidCallbacks", (_t, result) => {
            const oldSaveProgress = result.saveProgress.bind(result);
            result.saveProgress = (url, info, sessionID) => {
                return this.saveProgress(url, info, sessionID, oldSaveProgress);
            };
        }, { frequency: "Always" });
        if (config.ragfair.enabled) {
            container.afterResolution("RagfairController", (_t, result) => {
                const oldGetOffers = result.getOffers.bind(result);
                // const oldAddIndexValueToOffers = result.addIndexValueToOffers.bind(result);
                result.getOffers = (sessionID, searchRequest) => {
                    return this.getOffers(sessionID, searchRequest, oldGetOffers);
                };
                /* result.addIndexValueToOffers = (offers: IRagfairOffer[]) => {
                    return this.addIndexValueToOffers(offers, oldAddIndexValueToOffers);
                }*/
            }, { frequency: "Always" });
            container.afterResolution("RagfairSortHelper", (_t, result) => {
                const oldSortOffers = result.sortOffers.bind(result);
                result.sortOffers = (offers, type, direction) => {
                    return this.sortOffers(offers, type, direction, oldSortOffers);
                };
            }, { frequency: "Always" });
        }
        if (config.quests.enabled) {
            container.afterResolution("QuestCallbacks", (_t, result) => {
                // const oldAcceptQuest = result.acceptQuest.bind(result);
                const oldCompleteQuest = result.completeQuest.bind(result);
                // const oldHandoverQuest = result.handoverQuest.bind(result);
                /*result.acceptQuest = (pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string) =>
                {
                    return this.acceptQuest(pmcData, body, sessionID, oldAcceptQuest);
                }*/
                result.completeQuest = (pmcData, body, sessionID) => {
                    return this.completeQuest(pmcData, body, sessionID, oldCompleteQuest);
                };
                /*result.handoverQuest = (pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string) =>
                {
                    return this.handoverQuest(pmcData, body, sessionID, oldHandoverQuest);
                }*/
            }, { frequency: "Always" });
        }
        this.hookRoutes();
    }
    postAkiLoad(container) {
        this.modLoader = container.resolve("PreAkiModLoader");
    }
    hookRoutes() {
        this.router.registerDynamicRouter("MasterKey", [
            {
                url: "/MasterKey/GetData",
                action: (url, info, sessionId, output) => {
                    return this.getData(url, info, sessionId, output);
                }
            },
            {
                url: "/MasterKey/GetInfo",
                action: (url, info, sessionId, output) => {
                    return this.getModInfo(url, info, sessionId, output);
                }
            }
        ], "MasterKey");
    }
    getModInfo(url, info, sessionId, output) {
        const modOutput = {
            status: 1,
            data: null
        };
        modOutput.data = { ...{ path: this.path.resolve(this.modLoader.getModPath("MarsyApp-MasterKey")) } };
        modOutput.status = 0;
        return this.jsonUtil.serialize(modOutput);
    }
    getData(url, info, sessionId, output) {
        const modOutput = {
            status: 1,
            data: null
        };
        const profile = this.getProfile(sessionId);
        if (!profile.MasterKeyItems) {
            profile.MasterKeyItems = [];
        }
        modOutput.data = { MasterKeyItems: profile.MasterKeyItems, MasterKeyItemsIgnore: config.ignoreList || [] };
        modOutput.status = 0;
        return this.jsonUtil.serialize(modOutput);
    }
    saveProgress(url, info, sessionID, oldSaveProgress) {
        if (info.exit === "survived") {
            this.unlockItems(info.profile.Inventory.items, sessionID);
        }
        else if (info.exit !== "runner" && config.saveOnDeath) {
            const itemsMap = new Map();
            info.profile.Inventory.items.forEach((item) => {
                itemsMap.set(item._id, item);
            });
            const saveItems = info.profile.Inventory.items.filter((item) => {
                return this.inSavageContainer(item, itemsMap);
            });
            this.unlockItems(saveItems, sessionID);
        }
        return oldSaveProgress(url, info, sessionID);
    }
    inSavageContainer(item, itemsMap) {
        if (item.parentId) {
            const parentItem = itemsMap.get(item.parentId);
            if (parentItem?.slotId === "SecuredContainer") {
                return true;
            }
            return this.inSavageContainer(parentItem, itemsMap);
        }
        return false;
    }
    getTraderAssort(sessionId, traderId, oldGetTraderAssort) {
        const assort = oldGetTraderAssort(sessionId, traderId);
        const profile = this.getProfile(sessionId);
        if (!profile.MasterKeyItems) {
            profile.MasterKeyItems = [];
        }
        const needDelete = true;
        if (needDelete) {
            assort.items = assort.items.filter((item) => {
                return profile.MasterKeyItems.includes(item._tpl) || config.ignoreList.includes(item._tpl);
            });
        }
        else {
            assort.items.map((item) => {
                if (!profile.MasterKeyItems.includes(item._tpl)) {
                    item.upd = {
                        "UnlimitedCount": false,
                        "StackObjectsCount": 0
                    };
                }
                return item;
            });
        }
        return assort;
    }
    /*private acceptQuest(pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string, oldAcceptQuest: (pmcData: IPmcData, body: IAcceptQuestRequestData, sessionID: string) => IItemEventRouterResponse): IItemEventRouterResponse {
        return oldAcceptQuest(pmcData, body, sessionID);
    }*/
    completeQuest(pmcData, body, sessionID, oldCompleteQuest) {
        const questHelper = Mod.container.resolve("QuestHelper");
        const quest = questHelper.getQuestFromDb(body.qid, pmcData);
        const questRewardItems = questHelper.getQuestRewardItems(quest, QuestStatus_1.QuestStatus.Success);
        this.unlockItems(questRewardItems, sessionID);
        return oldCompleteQuest(pmcData, body, sessionID);
    }
    /*private handoverQuest(pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string, oldHandoverQuest: (pmcData: IPmcData, body: IHandoverQuestRequestData, sessionID: string) => IItemEventRouterResponse): IItemEventRouterResponse {
        return oldHandoverQuest(pmcData, body, sessionID);
    }*/
    sortOffers(offers, type, direction, oldSortOffers) {
        return oldSortOffers(this.getOffersForSearchType(offers, this.selfSessionId), type, direction);
    }
    getOffers(sessionID, searchRequest, getOffers) {
        this.selfSessionId = sessionID;
        return getOffers(sessionID, searchRequest);
    }
    getOffersForSearchType(offers, sessionID) {
        const profile = this.getProfile(sessionID);
        if (!profile.MasterKeyItems) {
            profile.MasterKeyItems = [];
        }
        offers = offers.filter((offer) => {
            return offer.items.every((item) => {
                /*if(!(profile.MasterKeyItems.includes(item._tpl) || config.ignoreList.includes(item._tpl))) {
                }*/
                return profile.MasterKeyItems.includes(item._tpl) || config.ignoreList.includes(item._tpl);
            });
        });
        if (config.ragfair.showOnlyWhenAvailable) {
            offers = this.getFilterHasItems(offers, sessionID);
        }
        return offers;
    }
    getFilterHasItems(offers, sessionID) {
        const profile = this.getProfile(sessionID);
        const mayInventory = profile.characters.pmc.Inventory.items;
        let have = 0;
        let dontHave = 0;
        offers = offers.filter((item) => {
            if (!item.requirements.every((item) => {
                return mayInventory.some((inventoryItem) => {
                    return inventoryItem._tpl === item._tpl;
                });
            })) {
                dontHave++;
                return false;
            }
            else {
                have++;
                return true;
            }
        });
        return offers;
    }
    getProfile(sessionId) {
        const saveServer = Mod.container.resolve("SaveServer");
        return saveServer.getProfile(sessionId);
    }
    unlockItems(items, sessionID) {
        const logger = Mod.container.resolve("WinstonLogger");
        const profile = this.getProfile(sessionID);
        if (!profile.MasterKeyItems) {
            profile.MasterKeyItems = [];
        }
        const origCount = profile.MasterKeyItems.length;
        for (const item of items) {
            if (!item._tpl || profile.MasterKeyItems.includes(item._tpl))
                continue;
            profile.MasterKeyItems.push(item._tpl);
            logger.info(`[MasterKeyItems] Unlocked ${item._tpl} for player ${profile.info?.username}`);
        }
        logger.info(`[MasterKeyItems] Unlocked ${profile.MasterKeyItems.length - origCount} items for player ${profile.info?.username}`);
    }
}
module.exports = { mod: new Mod() };
