using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Aki.Reflection.Patching;
using Diz.LanguageExtensions;
using EFT;
using EFT.Interactive;
using EFT.InventoryLogic;
using HarmonyLib;
using UnityEngine;

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
                new MasterKeyPatches.KeycardDoorUnlockOperationPatch(),
                new MasterKeyPatches.GetActionsClassPatch(),
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
                playerFieldInfo = AccessTools.GetDeclaredFields(typeof(PlayerOwner)).Single(x => x.FieldType == typeof(Player));
                controllerClassFieldInfo = AccessTools.GetDeclaredFields(typeof(Player)).Single(x => x.FieldType == typeof(InventoryControllerClass));
                return AccessTools.Method(typeof(PlayerOwner), nameof(PlayerOwner.GetKey));
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
                        KeyComponent KeyMasterComponent = controllerClass.Inventory.Equipment.GetItemComponentsInChildren<KeyComponent>(onlyMerged: false).FirstOrDefault((x) => x.Template.KeyId == "MA_MasterKey");
                        
                        if (KeyMasterComponent != null)
                        {
                            __result = KeyMasterComponent;
                        }
                    }
                }
                catch (Exception e)
                {
                    Logger.LogError(e.Message);
                    
                }
               
            }
        }
        
        public class WorldInteractiveObjectPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return AccessTools.Method(typeof(WorldInteractiveObject), nameof(WorldInteractiveObject.UnlockOperation));
            }
            
            [PatchPostfix]
            private static void PatchPostfix(ref KeyComponent key, Player player, WorldInteractiveObject __instance, ref GStruct416<GClass2964> __result)
            {
                if (key.Template.KeyId == "MA_MasterKey")
                {
                    Error canInteract = player.MovementContext.CanInteract;
                    if (canInteract != null)
                    {
                        return;
                    }
                    
                    GStruct414<GClass2783> gStruct = default(GStruct414<GClass2783>);
                    key.NumberOfUsages++;
                    if (key.NumberOfUsages >= key.Template.MaximumNumberOfUsage && key.Template.MaximumNumberOfUsage > 0)
                    {
                        gStruct = InteractionsHandlerClass.Discard(key.Item, (TraderControllerClass)key.Item.Parent.GetOwner());
                        if (gStruct.Failed)
                        {
                            __result = gStruct.Error;
                        }
                    }
                    __result = new GClass2964(key, gStruct.Value, succeed: true);
                }
            }
        }
        
        public class KeycardDoorUnlockOperationPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return AccessTools.Method(typeof(KeycardDoor), nameof(KeycardDoor.UnlockOperation));
            }
            
            [PatchPostfix]
            private static void PatchPostfix(ref KeyComponent key, Player player, ref GStruct416<GClass2964> __result)
            {
                if (key.Template.KeyId == "MA_MasterCard")
                {
                    Error canInteract = player.MovementContext.CanInteract;
                    if (canInteract != null)
                    {
                        return;
                    }
                    
                    GStruct414<GClass2783> gStruct = default(GStruct414<GClass2783>);
                    key.NumberOfUsages++;
                    if (key.NumberOfUsages >= key.Template.MaximumNumberOfUsage && key.Template.MaximumNumberOfUsage > 0)
                    {
                        gStruct = InteractionsHandlerClass.Discard(key.Item, (TraderControllerClass)key.Item.Parent.GetOwner());
                        if (gStruct.Failed)
                        {
                            __result = gStruct.Error;
                        }
                    }
                    __result = new GClass2964(key, gStruct.Value, succeed: true);
                }
            }
        }
        
        public class GetActionsClassPatch : ModulePatch
        {
            protected override MethodBase GetTargetMethod()
            {
                return AccessTools.Method(typeof(GetActionsClass), "smethod_3");
            }

            [PatchPostfix]
            private static void PatchPostfix(GamePlayerOwner owner, WorldInteractiveObject worldInteractiveObject, GetActionsClass __instance,
                ref ActionsReturnClass __result)
            {
                if (__result.Actions.Count > 0)
                {
                    
                    int index = __result.Actions.FindIndex(s => s.Name == "Unlock");
                    if (index != -1)
                    {
                        KeyComponent key = owner.GetKey(worldInteractiveObject);
                        if (key != null && key.Template.KeyId == "MA_MasterKey")
                        {
                            __result.Actions[index].Name = "MA_MasterKeyUnlock";
                        }
                    }
                }
            }
        }
    }
}
