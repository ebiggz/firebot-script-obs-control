import { ScriptModules } from "firebot-custom-scripts-types";
import {
  getAllSources,
  getSceneList,
  getSourceData,
  SourceData,
  OBSSource,
  getSourcesWithFilters,
} from "../obs-remote";

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

  frontendCommunicator.onAsync<never, Array<OBSSource>>(
    "obs-get-sources-with-filters",
    getSourcesWithFilters
  );
}
