import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { initLogger, logger } from "./logger";
import { setupFrontendListeners } from "./firebot/communicator";
import { ChangeSceneEffectType } from "./firebot/effects/change-scene-effect-type";
import { ChangeSceneCollectionEffectType } from "./firebot/effects/change-scene-collection";
import { OBSEventSource } from "./firebot/events/obs-event-source";
import { SceneNameVariable } from "./firebot/variables/scene-name-variable";
import { SceneCollectionNameVariable } from "./firebot/variables/scene-collection-name-variable";
import { SceneNameEventFilter } from "./firebot/filters/scene-name-filter";
import { ToggleSourceVisibilityEffectType } from "./firebot/effects/toggle-obs-source-visibility";
import { ToggleSourceFilterEffectType } from "./firebot/effects/toggle-obs-source-filter";
import { StartStreamEffectType } from "./firebot/effects/start-stream";
import { StopStreamEffectType } from "./firebot/effects/stop-stream";
import { StartVirtualCamEffectType } from "./firebot/effects/start-virtual-cam";
import { StopVirtualCamEffectType } from "./firebot/effects/stop-virtual-cam";
import { ToggleSourceMutedEffectType } from "./firebot/effects/toggle-obs-source-muted";
import { getObsIntegration } from "./firebot/obs-integration";

const script: Firebot.CustomScript = {
  getScriptManifest: () => {
    return {
      name: "OBS Control",
      description:
        "Adds an OBS integration that allows Firebot to control OBS. Configure in the Integrations settings tab.",
      author: "ebiggz",
      version: "2.0.0-beta2",
      firebotVersion: "5",
      startupOnly: true,
    };
  },
  getDefaultParameters: () => {
    return {};
  },
  run: ({ modules }) => {
    initLogger(modules.logger);

    logger.info("Starting OBS Control...");

    const {
      effectManager,
      eventManager,
      frontendCommunicator,
      replaceVariableManager,
      eventFilterManager,
      integrationManager,
    } = modules;

    setupFrontendListeners(frontendCommunicator);

    const obsIntegration = getObsIntegration(eventManager);
    integrationManager.registerIntegration(obsIntegration);

    effectManager.registerEffect(ChangeSceneEffectType);
    effectManager.registerEffect(ChangeSceneCollectionEffectType);
    effectManager.registerEffect(ToggleSourceVisibilityEffectType);
    effectManager.registerEffect(ToggleSourceFilterEffectType);
    effectManager.registerEffect(ToggleSourceMutedEffectType);
    effectManager.registerEffect(StartStreamEffectType);
    effectManager.registerEffect(StopStreamEffectType);
    effectManager.registerEffect(StartVirtualCamEffectType);
    effectManager.registerEffect(StopVirtualCamEffectType);

    eventManager.registerEventSource(OBSEventSource);

    eventFilterManager.registerFilter(SceneNameEventFilter);

    replaceVariableManager.registerReplaceVariable(SceneNameVariable);
    replaceVariableManager.registerReplaceVariable(SceneCollectionNameVariable);
  },
};

export default script;
