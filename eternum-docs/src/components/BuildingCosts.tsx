import { BuildingType, EternumGlobalConfig, findResourceById, ResourcesIds } from "@bibliothecadao/eternum";
import { formatNumberWithSpaces } from "../utils/formatting";
import ResourceIcon from "./ResourceIcon";

type Props = {
  buildingType: BuildingType;
};

export default function BuildingCosts({ buildingType }: Props) {
  const costs = EternumGlobalConfig.buildings.buildingCosts[buildingType];
  const resourceCostsWheat = EternumGlobalConfig.resources.resourceBuildingCosts[ResourcesIds.Wood];
  const resourceCostsFish = EternumGlobalConfig.resources.resourceBuildingCosts[ResourcesIds.Stone];

  if (buildingType === BuildingType.Resource) {
    return (
      <div className="my-4 p-3 ">
        <div className="font-bold mb-2">Building costs:</div>
        <div className="flex flex-row items-center gap-4">
          {resourceCostsWheat.map((cost) => {
            const resource = findResourceById(cost.resource);
            return (
              <div key={cost.resource} className="flex items-center gap-1 px-2 py-1.5 rounded-md">
                <ResourceIcon size={24} id={cost.resource} name={resource?.trait || ""} />
                <span className="font-medium">{formatNumberWithSpaces(cost.amount)}K</span>
              </div>
            );
          })}
          <span className="">or</span>
          {resourceCostsFish.map((cost) => {
            const resource = findResourceById(cost.resource);
            return (
              <div key={cost.resource} className="flex items-center gap-1 px-2 py-1.5 rounded-md">
                <ResourceIcon size={24} id={cost.resource} name={resource?.trait || ""} />
                <span className="font-medium">{formatNumberWithSpaces(cost.amount)}K</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (costs.length === 0) return null;

  return (
    <div className="my-4 p-3 ">
      <div className="font-bold mb-2">Building costs:</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {costs.map((cost) => {
          const resource = findResourceById(cost.resource);
          return (
            <div key={cost.resource} className="flex items-center gap-1 px-2 py-1.5 rounded-md">
              <ResourceIcon size={24} id={cost.resource} name={resource?.trait || ""} />
              <span className="font-medium">{formatNumberWithSpaces(cost.amount)}K</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
