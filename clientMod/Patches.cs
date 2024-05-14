using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Aki.Reflection.Patching;
using Diz.LanguageExtensions;
using EFT;
using EFT.Interactive;
using EFT.InventoryLogic;
using EFT.UI.DragAndDrop;
using HarmonyLib;

namespace MasterKey
{
    class Patcher
    {
        public static void PatchAll()
        {
            new PatchManager().RunPatches();
        }
        
        public static void UnpatchAll()
        {
            new PatchManager().RunUnpatches();
        }
    }

    public class PatchManager
    {
        public PatchManager()
        {
            this._patches = new List<ModulePatch>
            {
                new MasterKeyPatches.PlayerOwnerPatch(),
                new MasterKeyPatches.WorldInteractiveObjectPatch(),
                new MasterKeyPatches.GClass1726Patch(),
            };
        }

        public void RunPatches()
        {
            foreach (ModulePatch patch in this._patches)
            {
                patch.Enable();
            }
        }
        
        public void RunUnpatches()
        {
            foreach (ModulePatch patch in this._patches)
            {
                patch.Disable();
            }
        }

        private readonly List<ModulePatch> _patches;
    }

    public static class MasterKeyPatches
    {
        public class PlayerOwnerPatch : ModulePatch
        {
            private static FieldInfo playerFieldInfo;
            private static FieldInfo controllerClassFieldInfo;
            protected override MethodBase GetTargetMethod()
            {
                playerFieldInfo = typeof(PlayerOwner).GetField("player_0", BindingFlags.Instance | BindingFlags.NonPublic);
                controllerClassFieldInfo = typeof(Player).GetField("_inventoryController", BindingFlags.Instance | BindingFlags.NonPublic);
                return typeof(PlayerOwner).GetMethod("GetKey",
                    BindingFlags.Instance | BindingFlags.Public);
            }

            [PatchPostfix]
            private static void PatchPostfix(PlayerOwner __instance, WorldInteractiveObject worldInteractiveObject, ref KeyComponent __result)
            {
                try
                {
                    if(__result == null)
                    {
                        Player player = (Player)playerFieldInfo.GetValue(__instance);
                        InventoryControllerClass controllerClass = (InventoryControllerClass)controllerClassFieldInfo.GetValue(player);
                        KeyComponent KeyMasterComponent = controllerClass.Inventory.Equipment.GetItemComponentsInChildren<KeyComponent>(onlyMerged: false).FirstOrDefault((KeyComponent x) => x.Template.KeyId == "MA_MasterKey");
                        
                        if (KeyMasterComponent != null)
                        {
                            __result = KeyMasterComponent;
                        }
                    }
                }
                catch (System.Exception e)
                {
                    Logger.LogError(e.Message);
                    
                }
               
            }
        }
        
        public class WorldInteractiveObjectPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return typeof(WorldInteractiveObject).GetMethod("UnlockOperation",
                    BindingFlags.Instance | BindingFlags.Public);
            }
            
            [PatchPostfix]
            private static void PatchPostfix(ref KeyComponent key, Player player, WorldInteractiveObject __instance, ref GStruct376<GClass2761> __result)
            {
                if (key.Template.KeyId == "MA_MasterKey")
                {
                    Error canInteract = player.MovementContext.CanInteract;
                    if (canInteract != null)
                    {
                        return;
                    }
                    
                    GStruct375<GClass2594> gStruct = default(GStruct375<GClass2594>);
                    key.NumberOfUsages++;
                    if (key.NumberOfUsages >= key.Template.MaximumNumberOfUsage && key.Template.MaximumNumberOfUsage > 0)
                    {
                        gStruct = GClass2585.Discard(key.Item, (TraderControllerClass)key.Item.Parent.GetOwner());
                        if (gStruct.Failed)
                        {
                            __result = gStruct.Error;
                        }
                    }
                    __result = new GClass2761(key, gStruct.Value, succeed: true);
                }
            }
        }
        
        public class GClass1726Patch : ModulePatch
        {
            private static FieldInfo controllerClassFieldInfo;
            protected override MethodBase GetTargetMethod()
            {
                controllerClassFieldInfo = typeof(Player).GetField("_inventoryController", BindingFlags.Instance | BindingFlags.NonPublic);
                return typeof(GClass1726).GetMethod("smethod_2",
                    BindingFlags.Static | BindingFlags.NonPublic);
            }

            [PatchPostfix]
            private static void PatchPostfix(GamePlayerOwner owner, WorldInteractiveObject worldInteractiveObject, GClass1726 __instance,
                ref GClass2805 __result)
            {
                if (__result.Actions.Count > 0)
                {
                    
                    int index = __result.Actions.FindIndex(s => s.Name == "Unlock");
                    if (index != -1)
                    {
                        KeyComponent key = owner.GetKey(worldInteractiveObject);
                        if (key != null && key.Template.KeyId == "MA_MasterKey")
                        {
                            __result.Actions[index].Name = "ОТКРЫТЬ отмычкой";
                        }
                    }
                }
            }
        }
    }
}
