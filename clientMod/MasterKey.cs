using System;
using System.Collections.Generic;
using System.IO;
using BepInEx;
using EFT.InventoryLogic;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace MasterKey
{
    [BepInPlugin("com.MarsyApp.MasterKey", "MarsyApp-MasterKey", "1.0.0")]
    public class MasterKey : BaseUnityPlugin
    {
        private void Awake()
        {
            Patcher.PatchAll();
            Logger.LogInfo($"Plugin MasterKeyMod is loaded!");
        }
        
        private void OnDestroy()
        {
            Patcher.UnpatchAll();
            Logger.LogInfo($"Plugin MasterKeyMod is unloaded!");
        }
    }
}
