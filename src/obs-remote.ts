import { ScriptModules } from "firebot-custom-scripts-types";
import * as OBSWebSocket from "obs-websocket-js";
import {
  OBS_EVENT_SOURCE_ID,
  OBS_SCENE_CHANGED_EVENT_ID,
} from "./firebot/constants";
import { logger } from "./logger";

let eventManager: ScriptModules["eventManager"];

const obs = new OBSWebSocket();

let connected = false;

export function initRemote(
  {
    ip,
    port,
    password,
  }: {
    ip: string;
    port: number;
    password: string;
  },
  modules: {
    eventManager: ScriptModules["eventManager"];
  }
) {
  eventManager = modules.eventManager;
  maintainConnection(ip, port, password);
}
export async function getSceneList(): Promise<string[]> {
  if (!connected) return [];
  try {
    const sceneData = await obs.send("GetSceneList");
    return sceneData.scenes.map((s) => s.name);
  } catch (error) {
    return [];
  }
}

export async function getCurrentSceneName(): Promise<string> {
  if (!connected) return null;
  try {
    const scene = await obs.send("GetCurrentScene");
    return scene?.name;
  } catch (error) {
    return null;
  }
}

export async function setCurrentScene(sceneName: string): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("SetCurrentScene", {
      "scene-name": sceneName,
    });
  } catch (error) {
    logger.error("Failed to set current scene", error);
  }
}

export type SourceData = Record<string, Array<{ id: number; name: string }>>;

export async function getSourceData(): Promise<SourceData> {
  if (!connected) return null;
  try {
    const sceneData = await obs.send("GetSceneList");
    return sceneData.scenes.reduce((acc, current) => {
      acc[current.name] = current.sources.map((si) => ({
        name: si.name,
        id: si.id,
      }));
      return acc;
    }, {} as SourceData);
  } catch (error) {
    return null;
  }
}

export async function getSourceVisibility(
  sceneName: string,
  sourceId: number
): Promise<boolean | null> {
  if (!connected) return null;
  try {
    const sceneItemProperties = await obs.send("GetSceneItemProperties", {
      "scene-name": sceneName,
      item: {
        id: sourceId,
      },
    });
    return sceneItemProperties?.visible;
  } catch (error) {
    logger.error("Failed to get scene item properties", error);
    return null;
  }
}

export async function setSourceVisibility(
  sceneName: string,
  sourceId: number,
  visible: boolean
): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("SetSceneItemProperties", {
      "scene-name": sceneName,
      item: {
        id: sourceId,
      },
      visible: visible,
      bounds: undefined,
      crop: undefined,
      position: undefined,
      scale: undefined,
    });
  } catch (error) {
    logger.error("Failed to set scene item properties", error);
  }
}

type OBSFilter = {
  enabled: boolean;
  name: string;
};

export type OBSSource = {
  name: string;
  type: string;
  typeId: string;
  filters: Array<OBSFilter>;
};

export async function getAllSources(): Promise<Array<OBSSource>> {
  if (!connected) return null;
  try {
    const sourceListData = await obs.send("GetSourcesList");
    if (sourceListData && sourceListData.sources) {
      const sources = (sourceListData.sources as unknown) as Array<OBSSource>;
      for (const source of sources) {
        const sourceFiltersData = await obs.send("GetSourceFilters", {
          sourceName: source.name,
        });
        source.filters = (sourceFiltersData.filters as unknown) as Array<OBSFilter>;
      }
      return sources;
    }
    return null;
  } catch (error) {
    logger.error("Failed to get all sources", error);
    return null;
  }
}

export async function getSourcesWithFilters(): Promise<Array<OBSSource>> {
  const sources = await getAllSources();
  return sources.filter((s) => s.filters?.length > 0);
}

export async function getFilterEnabledStatus(
  sourceName: string,
  filterName: string
): Promise<boolean | null> {
  if (!connected) return null;
  try {
    const filterInfo = await obs.send("GetSourceFilterInfo", {
      sourceName,
      filterName,
    });
    return filterInfo?.enabled;
  } catch (error) {
    logger.error("Failed to get filter info", error);
    return null;
  }
}

export async function setFilterEnabled(
  sourceName: string,
  filterName: string,
  filterEnabled: boolean
): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("SetSourceFilterVisibility", {
      sourceName,
      filterName,
      filterEnabled,
    });
  } catch (error) {
    logger.error("Failed to set filter enable status", error);
  }
}

function setupRemoteListeners() {
  obs.on("SwitchScenes", (data) => {
    eventManager?.triggerEvent(
      OBS_EVENT_SOURCE_ID,
      OBS_SCENE_CHANGED_EVENT_ID,
      {
        sceneName: data["scene-name"],
      }
    );
  });
}

async function maintainConnection(ip: string, port: number, password: string) {
  if (!connected) {
    try {
      logger.debug("Trying to connect to OBS...");

      obs.removeAllListeners();

      await obs.connect({ address: `${ip}:${port}`, password: password });

      logger.info("Successfully connected to OBS.");

      connected = true;

      setupRemoteListeners();

      obs.on("ConnectionClosed", () => {
        if (!connected) return;
        connected = false;
        try {
          logger.info("Connection lost, attempting again in 10 secs.");
          setTimeout(() => maintainConnection(ip, port, password), 10000);
        } catch (err) {
          // silently fail
        }
      });
    } catch (error) {
      logger.debug("Failed to connect, attempting again in 10 secs.");
      logger.debug(error);
      setTimeout(() => maintainConnection(ip, port, password), 10000);
    }
  }
}
