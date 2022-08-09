import { initRemote } from "../obs-remote";
import { TypedEmitter } from "tiny-typed-emitter";
import { EventManager } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";
import {
  Integration,
  IntegrationController,
  IntegrationData,
  IntegrationEvents,
} from "@crowbartools/firebot-custom-scripts-types";

type ObsSettings = {
  websocketSettings: {
    ipAddress: string;
    port: number;
    password: string;
  };
  misc: {
    logging: boolean;
  };
};

class IntegrationEventEmitter extends TypedEmitter<IntegrationEvents> {}

class ObsIntegration
  extends IntegrationEventEmitter
  implements IntegrationController<ObsSettings>
{
  connected = false;

  constructor(private readonly eventManager: EventManager) {
    super();
  }

  private setupConnection(settings?: ObsSettings) {
    if (!settings) {
      return;
    }
    const {
      websocketSettings: { ipAddress, password, port },
      misc: { logging },
    } = settings;
    initRemote(
      {
        ip: ipAddress,
        port,
        password,
        logging,
        forceConnect: true,
      },
      {
        eventManager: this.eventManager,
      }
    );
  }

  init(
    linked: boolean,
    integrationData: IntegrationData<ObsSettings>
  ): void | PromiseLike<void> {
    this.setupConnection(integrationData.userSettings);
  }

  onUserSettingsUpdate?(
    integrationData: IntegrationData<ObsSettings>
  ): void | PromiseLike<void> {
    this.setupConnection(integrationData.userSettings);
  }
}

export const getObsIntegration = (
  eventManager: EventManager
): Integration<ObsSettings> => ({
  definition: {
    id: "OBS",
    name: "OBS",
    description:
      "Connect to OBS to allow Firebot to change scenes, toggle sources and filters, and much more. Requires OBS 28+ or the obs-websocket v5 plugin.",
    linkType: "none",
    configurable: true,
    connectionToggle: false,
    settingCategories: {
      websocketSettings: {
        title: "Websocket Settings",
        sortRank: 1,
        settings: {
          ipAddress: {
            title: "IP Address",
            description:
              "The ip address of the computer running OBS. Use 'localhost' for the same computer.",
            type: "string",
            default: "localhost",
          },
          port: {
            title: "Port",
            description:
              "Port the OBS Websocket is running on. Default is 4455.",
            type: "number",
            default: 4455,
          },
          password: {
            title: "Password",
            description: "The password set for the OBS Websocket.",
            type: "password",
            default: "",
          },
        },
      },
      misc: {
        title: "Misc",
        sortRank: 2,
        settings: {
          logging: {
            title: "Enable logging for OBS Errors",
            type: "boolean",
            default: true,
          },
        },
      },
    },
  },
  integration: new ObsIntegration(eventManager),
});
