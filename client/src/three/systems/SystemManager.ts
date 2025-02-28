import { ClientComponents } from "@/dojo/createClientComponents";
import { configManager, SetupResult } from "@/dojo/setup";
import { HexPosition } from "@/types";
import { Position } from "@/types/Position";
import { divideByPrecision } from "@/ui/utils/utils";
import { ID, RealmLevels, StructureType } from "@bibliothecadao/eternum";
import {
  Component,
  ComponentValue,
  defineComponentSystem,
  defineQuery,
  getComponentValue,
  Has,
  HasValue,
  isComponentUpdate,
  runQuery,
} from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { PROGRESS_FINAL_THRESHOLD, PROGRESS_HALF_THRESHOLD, StructureProgress } from "../scenes/constants";
import {
  ArmySystemUpdate,
  BattleSystemUpdate,
  BuildingSystemUpdate,
  RealmSystemUpdate,
  StructureSystemUpdate,
  TileSystemUpdate,
} from "./types";

// The SystemManager class is responsible for updating the Three.js models when there are changes in the game state.
// It listens for updates from torii and translates them into a format that can be consumed by the Three.js model managers.
export class SystemManager {
  constructor(private setup: SetupResult) {}

  private setupSystem<T>(
    component: Component,
    callback: (value: T) => void,
    getUpdate: (update: any) => T | undefined,
    runOnInit: boolean = true,
  ) {
    const handleUpdate = (update: any) => {
      const value = getUpdate(update);
      if (value) callback(value);
    };

    defineComponentSystem(this.setup.network.world, component, handleUpdate, { runOnInit });
  }

  public get Army() {
    return {
      onUpdate: (callback: (value: ArmySystemUpdate) => void) => {
        const query = defineQuery(
          [
            Has(this.setup.components.Army),
            Has(this.setup.components.Position),
            Has(this.setup.components.EntityOwner),
            Has(this.setup.components.Health),
          ],
          { runOnInit: true },
        );

        return query.update$.subscribe((update) => {
          if (
            isComponentUpdate(update, this.setup.components.Army) ||
            isComponentUpdate(update, this.setup.components.Position) ||
            isComponentUpdate(update, this.setup.components.Health)
          ) {
            const army = getComponentValue(this.setup.components.Army, update.entity);
            if (!army) return;

            const position = getComponentValue(this.setup.components.Position, update.entity);
            if (!position) return;

            const health = getComponentValue(this.setup.components.Health, update.entity);
            if (!health) return;

            const protectee = getComponentValue(this.setup.components.Protectee, update.entity);
            if (protectee) return;

            const healthMultiplier = BigInt(configManager.getResourcePrecision());

            const entityOwner = getComponentValue(this.setup.components.EntityOwner, update.entity);
            if (!entityOwner) return;

            const realm = getComponentValue(
              this.setup.components.Realm,
              getEntityIdFromKeys([BigInt(entityOwner.entity_owner_id)]),
            );
            if (!realm) return;

            const owner = getComponentValue(
              this.setup.components.Owner,
              getEntityIdFromKeys([BigInt(entityOwner.entity_owner_id)]),
            );

            callback({
              entityId: army.entity_id,
              hexCoords: { col: position.x, row: position.y },
              battleId: army.battle_id,
              defender: Boolean(protectee),
              currentHealth: health.current / healthMultiplier,
              order: realm.order,
              owner: { address: owner?.address || 0n },
            });
          }
        });
      },
    };
  }

  public get Structure() {
    return {
      onUpdate: (callback: (value: StructureSystemUpdate) => void) => {
        this.setupSystem(this.setup.components.Position, callback, (update: any) => {
          const structure = getComponentValue(this.setup.components.Structure, update.entity);
          if (!structure) return;

          const owner = getComponentValue(this.setup.components.Owner, update.entity);

          const categoryKey = structure.category as keyof typeof StructureType;

          const stage = this.getStructureStage(StructureType[categoryKey], structure.entity_id);
          let level = 0;
          if (StructureType[categoryKey] === StructureType.Realm) {
            const realm = getComponentValue(this.setup.components.Realm, update.entity);
            level = realm?.level || RealmLevels.Settlement;
          }

          return {
            entityId: structure.entity_id,
            hexCoords: this.getHexCoords(update.value),
            structureType: StructureType[categoryKey],
            stage,
            level,
            owner: { address: owner?.address || 0n },
          };
        });
      },
    };
  }

  public get Realm() {
    return {
      onUpdate: (callback: (value: RealmSystemUpdate) => void) => {
        this.setupSystem(this.setup.components.Realm, callback, (update: any) => {
          const realm = getComponentValue(this.setup.components.Realm, update.entity);
          const position = getComponentValue(this.setup.components.Position, update.entity);
          if (!realm || !position) return;

          return {
            level: realm.level,
            hexCoords: { col: position.x, row: position.y },
          };
        });
      },
    };
  }

