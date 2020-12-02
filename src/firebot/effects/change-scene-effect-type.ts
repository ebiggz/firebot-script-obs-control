import { Firebot } from "firebot-custom-scripts-types";
import { setCurrentScene } from "../../obs-remote";

export const ChangeSceneEffectType: Firebot.EffectType<{
  sceneName: string;
}> = {
  definition: {
    id: "ebiggz:obs-change-scene",
    name: "Change OBS Scene",
    description: "Change the active OBS Scene",
    icon: "fad fa-tv",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="New Scene">
        <dropdown-select options="scenes" selected="effect.sceneName"></dropdown-select>
        <p>
            <button class="btn btn-link" ng-click="getScenes()">Refresh Scenes</button>
            <span class="muted">(Make sure OBS is running)</span>
        </p>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.scenes = [];
    $scope.getScenes = () => {
      $q.when(backendCommunicator.fireEventAsync("obs-get-scene-list")).then(
        (scenes: string[]) => {
          $scope.scenes = scenes ?? [];
        }
      );
    };
    $scope.getScenes();
  },
  optionsValidator: (effect) => {
    if (effect.sceneName == null) {
      return ["Please select a scene."];
    }
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    await setCurrentScene(effect.sceneName);
    return true;
  },
};
