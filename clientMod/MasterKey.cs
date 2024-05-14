using BepInEx;

namespace MasterKey
{
    [BepInPlugin("com.MarsyApp.MasterKey", "MarsyApp-MasterKey", "1.1.0")]
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
