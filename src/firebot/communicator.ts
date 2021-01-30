import { ScriptModules } from "firebot-custom-scripts-types";
import { getSceneList, getSourceData, SourceData } from "../obs-remote";

export function setupFrontendListeners(
  frontendCommunicator: ScriptModules["frontendCommunicator"]
) {
  frontendCommunicator.onAsync<never, string[]>(
    "obs-get-scene-list",
    getSceneList
  );

  frontendCommunicator.onAsync<never, SourceData>(
    "obs-get-source-data",
    getSourceData
  );
}
