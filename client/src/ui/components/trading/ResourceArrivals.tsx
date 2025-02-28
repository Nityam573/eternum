import { useDojo } from "@/hooks/context/DojoContext";
import { ArrivalInfo } from "@/hooks/helpers/use-resource-arrivals";
import Button from "@/ui/elements/Button";
import { Headline } from "@/ui/elements/Headline";
import { HintModalButton } from "@/ui/elements/HintModalButton";
import { ID } from "@bibliothecadao/eternum";
import { useState } from "react";
import { Entity } from "../entities/Entity";
import { HintSection } from "../hints/HintModal";

export type EntityReadyForDeposit = {
  carrierId: ID;
  senderEntityId: ID;
  recipientEntityId: ID;
  resources: bigint[];
};

export const AllResourceArrivals = ({ arrivals, className }: { arrivals: ArrivalInfo[]; className?: string }) => {
  const { account, setup } = useDojo();

  const [entitiesReadyForDeposit, setEntitiesReadyForDeposit] = useState<EntityReadyForDeposit[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const onOffload = async () => {
    setIsLoading(true);
    await setup.systemCalls
      .send_resources_multiple({
        calls: entitiesReadyForDeposit
          .filter((entity) => arrivals.some((arrival) => arrival.entityId === entity.carrierId))
          .map((entity) => ({
            sender_entity_id: entity.senderEntityId,
            recipient_entity_id: entity.recipientEntityId,
            resources: entity.resources,
          })),
        signer: account.account,
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className={`p-2 flex flex-col space-y-1 overflow-y-auto gap-2 ${className ? className : ""}`}>
      <Headline>
        <div className="flex gap-2">
          <div className="self-center">Transfers</div>
          <HintModalButton section={HintSection.Transfers} />
        </div>
      </Headline>
      <Button
        size="xs"
        className="w-20 mx-auto"
        isLoading={isLoading}
        onClick={onOffload}
        variant="primary"
        disabled={isLoading || entitiesReadyForDeposit.length === 0}
      >
        {isLoading ? "Offloading..." : "Deposit All"}
      </Button>
      {!arrivals.length && <div className="text-center">No resource arrivals yet.</div>}
      {arrivals.map((arrival) => {
        return (
          <Entity
            setEntitiesReadyForDeposit={setEntitiesReadyForDeposit}
            key={arrival.entityId}
            entityId={arrival.entityId}
          />
        );
      })}
    </div>
  );
};
