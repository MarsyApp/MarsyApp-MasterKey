import {DependencyContainer} from "tsyringe";
import {IPostAkiLoadMod} from "@spt-aki/models/external/IPostAkiLoadMod";
import {IPostDBLoadMod} from "@spt-aki/models/external/IPostDBLoadMod";
import {HashUtil} from "@spt-aki/utils/HashUtil";
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
		const handbook = tables.templates.handbook;
		const locales = Object.values(tables.locales.global) as Record<string, string>[];

		const KEY_ID = "5448ba0b4bdc2d02308b456c";
		const KEY_KYES_ID = "59fafd4b86f7745ca07e1232";

		const itemId = "MA_MasterKey",
			itemCategory = "5795f317245977243854e041",
			itemFleaPrice = config.price,
			itemName = "Отмычка",
			itemShortName = "Отмычка",
			itemDescription = "Одноразовая отмычка",
			itemTraderPrice = config.price;

		const item = jsonUtil.clone(tables.templates.items[KEY_ID]);
		const itemKeyCont = jsonUtil.clone(tables.templates.items[KEY_KYES_ID]);

		item._id = itemId;
		item._props.Prefab.path = itemKeyCont._props.Prefab.path;
		item._props.MaximumNumberOfUsage = 1;
		item._props.Weight = 0.748;
		item._props.InsuranceDisabled = true;
		tables.templates.items[itemId] = item;

		// Add locales
		for (const locale of locales) {
			locale[`${itemId} Name`] = itemName;
			locale[`${itemId} ShortName`] = itemShortName;
			locale[`${itemId} Description`] = itemDescription;
		}

		handbook.Items.push(
			{
				"Id": itemId,
				"ParentId": itemCategory,
				"Price": itemFleaPrice
			}
		);

		const trader = tables.traders["5a7c2eca46aef81a7ca2145d"];

		trader.assort.items.push({
			"_id": itemId,
			"_tpl": itemId,
			"parentId": "hideout",
			"slotId": "hideout",
			"upd":
				{
					"UnlimitedCount": true,
					"StackObjectsCount": 999999
				}
		});
		trader.assort.barter_scheme[itemId] = [
			[
				{
					"count": itemTraderPrice,
					"_tpl": "5449016a4bdc2d6f028b456f" // roubles
				}
			]
		];
		trader.assort.loyal_level_items[itemId] = config.trader_loyalty_level;

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
