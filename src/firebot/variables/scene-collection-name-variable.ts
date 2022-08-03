import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";
import { getCurrentSceneCollectionName } from "../../obs-remote";

export const SceneCollectionNameVariable: ReplaceVariable = {
  definition: {
    handle: "obsSceneCollectionName",
    description:
      "The name of the current OBS Scene Collection. If OBS isn't running, it returns 'Unknown'.",
    possibleDataOutput: ["text"],
  },
  evaluator: async () => {
    const currentSceneCollectionName = await getCurrentSceneCollectionName();
    return currentSceneCollectionName ?? "Unknown";
  },
};
