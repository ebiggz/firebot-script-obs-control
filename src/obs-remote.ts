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

export async function setCurrentScene(sceneName: string): Promise<void> {
  if (!connected) return;
  try {
    await obs.send("SetCurrentScene", {
      "scene-name": sceneName,
    });
  } catch (error) {
    console.log("Failed to set current scene", error);
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
