import { useDojo } from "@/hooks/context/DojoContext";
import { Quest, QuestStatus } from "@/hooks/helpers/useQuests";
import { useRealm } from "@/hooks/helpers/useRealm";
import { useQuestStore } from "@/hooks/store/useQuestStore";
import Button from "@/ui/elements/Button";
import { Headline } from "@/ui/elements/Headline";
import { ResourceCost } from "@/ui/elements/ResourceCost";
import { ID } from "@bibliothecadao/eternum";
import { useEffect, useMemo, useState } from "react";
import { areAllQuestsClaimed, groupQuestsByDepth } from "./utils";

export const QuestList = ({ quests, entityId }: { quests: Quest[]; entityId: ID | undefined }) => {
  const showCompletedQuests = useQuestStore((state) => state.showCompletedQuests);
  const setShowCompletedQuests = useQuestStore((state) => state.setShowCompletedQuests);

  const [skipTutorial, setSkipTutorial] = useState(false);
  const [maxDepthToShow, setMaxDepthToShow] = useState(0);

  const groupedQuests = useMemo(() => groupQuestsByDepth(quests), [quests]);
  const unclaimedQuests = quests?.filter((quest) => quest.status !== QuestStatus.Claimed);

  useEffect(() => {
    const newMaxDepth = Object.keys(groupedQuests)
      .map(Number)
      .reduce((max, depth) => {
        if (areAllQuestsClaimed(groupedQuests[depth]) && depth + 1 > max) {
          return depth + 1;
        }
        return max;
      }, 0);
    setMaxDepthToShow(newMaxDepth);
  }, [quests, groupedQuests]);

  return (
    <>
      <div className="flex justify-around m-2">
        <Button className={"w-1/4"} variant="outline" onClick={() => setShowCompletedQuests(!showCompletedQuests)}>
          {showCompletedQuests ? "Hide Completed" : "Show Completed"}
        </Button>

        <Button
          disabled={!Boolean(unclaimedQuests?.length)}
          className={"w-1/4"}
          variant="primary"
          onClick={() => setSkipTutorial(!skipTutorial)}
        >
          Skip Tutorial
        </Button>
      </div>

      {skipTutorial && unclaimedQuests?.length && (
        <SkipTutorial entityId={entityId!} setSkipTutorial={setSkipTutorial} unclaimedQuests={unclaimedQuests} />
      )}

      <div className="p-4 grid grid-cols-1  gap-4">
        {Object.entries(groupedQuests)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([depth, depthQuests]) => {
            if (Number(depth) > maxDepthToShow) return null;
            const shownQuests = depthQuests.filter(
              (quest) => quest.status !== QuestStatus.Claimed || showCompletedQuests,
            );
            if (shownQuests.length === 0) return null;
            return <QuestDepthGroup key={depth} depthQuests={shownQuests} />;
          })}
      </div>
    </>
  );
};

const QuestDepthGroup = ({ depthQuests }: { depthQuests: Quest[] }) => (
  <>
    {depthQuests
      ?.slice()
      .reverse()
      .map((quest: Quest) => <QuestCard quest={quest} key={quest.name} />)}
  </>
);

const QuestCard = ({ quest }: { quest: Quest }) => {
  const setSelectedQuest = useQuestStore((state) => state.setSelectedQuest);

  const { getQuestResources } = useRealm();

  const isClaimed = quest.status === QuestStatus.Claimed;

  return (
    <div
      className={`w-full border px-4 py-2 rounded-xl  ${
        [QuestStatus.Completed, QuestStatus.Claimed].includes(quest.status) ? "border-green/40 bg-green/20" : ""
      }`}
    >
      <Headline className="mb-4 text-xl">{quest.name}</Headline>

      {quest.prizes &&
        quest.prizes.map((prize, index) => (
          <div key={index} className="grid grid-cols-3 gap-3">
            {getQuestResources()[prize.id].map((resource, i) => (
              <div key={i} className="grid gap-3">
                <ResourceCost resourceId={resource.resource} amount={resource.amount} />
              </div>
            ))}
          </div>
        ))}

      <div className="my-4">
        <Button isPulsing={!isClaimed} disabled={isClaimed} variant="primary" onClick={() => setSelectedQuest(quest)}>
          {isClaimed ? "Claimed" : quest.status === QuestStatus.Completed ? "Claim" : "Start"}
        </Button>
      </div>
    </div>
  );
};

const SkipTutorial = ({
  entityId,
  setSkipTutorial,
  unclaimedQuests,
}: {
  entityId: ID;
  setSkipTutorial: (skip: boolean) => void;
  unclaimedQuests: Quest[];
}) => {
  const {
    setup: {
      systemCalls: { claim_quest },
    },
    account: { account },
  } = useDojo();

  const [isLoading, setIsLoading] = useState(false);

  const claimAllQuests = async () => {
    if (unclaimedQuests) {
      setIsLoading(true);
      try {
        await claim_quest({
          signer: account,
          quest_ids: unclaimedQuests.flatMap((quest) => quest.prizes.map((prize) => BigInt(prize.id))),
          receiver_id: entityId,
        });
      } catch (error) {
        console.error(`Failed to claim resources for quests:`, error);
      } finally {
        setIsLoading(false);
        setSkipTutorial(false);
      }
    }
  };

  return (
    <div className="flex justify-center items-baseline">
      <p className="mr-2">Are you sure ?</p>
      <Button variant={"primary"} isLoading={isLoading} onClick={claimAllQuests}>
        Confirm
      </Button>
    </div>
  );
};
