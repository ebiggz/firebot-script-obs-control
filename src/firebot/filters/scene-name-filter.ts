import { EventFilter } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-filter-manager";
import { OBS_EVENT_SOURCE_ID, OBS_SCENE_CHANGED_EVENT_ID } from "../constants";

export const SceneNameEventFilter: EventFilter = {
  id: "ebiggz:obs-scene-name",
  name: "Scene Name",
  events: [
    { eventSourceId: OBS_EVENT_SOURCE_ID, eventId: OBS_SCENE_CHANGED_EVENT_ID },
  ],
  description: "Filter on the name of the now active OBS scene",
  valueType: "preset",
  comparisonTypes: ["is", "is not"],
  presetValues: (backendCommunicator, $q) => {
    return $q
      .when(backendCommunicator.fireEventAsync("obs-get-scene-list"))
      .then((scenes: string[]) =>
        scenes.map((s) => {
          return {
            value: s,
            display: s,
          };
        })
      );
  },
  predicate: async ({ comparisonType, value }, { eventMeta }) => {
    const expected = value;
    const actual = eventMeta.sceneName;

    switch (comparisonType) {
      case "is":
        return actual === expected;
      case "is not":
        return actual !== expected;
      default:
        return false;
    }
  },
};
