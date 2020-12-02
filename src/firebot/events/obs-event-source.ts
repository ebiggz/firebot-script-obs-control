import { Firebot } from "firebot-custom-scripts-types";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_CHANGED_EVENT_ID } from "../constants";

export const OBSEventSource: Firebot.EventSource = {
  id: OBS_EVENT_SOURCE_ID,
  name: "OBS",
  events: [
    {
      id: OBS_SCENE_CHANGED_EVENT_ID,
      name: "OBS Scene Changed",
      description: "When the scene is changed in OBS",
      manualMetadata: {
        sceneName: "Test Scene Name",
      },
    },
  ],
};
