import {DependencyContainer} from "tsyringe";
import {IPostAkiLoadMod} from "@spt-aki/models/external/IPostAkiLoadMod";
import {IPostDBLoadMod} from "@spt-aki/models/external/IPostDBLoadMod";
import {JsonUtil} from "@spt-aki/utils/JsonUtil";
import {DatabaseServer} from "@spt-aki/servers/DatabaseServer";

import * as config from "../config/config.json";

class Mod implements IPostAkiLoadMod, IPostDBLoadMod
{
	container: DependencyContainer;

	public postAkiLoad(container: DependencyContainer): void
{
		this.container = container;
	}

	public postDBLoad(container: DependencyContainer): void
{
		const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
		const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
		const tables = databaseServer.getTables();
		const loots = tables.loot.staticLoot;
		const handbook = tables.templates.handbook;
		const locales = tables.locales.global;

		const KEY_ID = "5448ba0b4bdc2d02308b456c";
		const KEY_KEYS_ID = "59fafd4b86f7745ca07e1232";

		const itemId = "MA_MasterKey",
			itemCategory = "5795f317245977243854e041",
			itemFleaPrice = config.price,
			itemNameRu = "Отмычка",
			itemNameEn = "Lockpick",
			itemShortNameRu = "Отмычка",
			itemShortNameEn = "Lockpick",
			itemDescriptionRu = "Одноразовая отмычка, откроет любую дверь",
			itemDescriptionEn = "Disposable lock pick, opens any door.",
			ActionTextRu = "! ОТКРЫТЬ ОТМЫЧКОЙ !",
			ActionTextEn = "! USE LOCKPICK !"

		for (const loot in loots)
		{
			const lootItem = loots[loot];
			lootItem.itemDistribution.push({
				tpl: itemId,
				relativeProbability: config.weights
			});
		}


		const item = jsonUtil.clone(tables.templates.items[KEY_ID]);
		const itemKeyCont = jsonUtil.clone(tables.templates.items[KEY_KEYS_ID]);

		item._id = itemId;
		item._props.Prefab.path = itemKeyCont._props.Prefab.path;
		item._props.MaximumNumberOfUsage = config.maximumNumberOfUsage;
		item._props.InsuranceDisabled = true;
		tables.templates.items[itemId] = item;

	const localesKeys = Object.keys(locales);
	for (const localeKey of localesKeys) {
		locales[localeKey]["MA_MasterKeyUnlock"] = localeKey === "ru" ? ActionTextRu : ActionTextEn;
		locales[localeKey][`${itemId} Name`] = localeKey === "ru" ? itemNameRu : itemNameEn;
		locales[localeKey][`${itemId} ShortName`] = localeKey === "ru" ? itemShortNameRu : itemShortNameEn;
		locales[localeKey][`${itemId} Description`] = localeKey === "ru" ? itemDescriptionRu : itemDescriptionEn;
	}

		handbook.Items.push(
			{
				"Id": itemId,
				"ParentId": itemCategory,
				"Price": itemFleaPrice
			}
		);

		this.allowIntoSecureContainers(itemId, tables.templates.items);
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
