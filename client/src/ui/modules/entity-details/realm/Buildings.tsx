import { ReactComponent as ArrowRight } from "@/assets/icons/common/arrow-right.svg";
import { TileManager } from "@/dojo/modelManager/TileManager";
import { useDojo } from "@/hooks/context/DojoContext";
import { Building, useBuildings } from "@/hooks/helpers/use-buildings";
import { useGetRealm } from "@/hooks/helpers/useRealm";
import useUIStore from "@/hooks/store/useUIStore";
import { BUILDING_IMAGES_PATH } from "@/ui/config";
import Button from "@/ui/elements/Button";
import { ResourceIcon } from "@/ui/elements/ResourceIcon";
import { toHexString } from "@/ui/utils/utils";
import { BuildingType, ResourcesIds } from "@bibliothecadao/eternum";
import clsx from "clsx";
import { useState } from "react";

export const Buildings = ({ structure }: { structure: any }) => {
  const dojo = useDojo();

  const structureEntityId = useUIStore((state) => state.structureEntityId);

  const [showEconomy, setShowEconomy] = useState(false);
  const [showResource, setShowResource] = useState(false);
  const [showMilitary, setShowMilitary] = useState(false);
  const [isLoading, setIsLoading] = useState({ isLoading: false, innerCol: 0, innerRow: 0 });

  const realm = useGetRealm(structureEntityId).realm;

  const { getBuildings } = useBuildings();
  const buildings = getBuildings(realm.position.x, realm.position.y);

  const economyBuildings = buildings.filter(
    (building) =>
      building.category === BuildingType[BuildingType.Farm] ||
      building.category === BuildingType[BuildingType.FishingVillage],
  );

  const resourceBuildings = buildings.filter((building) => building.category === BuildingType[BuildingType.Resource]);

  const militaryBuildings = buildings.filter(
    (building) =>
      building.category === BuildingType[BuildingType.Barracks] ||
      building.category === BuildingType[BuildingType.ArcheryRange] ||
      building.category === BuildingType[BuildingType.Stable],
  );

  const isOwner = toHexString(realm.owner) === dojo.account.account.address;

  const handlePauseResumeProduction = (paused: boolean, innerCol: number, innerRow: number) => {
    setIsLoading({ isLoading: true, innerCol, innerRow });
    const tileManager = new TileManager(dojo.setup, {
      col: structure.position!.x,
      row: structure.position!.y,
    });

    const action = paused ? tileManager.resumeProduction : tileManager.pauseProduction;
    action(innerCol, innerRow).then(() => {
      setIsLoading({ isLoading: false, innerCol, innerRow });
    });
  };

  return (
    <div className="w-full text-sm p-3">
      {/* Economy Section */}
      <div className="mb-4">
        <div
          className={clsx("flex items-center cursor-pointer mb-2", {
            "pointer-events-none opacity-50": !economyBuildings.length,
          })}
          onClick={() => setShowEconomy(!showEconomy)}
        >
          <div className="text-lg font-bold">Economy</div>
          <span className="ml-2">
            <ArrowRight className={`w-2 fill-gold transform transition-transform ${showEconomy ? "rotate-90" : ""}`} />
          </span>
        </div>

        {showEconomy &&
          economyBuildings.map((building, index) => (
            <BuildingRow
              key={`economy-${index}`}
              building={building}
              isOwner={isOwner}
              isLoading={isLoading}
              handlePauseResumeProduction={handlePauseResumeProduction}
            />
          ))}
      </div>

      {/* Resource Section */}
      <div className="mb-4">
        <div
          className={clsx("flex items-center cursor-pointer mb-2", {
            "pointer-events-none opacity-50": !resourceBuildings.length,
          })}
          onClick={() => setShowResource(!showResource)}
        >
          <div className="text-lg font-bold">Resource</div>
          <span className="ml-2">
            <ArrowRight className={`w-2 fill-gold transform transition-transform ${showResource ? "rotate-90" : ""}`} />
          </span>
        </div>
        {showResource &&
          resourceBuildings.map((building, index) => (
            <BuildingRow
              key={`resource-${index}`}
              building={building}
              isOwner={isOwner}
              isLoading={isLoading}
              handlePauseResumeProduction={handlePauseResumeProduction}
            />
          ))}
      </div>

      {/* Military Section */}
      <div className="mb-4">
        <div
          className={clsx("flex items-center cursor-pointer mb-2", {
            "pointer-events-none opacity-50": !militaryBuildings.length,
          })}
          onClick={() => {
            setShowMilitary(!showMilitary);
          }}
        >
          <div className="text-lg font-bold">Military</div>
          <span className="ml-2">
            <ArrowRight className={`w-2 fill-gold transform transition-transform ${showMilitary ? "rotate-90" : ""}`} />
          </span>
        </div>
        {showMilitary &&
          militaryBuildings.map((building, index) => (
            <BuildingRow
              key={`military-${index}`}
              building={building}
              isOwner={isOwner}
              isLoading={isLoading}
              handlePauseResumeProduction={handlePauseResumeProduction}
            />
          ))}
      </div>
    </div>
  );
};

const BuildingsHeader = () => {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gold tracking-wider uppercase">
      <div className=""></div>
      <div className="text-center">Produces /s</div>
      <div className="text-center">Consumes /s</div>
    </div>
  );
};

interface BuildingRowProps {
  building: Building;
  isOwner: boolean;
  isLoading: { isLoading: boolean; innerCol: number; innerRow: number };
  handlePauseResumeProduction: (paused: boolean, innerCol: number, innerRow: number) => void;
}
const BuildingRow = ({ building, isOwner, isLoading, handlePauseResumeProduction }: BuildingRowProps) => {
  console.log(building.category);
  return (
    <div className="flex flex-col p-2 mb-4 text-md rounded transition-colors border border-gold/10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <img
            className="w-24 bg-brown/40 rounded-xl p-1"
            src={BUILDING_IMAGES_PATH[BuildingType[building.category as any] as keyof typeof BUILDING_IMAGES_PATH]}
          />
          <h4 className="text-lg font-medium">{building.name}</h4>
        </div>

        {isOwner && (
          <Button
            onClick={() => handlePauseResumeProduction(building.paused, building.innerCol, building.innerRow)}
            isLoading={
              isLoading.isLoading &&
              isLoading.innerCol === building.innerCol &&
              isLoading.innerRow === building.innerRow
            }
            variant="outline"
            withoutSound
          >
            {building.paused ? "Resume Production" : "Pause Production"}
          </Button>
        )}
      </div>

      {!building.paused && (
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-green font-medium">
              +{(building.produced.amount * (1 + building.bonusPercent / 10000)).toFixed(1)}
            </p>
            <ResourceIcon resource={ResourcesIds[building.produced.resource]} size={"sm"} />
            {building.bonusPercent !== 0 && <p className="text-green text-sm">(+{building.bonusPercent / 100}%)</p>}
          </div>

          <div className="flex items-center space-x-4">
            {building.consumed.map((resource, index) => (
              <div key={index} className="flex items-center space-x-1">
                <p className="text-light-red font-medium">-{resource.amount}</p>
                <ResourceIcon resource={ResourcesIds[resource.resource]} size={"sm"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
