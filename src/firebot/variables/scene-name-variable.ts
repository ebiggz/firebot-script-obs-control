import { Firebot } from "firebot-custom-scripts-types";
import { getCurrentSceneName } from "../../obs-remote";

export const SceneNameVariable: Firebot.ReplaceVariable = {
  definition: {
    handle: "obsSceneName",
    description:
      "The name of the current OBS Scene. If OBS isn't running, it returns 'Unknown'.",
    possibleDataOutput: ["text"],
  },
  evaluator: async () => {
    const currentSceneName = await getCurrentSceneName();
    return currentSceneName ?? "Unknown";
  },
};
