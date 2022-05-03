import { ScriptModules } from "firebot-custom-scripts-types";
import * as OBSWebSocket from "obs-websocket-js";
import {
  OBS_EVENT_SOURCE_ID,
  OBS_SCENE_CHANGED_EVENT_ID,
  OBS_STREAM_STARTED_EVENT_ID,
  OBS_STREAM_STOPPED_EVENT_ID,
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
    logging,
  }: {
    ip: string;
    port: number;
    password: string;
    logging: boolean;
  },
  modules: {
    eventManager: ScriptModules["eventManager"];
  }
) {
  eventManager = modules.eventManager;
  maintainConnection(ip, port, password, logging);
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

export async function getSceneCollectionList(): Promise<string[]> {
  if (!connected) return [];
  try {
    const sceneCollectionData = await obs.send("ListSceneCollections");
    return sceneCollectionData["scene-collections"].map((s) => s["sc-name"]);
  } catch (error) {
    return [];
  }
}

export async function getCurrentSceneCollectionName(): Promise<string> {
  if (!connected) return null;
  try {
    const scene = await obs.send("GetCurrentSceneCollection");
    return scene["sc-name"];
  } catch (error) {
    return null;
  }
}

export async function setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("SetCurrentSceneCollection", {
      "sc-name": sceneCollectionName,
    });
  } catch (error) {
    logger.error("Failed to set current scene collection", error);
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
      let sources = (sourceListData.sources as unknown) as Array<OBSSource>;
      const sceneNameList = await getSceneList();
      sources = sources.concat(
        sceneNameList.map(
          (s) => ({ name: s, filters: [], type: "scene", typeId: "scene" } as OBSSource)
        )
      );
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

async function getSourceTypes() {
  try {
    const sourceTypes = await obs.send("GetSourceTypesList");
    return sourceTypes.types;
  } catch(error) {
    logger.error("Failed to get source types list", error);
    return [];
  }
}

export async function getAudioSources(): Promise<Array<OBSSource>> {
  const sourceTypes = await getSourceTypes();
  const sources = await getAllSources();
  return sources.filter((s) => {
    const type = sourceTypes.find(t => t.typeId === s.typeId);
    return type?.caps.hasAudio;
  });
}

export async function toggleSourceMuted(sourceName: string) {
  try {
    await obs.send("ToggleMute", {
      source: sourceName
    })
  } catch(error) {
    logger.error("Failed to toggle mute for source", error);
  }
}

export async function setSourceMuted(sourceName: string, muted: boolean) {
  try {
    await obs.send("SetMute", {
      source: sourceName,
      mute: muted
    })
  } catch(error) {
    logger.error("Failed to set mute for source", error);
  }
}

export async function getStreamingStatus(): Promise<boolean> {
  if (!connected) return false;
  try {
    const streamingStatus = await obs.send("GetStreamingStatus");
    return streamingStatus.streaming;
  } catch (error) {
    logger.error("Failed to get streaming status", error);
    return false;
  }
}

export async function startStreaming(): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("StartStreaming", {});
  } catch (error) {
    logger.error("Failed to start streaming", error);
    return;
  }
}

export async function stopStreaming(): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("StopStreaming");
  } catch (error) {
    logger.error("Failed to stop streaming", error);
    return;
  }
}

export async function startVirtualCam(): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("StartVirtualCam");
  } catch (error) {
    logger.error("Failed to start virtual camera", error);
    return;
  }
}

export async function stopVirtualCam(): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("StopVirtualCam");
  } catch (error) {
    logger.error("Failed to stop virtual camera", error);
    return;
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

  obs.on("StreamStarted", () => {
    eventManager?.triggerEvent(
      OBS_EVENT_SOURCE_ID,
      OBS_STREAM_STARTED_EVENT_ID,
      {}
    );
  });

  obs.on("StreamStopped", () => {
    eventManager?.triggerEvent(
      OBS_EVENT_SOURCE_ID,
      OBS_STREAM_STOPPED_EVENT_ID,
      {}
    );
  });
}

async function maintainConnection(ip: string, port: number, password: string, logging: Boolean) {
  if (!connected) {
    try {
      if (logging){
        logger.debug("Trying to connect to OBS...");
      }

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
          setTimeout(() => maintainConnection(ip, port, password, logging), 10000);
        } catch (err) {
          // silently fail
        }
      });
    } catch (error) {
      logger.debug("Failed to connect, attempting again in 10 secs.");
      if(logging){
        logger.debug(error);
      }
      setTimeout(() => maintainConnection(ip, port, password, logging), 10000);
    }
  }
}
