import { configManager } from "@/dojo/setup";
import { useResourceBalance } from "@/hooks/helpers/useResources";
import { useQuestStore } from "@/hooks/store/useQuestStore";
import useUIStore from "@/hooks/store/useUIStore";
import { QuestId } from "@/ui/components/quest/questDetails";
import { Headline } from "@/ui/elements/Headline";
import { ResourceCost } from "@/ui/elements/ResourceCost";
import { multiplyByPrecision } from "@/ui/utils/utils";
import { ID, ResourcesIds, StructureType } from "@bibliothecadao/eternum";
import clsx from "clsx";
import React from "react";
import { StructureCard } from "./StructureCard";

const STRUCTURE_IMAGE_PREFIX = "/images/buildings/thumb/";
export const STRUCTURE_IMAGE_PATHS = {
  [StructureType.Bank]: STRUCTURE_IMAGE_PREFIX + "mine.png",
  [StructureType.Settlement]: STRUCTURE_IMAGE_PREFIX + "mine.png",
  [StructureType.Hyperstructure]: STRUCTURE_IMAGE_PREFIX + "hyperstructure.png",
  [StructureType.Realm]: STRUCTURE_IMAGE_PREFIX + "mine.png",
  [StructureType.FragmentMine]: STRUCTURE_IMAGE_PREFIX + "mine.png",
};

export const StructureConstructionMenu = ({ className, entityId }: { className?: string; entityId: number }) => {
  const setPreviewBuilding = useUIStore((state) => state.setPreviewBuilding);
  const previewBuilding = useUIStore((state) => state.previewBuilding);

  const selectedQuest = useQuestStore((state) => state.selectedQuest);

  const { getBalance } = useResourceBalance();

  const buildingTypes = Object.keys(StructureType)
    .filter((key) => isNaN(Number(key)))
    .filter(
      (key) => key !== "None" && key !== "Realm" && key !== "FragmentMine" && key !== "Bank" && key !== "Settlement",
    ) as string[];

  const checkBalance = (cost: any) =>
    Object.keys(cost).every((resourceId) => {
      const resourceCost = cost[Number(resourceId)];
      const balance = getBalance(entityId, resourceCost.resource);
      return balance.balance >= multiplyByPrecision(resourceCost.amount);
    });

  return (
    <div className={`${className} grid grid-cols-2 gap-2 p-2`}>
      {buildingTypes.map((structureType, index) => {
        const building = StructureType[structureType as keyof typeof StructureType];

        // if is hyperstructure, the construction cost are only fragments
        const isHyperstructure = building === StructureType["Hyperstructure"];
        const cost = configManager.structureCosts[building].filter(
          (cost) => !isHyperstructure || cost.resource === ResourcesIds.AncientFragment,
        );

        const hasBalance = checkBalance(cost);

        return (
          <StructureCard
            className={clsx({ "animate-pulse": isHyperstructure && selectedQuest?.id === QuestId.Hyperstructure })}
            key={index}
            structureId={building}
            onClick={() => {
              if (!hasBalance) {
                return;
              }
              if (previewBuilding && previewBuilding.type === building) {
                setPreviewBuilding(null);
              } else {
                setPreviewBuilding({ type: building });
              }
            }}
            active={previewBuilding !== null && previewBuilding.type === building}
            name={StructureType[building]}
            toolTip={<StructureInfo structureId={building} entityId={entityId} />}
            canBuild={hasBalance}
          />
        );
      })}
    </div>
  );
};

const StructureInfo = ({
  structureId,
  entityId,
  extraButtons = [],
}: {
  structureId: number;
  entityId: ID | undefined;
  extraButtons?: React.ReactNode[];
}) => {
  // if is hyperstructure, the construction cost are only fragments
  const isHyperstructure = structureId === StructureType["Hyperstructure"];
  const cost = configManager.structureCosts[structureId].filter(
    (cost) => !isHyperstructure || cost.resource === ResourcesIds.AncientFragment,
  );

  const perTick =
    structureId == StructureType.Hyperstructure
      ? `+${configManager.getHyperstructureConfig().pointsPerCycle} points`
      : "";

  const { getBalance } = useResourceBalance();

  return (
    <div className="p-2 text-sm text-gold">
      <Headline className="pb-3"> {StructureType[structureId]} </Headline>

      {perTick !== "" && (
        <div className=" flex flex-wrap">
          <div className="font-bold uppercase w-full text-xs">Produces </div>
          <div className="flex justify-between">{perTick}/per tick</div>
        </div>
      )}

      <div className="pt-3 font-bold uppercase text-xs"> One time cost</div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        {Object.keys(cost).map((resourceId, index) => {
          const balance = getBalance(entityId || 0, cost[Number(resourceId)].resource);
          return (
            <ResourceCost
              key={index}
              type="horizontal"
              resourceId={cost[Number(resourceId)].resource}
              amount={cost[Number(resourceId)].amount}
              balance={balance.balance}
            />
          );
        })}
      </div>
      <div className="flex justify-center">{...extraButtons}</div>
    </div>
  );
};
