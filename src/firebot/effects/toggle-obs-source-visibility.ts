import { Firebot } from "firebot-custom-scripts-types";
import {
  getSourceVisibility,
  setSourceVisibility,
  SourceData,
} from "../../obs-remote";

export const ToggleSourceVisibilityEffectType: Firebot.EffectType<{
  sources: Record<number, boolean | "toggle">;
}> = {
  definition: {
    id: "ebiggz:obs-toggle-source-visibility",
    name: "Toggle OBS Source Visibility",
    description: "Toggle an OBS source's visibility",
    icon: "fad fa-clone",
    categories: ["common"],
  },
  optionsTemplate: `
    <eos-container header="Sources">
      <div ng-if="sourceData != null" ng-repeat="sceneName in getSceneNames()">
        <div style="font-size: 16px;font-weight: 900;color: #b9b9b9;margin-bottom: 5px;">{{sceneName}}</div>
        <div ng-repeat="source in getSources(sceneName)">
          <label  class="control-fb control--checkbox">{{source.name}}
              <input type="checkbox" ng-click="toggleSourceSelected(source.id)" ng-checked="sourceIsSelected(source.id)"  aria-label="..." >
              <div class="control__indicator"></div>
          </label>
          <div ng-show="sourceIsSelected(source.id)" style="margin-bottom: 15px;">
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                {{getSourceActionDisplay(source.id)}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem" ng-click="setSourceActionDisplay(source.id, true)"><a href>Show</a></li>
                    <li role="menuitem" ng-click="setSourceActionDisplay(source.id, false)"><a href>Hide</a></li>
                    <li role="menuitem" ng-click="setSourceActionDisplay(source.id, 'toggle')"><a href>Toggle</a></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
      <div ng-if="sourceData == null" class="muted">
        No sources found. Is OBS running?
      </div>
      <p>
          <button class="btn btn-link" ng-click="getSourceData()">Refresh Source Data</button>
      </p>
    </eos-container>
  `,
  optionsController: ($scope: any, backendCommunicator: any, $q: any) => {
    $scope.sourceData = null;

    $scope.sceneNames = [];

    if ($scope.effect.sources == null) {
      $scope.effect.sources = {};
    }

    $scope.getSources = (sceneName: string) => {
      return $scope.sourceData ? $scope.sourceData[sceneName] : [];
    };

    $scope.getSceneNames = () => {
      return $scope.sourceData ? Object.keys($scope.sourceData) : [];
    };

    $scope.sourceIsSelected = (sourceId: number) => {
      return $scope.effect.sources[sourceId] != null;
    };

    $scope.toggleSourceSelected = (sourceId: number) => {
      if ($scope.sourceIsSelected(sourceId)) {
        delete $scope.effect.sources[sourceId];
      } else {
        $scope.effect.sources[sourceId] = true;
      }
    };

    $scope.setSourceActionDisplay = (
      sourceId: number,
      action: "toggle" | boolean
    ) => {
      $scope.effect.sources[sourceId] = action;
    };

    $scope.getSourceActionDisplay = (sourceId: number) => {
      const action = $scope.effect.sources[sourceId];
      if (action === "toggle") {
        return "Toggle";
      }
      if (action === true) {
        return "Show";
      }
      return "Hide";
    };

    $scope.getSourceData = () => {
      $q.when(backendCommunicator.fireEventAsync("obs-get-source-data")).then(
        (sourceData: SourceData) => {
          $scope.sourceData = sourceData ?? null;
        }
      );
    };
    $scope.getSourceData();
  },
  optionsValidator: () => {
    return [];
  },
  onTriggerEvent: async ({ effect }) => {
    if (effect.sources == null) return true;

    const sources = Object.entries(effect.sources);

    for (const [sourceIdKey, action] of sources) {
      const sourceId = parseInt(sourceIdKey);

      let newVisibility;
      if (action === "toggle") {
        const currentVisibility = await getSourceVisibility(sourceId);
        if (currentVisibility == null) continue;
        newVisibility = !currentVisibility;
      } else {
        newVisibility = action === true;
      }

      await setSourceVisibility(sourceId, newVisibility);
    }

    return true;
  },
};
