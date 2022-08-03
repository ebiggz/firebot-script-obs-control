import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import OBSWebSocket, {OBSResponseTypes } from "obs-websocket-js";
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
    const sceneData = await obs.call("GetSceneList");
    return sceneData.scenes.map((s: any) => s.name);
  } catch (error) {
    return [];
  }
}

export async function getCurrentSceneName(): Promise<string> {
  if (!connected) return null;
  try {
    const scene = await obs.call("GetCurrentProgramScene");
    return scene?.currentProgramSceneName;
  } catch (error) {
    return null;
  }
}

export async function setCurrentScene(sceneName: string): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("SetCurrentProgramScene", {
      sceneName
    });
  } catch (error) {
    logger.error("Failed to set current scene", error);
  }
}

export async function getSceneCollectionList(): Promise<string[]> {
  if (!connected) return [];
  try {
    const sceneCollectionData = await obs.call("GetSceneCollectionList");
    return sceneCollectionData.sceneCollections;
  } catch (error) {
    return [];
  }
}

export async function getCurrentSceneCollectionName(): Promise<string> {
  if (!connected) return null;
  try {
    const response = await obs.call("GetSceneCollectionList");
    return response?.currentSceneCollectionName;
  } catch (error) {
    return null;
  }
}

export async function setCurrentSceneCollection(sceneCollectionName: string): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("SetCurrentSceneCollection", {
      sceneCollectionName
    });
  } catch (error) {
    logger.error("Failed to set current scene collection", error);
  }
}

export type SourceData = Record<string, Array<{ id: number; name: string }>>;

export async function getSourceData(): Promise<SourceData> {
  if (!connected) return null;
  try {
    const sceneData = await obs.call("GetSceneList");
    return (sceneData.scenes as any[]).reduce((acc, current) => {
      acc[current.name] = current.sources.map((si: any) => ({
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
    const sceneItemProperties = await obs.call("GetSceneItemEnabled", {
      sceneName,
      sceneItemId: sourceId
    });
    return sceneItemProperties?.sceneItemEnabled;
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
    await obs.call("SetSceneItemEnabled", {
      sceneItemEnabled: visible,
      sceneName,
      sceneItemId: sourceId
    });
  } catch (error) {
    logger.error("Failed to set scene item properties", error);
  }
}

type OBSFilter = {
  filterName: string;
  filterEnabled: boolean;
  filterIndex: number;
  filterKind: string;
  filterSettings: any;
};

export type OBSSource = {
  sceneItemId: string;
  sceneItemIndex: number;
  sourceName: string;
  sourceType: string; 
  inputKind?: string;
  isGroup?: boolean;
  filters: Array<OBSFilter>;
};

export async function getAllSources(): Promise<Array<OBSSource>> {
  if (!connected) return null;
  try {
    const sourceListData = await obs.call("GetSceneItemList");
    if(sourceListData?.sceneItems == null) {
      return null;
    }
    let sources = (sourceListData.sceneItems as unknown) as Array<OBSSource>;
    const sceneNameList = await getSceneList();
    sources = sources.concat(
      sceneNameList.map(
        (s) => ({ sourceName: s, filters: [], sourceType: "scene", inputKind: "scene" } as OBSSource)
      )
    );
    for (const source of sources) {
      const sourceFiltersData = await obs.call("GetSourceFilterList", {
        sourceName: source.sourceName,
      });
      source.filters = (sourceFiltersData.filters as unknown) as Array<OBSFilter>;
    }
    return sources;
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
    const filterInfo = await obs.call("GetSourceFilter", {
      sourceName,
      filterName,
    });
    return filterInfo?.filterEnabled;
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
    await obs.call("SetSourceFilterEnabled", {
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
    const sourceTypes = await obs.call("GetInputKindList");
    return sourceTypes.inputKinds;
  } catch(error) {
    logger.error("Failed to get source types list", error);
    return [];
  }
}

export async function getAudioSources(): Promise<Array<OBSSource>> {
  const sourceTypes = await getSourceTypes();
  const sources = await getAllSources();
  return sources.filter((s) => {
    return false;
  });
}

export async function toggleSourceMuted(sourceName: string) {
  try {
    await obs.call("ToggleInputMute", {
      inputName: sourceName
    })
  } catch(error) {
    logger.error("Failed to toggle mute for source", error);
  }
}

export async function setSourceMuted(sourceName: string, muted: boolean) {
  try {
    await obs.call("SetInputMute", {
      inputName: sourceName,
      inputMuted: muted
    })
  } catch(error) {
    logger.error("Failed to set mute for source", error);
  }
}

export async function getStreamingStatus(): Promise<boolean> {
  if (!connected) return false;
  try {
    const streamingStatus = await obs.call("GetStreamStatus");
    return streamingStatus.outputActive;
  } catch (error) {
    logger.error("Failed to get streaming status", error);
    return false;
  }
}

export async function startStreaming(): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("StartStream");
  } catch (error) {
    logger.error("Failed to start streaming", error);
    return;
  }
}

export async function stopStreaming(): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("StopStream");
  } catch (error) {
    logger.error("Failed to stop streaming", error);
    return;
  }
}

export async function startVirtualCam(): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("StartVirtualCam");
  } catch (error) {
    logger.error("Failed to start virtual camera", error);
    return;
  }
}

export async function stopVirtualCam(): Promise<void> {
  if (!connected) return;
  try {
    await obs.call("StopVirtualCam");
  } catch (error) {
    logger.error("Failed to stop virtual camera", error);
    return;
  }
}

function setupRemoteListeners() {
  obs.on("CurrentProgramSceneChanged", ({sceneName}) => {
    eventManager?.triggerEvent(
      OBS_EVENT_SOURCE_ID,
      OBS_SCENE_CHANGED_EVENT_ID,
      {
        sceneName,
      }
    );
  });

  obs.on("StreamStateChanged", ({outputActive}) => {
    if(outputActive) {
      eventManager?.triggerEvent(
        OBS_EVENT_SOURCE_ID,
        OBS_STREAM_STARTED_EVENT_ID,
        {}
      );
    } else {
      eventManager?.triggerEvent(
        OBS_EVENT_SOURCE_ID,
        OBS_STREAM_STOPPED_EVENT_ID,
        {}
      );
    }
  });
}

async function maintainConnection(ip: string, port: number, password: string, logging: Boolean) {
  if (!connected) {
    try {
      if (logging){
        logger.debug("Trying to connect to OBS...");
      }

      obs.removeAllListeners();

      await obs.connect(`ws://${ip}:${port}`, password);

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
