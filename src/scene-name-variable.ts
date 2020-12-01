import { Firebot } from "firebot-custom-scripts-types";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_CHANGED_EVENT_ID } from "./constants";

export const SceneNameVariable: Firebot.ReplaceVariable = {
  definition: {
    handle: "obsSceneName",
    description: "The name of the current OBS Scene",
    triggers: {
      event: [`${OBS_EVENT_SOURCE_ID}:${OBS_SCENE_CHANGED_EVENT_ID}`],
    },
    possibleDataOutput: ["text"],
  },
  evaluator: async (trigger) => {
    return trigger.metadata.eventData.sceneName || "Unknown scene";
  },
};
