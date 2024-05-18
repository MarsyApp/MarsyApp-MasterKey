import {DependencyContainer} from "tsyringe";
import {IPostAkiLoadMod} from "@spt-aki/models/external/IPostAkiLoadMod";
import {IPostDBLoadMod} from "@spt-aki/models/external/IPostDBLoadMod";
import {JsonUtil} from "@spt-aki/utils/JsonUtil";
import {DatabaseServer} from "@spt-aki/servers/DatabaseServer";

import * as config from "../config/config.json";

class Mod implements IPostAkiLoadMod, IPostDBLoadMod {
	container: DependencyContainer;

	public postAkiLoad(container: DependencyContainer): void {
		this.container = container;
	}

	public postDBLoad(container: DependencyContainer): void {
		const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
		const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
		const tables = databaseServer.getTables();
		const loots = tables.loot.staticLoot;
		const handbook = tables.templates.handbook;
		const locales = tables.locales.global;

		const KEY_ID = "5448ba0b4bdc2d02308b456c";
		const KEY_KEYS_ID = "59fafd4b86f7745ca07e1232";

		const CARD_ID = "5e42c81886f7742a01529f57";

		const itemKeyId = "MA_MasterKey",
			itemKeyCategory = "5795f317245977243854e041",
			itemKeyFleaPrice = config.price,
			itemKeyNameRu = "Отмычка",
			itemKeyNameEn = "Lockpick",
			itemKeyShortNameRu = "Отмычка",
			itemKeyShortNameEn = "Lockpick",
			itemKeyDescriptionRu = "Одноразовая отмычка, откроет любую дверь",
			itemKeyDescriptionEn = "Disposable lock pick, opens any door",
			actionKeyTextRu = "! ОТКРЫТЬ ОТМЫЧКОЙ !",
			actionKeyTextEn = "! USE LOCKPICK !"

		const itemCardId = "MA_MasterCard",
			itemCardCategory = "5795f317245977243854e041",
			itemCardFleaPrice = config.price,
			itemPrefabPath ="item_keycard_lab_red.bundle",
			itemCardNameRu = "Взломщик",
			itemCardNameEn = "Keygrabber",
			itemCardShortNameRu = "Взлом.",
			itemCardShortNameEn = "Grabber",
			itemCardDescriptionRu = "Одноразовый перехватчик кодов, откроет любую дверь запертую на ключ-карту",
			itemCardDescriptionEn = "Disposable keygrabber, will open any door locked with a key card"

		for (const loot in loots) {
			const lootItem = loots[loot];
			lootItem.itemDistribution.push({
				tpl: itemKeyId,
				relativeProbability: config.weights
			});
			lootItem.itemDistribution.push({
				tpl: itemCardId,
				relativeProbability: config.cardWeights
			});
		}


		const itemKey = jsonUtil.clone(tables.templates.items[KEY_ID]);
		const itemKeyCont = jsonUtil.clone(tables.templates.items[KEY_KEYS_ID]);

		itemKey._id = itemKeyId;
		itemKey._props.Prefab.path = itemKeyCont._props.Prefab.path;
		itemKey._props.MaximumNumberOfUsage = config.maximumNumberOfUsage;
		itemKey._props.InsuranceDisabled = true;
		tables.templates.items[itemKeyId] = itemKey;

		const localesKeys = Object.keys(locales);
		for (const localeKey of localesKeys) {
			locales[localeKey]["MA_MasterKeyUnlock"] = localeKey === "ru" ? actionKeyTextRu : actionKeyTextEn;
			locales[localeKey][`${itemKeyId} Name`] = localeKey === "ru" ? itemKeyNameRu : itemKeyNameEn;
			locales[localeKey][`${itemKeyId} ShortName`] = localeKey === "ru" ? itemKeyShortNameRu : itemKeyShortNameEn;
			locales[localeKey][`${itemKeyId} Description`] = localeKey === "ru" ? itemKeyDescriptionRu : itemKeyDescriptionEn;
		}

		handbook.Items.push(
			{
				"Id": itemKeyId,
				"ParentId": itemKeyCategory,
				"Price": itemKeyFleaPrice
			}
		);

		this.allowIntoSecureContainers(itemKeyId, tables.templates.items);


		// -------------------------------------------

		const itemCard = jsonUtil.clone(tables.templates.items[CARD_ID]);

		itemCard._id = itemCardId;
		itemCard._props.Prefab.path = itemPrefabPath;
		itemCard._props.MaximumNumberOfUsage = config.maximumNumberOfUsage;
		itemCard._props.InsuranceDisabled = true;
		tables.templates.items[itemCardId] = itemCard;

		for (const localeKey of localesKeys) {
			locales[localeKey][`${itemCardId} Name`] = localeKey === "ru" ? itemCardNameRu : itemCardNameEn;
			locales[localeKey][`${itemCardId} ShortName`] = localeKey === "ru" ? itemCardShortNameRu : itemCardShortNameEn;
			locales[localeKey][`${itemCardId} Description`] = localeKey === "ru" ? itemCardDescriptionRu : itemCardDescriptionEn;
		}

		handbook.Items.push(
			{
				"Id": itemCardId,
				"ParentId": itemCardCategory,
				"Price": itemCardFleaPrice
			}
		);

		this.allowIntoSecureContainers(itemCardId, tables.templates.items);
	}

	allowIntoSecureContainers(itemId, items): void {
		const secureContainers = {
			"kappa": "5c093ca986f7740a1867ab12",
			"gamma": "5857a8bc2459772bad15db29",
			"epsilon": "59db794186f77448bc595262",
			"beta": "5857a8b324597729ab0a0e7d",
			"alpha": "544a11ac4bdc2d470e8b456a",
			"waistPouch": "5732ee6a24597719ae0c0281"
		};


		for (const secureCase in secureContainers) {
			items[secureContainers[secureCase]]
				._props
				.Grids[0]
				._props
				.filters[0]
				?.Filter
				?.push(itemId)
		}
	}
}

module.exports = {mod: new Mod()}