  public get Battle() {
    return {
      onUpdate: (callback: (value: BattleSystemUpdate) => void) => {
        this.setupSystem(this.setup.components.Battle, callback, (update: any) => {
          const battle = getComponentValue(this.setup.components.Battle, update.entity);
          if (!battle) {
            return {
              entityId: update.value[1].entity_id,
              hexCoords: new Position({ x: 0, y: 0 }),
              isEmpty: false,
              deleted: true,
              isSiege: false,
            };
          }

          const position = getComponentValue(this.setup.components.Position, update.entity);
          if (!position) return;

          const healthMultiplier = BigInt(configManager.getResourcePrecision());
          const isEmpty =
            battle.attack_army_health.current < healthMultiplier &&
            battle.defence_army_health.current < healthMultiplier;

          const isSiege = battle.start_at > Date.now() / 1000;

          return {
            entityId: battle.entity_id,
            hexCoords: new Position({ x: position.x, y: position.y }),
            isEmpty,
            deleted: false,
            isSiege,
          };
        });
      },
    };
  }

  public get Tile() {
    return {
      onUpdate: (callback: (value: TileSystemUpdate) => void) => {
        this.setupSystem(this.setup.components.Tile, callback, (update: any) => {
          const newState = update.value[0];
          const prevState = update.value[1];

          const { col, row } = prevState || newState;
          return {
            hexCoords: { col, row },
            removeExplored: !newState,
          };
        });
      },
    };
  }

  public get Buildings() {
    return {
      subscribeToHexUpdates: (hexCoords: HexPosition, callback: (value: BuildingSystemUpdate) => void) => {
        const query = defineQuery([
          HasValue(this.setup.components.Building, {
            outer_col: hexCoords.col,
            outer_row: hexCoords.row,
          }),
        ]);

        return query.update$.subscribe((update) => {
          if (isComponentUpdate(update, this.setup.components.Building)) {
            const building = getComponentValue(this.setup.components.Building, update.entity);
            if (!building) return;

            const innerCol = building.inner_col;
            const innerRow = building.inner_row;
            const buildingType = building.category;
            const paused = building.paused;

            callback({
              buildingType,
              innerCol,
              innerRow,
              paused,
            });
          }
        });
      },
    };
  }

  private getHexCoords(value: any): { col: number; row: number } {
    return { col: value[0]?.x || 0, row: value[0]?.y || 0 };
  }

  private getStructureStage(structureType: StructureType, entityId: ID): number {
    if (structureType === StructureType.Hyperstructure) {
      const progressQueryResult = Array.from(
        runQuery([
          Has(this.setup.components.Progress),
          HasValue(this.setup.components.Progress, { hyperstructure_entity_id: entityId }),
        ]),
      );

      const progresses = progressQueryResult.map((progressEntityId) => {
        return getComponentValue(this.setup.components.Progress, progressEntityId);
      });

      const { percentage } = this.getAllProgressesAndTotalPercentage(progresses, entityId);

      if (percentage < PROGRESS_HALF_THRESHOLD) {
        return StructureProgress.STAGE_1;
      }
      if (percentage < PROGRESS_FINAL_THRESHOLD && percentage > PROGRESS_HALF_THRESHOLD) {
        return StructureProgress.STAGE_2;
      }
      return StructureProgress.STAGE_3;
    }

    return StructureProgress.STAGE_1;
  }

  private getAllProgressesAndTotalPercentage = (
    progresses: (ComponentValue<ClientComponents["Progress"]["schema"]> | undefined)[],
    hyperstructureEntityId: ID,
  ) => {
    const totalContributableAmount = configManager.getHyperstructureTotalContributableAmount();
    let percentage = 0;
    const epsilon = 1e-10; // Small value to account for floating-point precision errors

    const allProgresses = Object.values(configManager.hyperstructureTotalCosts).map(
      ({ resource, amount: resourceCost }) => {
        let foundProgress = progresses.find((progress) => progress!.resource_type === resource);
        let progress = {
          hyperstructure_entity_id: hyperstructureEntityId,
          resource_type: resource,
          amount: !foundProgress ? 0 : divideByPrecision(Number(foundProgress.amount)),
          percentage: !foundProgress
            ? 0
            : Math.floor((divideByPrecision(Number(foundProgress.amount)) / resourceCost!) * 100),
          costNeeded: resourceCost,
        };
        percentage +=
          (progress.amount * configManager.getResourceRarity(progress.resource_type)) / totalContributableAmount;
        return progress;
      },
    );

    // Adjust percentage to account for floating-point precision issues
    if (Math.abs(percentage - 1.0) < epsilon) {
      percentage = 1.0;
    }

    return { allProgresses, percentage };
  };
}
