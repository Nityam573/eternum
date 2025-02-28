import { LeaderboardManager } from "@/dojo/modelManager/LeaderboardManager";
import { useDojo } from "@/hooks/context/DojoContext";
import { useHyperstructureUpdates } from "@/hooks/helpers/useHyperstructures";
import { useRealm } from "@/hooks/helpers/useRealm";
import useUIStore from "@/hooks/store/useUIStore";
import Button from "@/ui/elements/Button";
import { OrderIcon } from "@/ui/elements/OrderIcon";
import { SortButton, SortInterface } from "@/ui/elements/SortButton";
import { SortPanel } from "@/ui/elements/SortPanel";
import { currencyIntlFormat, displayAddress, getEntityIdFromKeys } from "@/ui/utils/utils";
import { ContractAddress, getOrderName, ID } from "@bibliothecadao/eternum";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, HasValue } from "@dojoengine/recs";
import { useMemo, useState } from "react";

export const Leaderboard = ({
  hyperstructureEntityId,
  setSelectedTab,
}: {
  hyperstructureEntityId: ID;
  setSelectedTab: (tab: number) => void;
}) => {
  const {
    account: { account },
    setup: {
      components: { Owner },
    },
  } = useDojo();

  const nextBlockTimestamp = useUIStore((state) => state.nextBlockTimestamp);
  const { getAddressName } = useRealm();

  const playerPointsLeaderboard = useMemo(() => {
    return LeaderboardManager.instance().getPlayersByRank(nextBlockTimestamp || 0, hyperstructureEntityId);
  }, [nextBlockTimestamp, hyperstructureEntityId]);

  const hyperstructure = useHyperstructureUpdates(hyperstructureEntityId);

  const sortingParams = useMemo(() => {
    return [
      { label: "Name", sortKey: "name", className: "" },
      { label: "Address", sortKey: "address", className: "" },
      { label: "Points", sortKey: "points", className: "flex justify-end" },
    ];
  }, []);

  const [activeSort, setActiveSort] = useState<SortInterface>({
    sortKey: "number",
    sort: "none",
  });

  const isOwner = useMemo(() => {
    const owner = getComponentValue(Owner, getEntityIdFromKeys([BigInt(hyperstructureEntityId)]));
    if (!owner) return false;
    return ContractAddress(owner.address) === ContractAddress(account.address);
  }, [hyperstructureEntityId]);

  return hyperstructure ? (
    <>
      <SortPanel className="px-3 py-2 grid grid-cols-3">
        {sortingParams.map(({ label, sortKey, className }) => (
          <SortButton
            className={className}
            key={sortKey}
            label={label}
            sortKey={sortKey}
            activeSort={activeSort}
            onChange={(_sortKey, _sort) => {
              setActiveSort({
                sortKey: _sortKey,
                sort: _sort,
              });
            }}
          />
        ))}
      </SortPanel>
      {playerPointsLeaderboard.map(([address, points], index) => {
        const playerName = getAddressName(address) || "Player not found";

        const isOwner = address === ContractAddress(account.address);

        return (
          <div key={index} className={`flex mt-1 ${isOwner ? "bg-green/20" : ""} text-xxs text-gold`}>
            <div className={`flex relative group items-center text-xs px-2 p-1 w-full`}>
              <div className="flex w-full grid grid-cols-3">
                <div className="text-sm font-bold">{playerName}</div>
                <div className=" text-sm font-bold">{displayAddress(address.toString(16))}</div>
                <div className="text-right">{currencyIntlFormat(points)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  ) : isOwner ? (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <Button onClick={() => setSelectedTab(1)}>Set first co-owners</Button>
    </div>
  ) : (
    <div className="w-full h-full flex flex-col justify-center items-center">Owner hasn't set first co-owners yet</div>
  );
};
