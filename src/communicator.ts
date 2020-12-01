import { ScriptModules } from "firebot-custom-scripts-types";
import { getSceneList } from "./obs-remote";

export function setupFrontendListeners(
  frontendCommunicator: ScriptModules["frontendCommunicator"]
) {
  frontendCommunicator.onAsync<never, string[]>(
    "obs-get-scene-list",
    getSceneList
  );
}
