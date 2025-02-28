import { HexPosition, StructureInfo } from "@/types";
import { BuildingType, ID, Position } from "@bibliothecadao/eternum";

export interface ThreeStore {
  navigationTarget: HexPosition | null;
  setNavigationTarget: (hex: HexPosition | null) => void;
  armyActions: ArmyActions;
  setArmyActions: (armyActions: ArmyActions) => void;
  updateHoveredHex: (hoveredHex: HexPosition | null) => void;
  updateTravelPaths: (travelPaths: Map<string, { path: HexPosition[]; isExplored: boolean }>) => void;
  updateSelectedEntityId: (selectedEntityId: ID | null) => void;
  selectedHex: HexPosition | null;
  setSelectedHex: (hex: HexPosition | null) => void;
  hoveredArmyEntityId: ID | null;
  setHoveredArmyEntityId: (id: ID | null) => void;
  hoveredStructure: StructureInfo | null;
  setHoveredStructure: (structure: StructureInfo | null) => void;
  hoveredBattle: Position | null;
  setHoveredBattle: (hex: Position | null) => void;
  selectedBuilding: BuildingType;
  setSelectedBuilding: (building: BuildingType) => void;
  selectedBuildingHex: {
    outerCol: number;
    outerRow: number;
    innerCol: number;
    innerRow: number;
  };
  setSelectedBuildingHex: (hexCoords: {
    outerCol: number;
    outerRow: number;
    innerCol: number;
    innerRow: number;
  }) => void;
}

interface ArmyActions {
  hoveredHex: HexPosition | null;
  travelPaths: Map<string, { path: HexPosition[]; isExplored: boolean }>;
  selectedEntityId: ID | null;
}

export const createThreeStoreSlice = (set: any, get: any) => ({
  navigationTarget: null,
  setNavigationTarget: (hex: HexPosition | null) => set({ navigationTarget: hex }),
  armyActions: {
    hoveredHex: null,
    travelPaths: new Map(),
    selectedEntityId: null,
  },
  setArmyActions: (armyActions: ArmyActions) => set({ armyActions }),
  updateHoveredHex: (hoveredHex: HexPosition | null) =>
    set((state: any) => ({ armyActions: { ...state.armyActions, hoveredHex } })),
  updateTravelPaths: (travelPaths: Map<string, { path: HexPosition[]; isExplored: boolean }>) =>
    set((state: any) => ({ armyActions: { ...state.armyActions, travelPaths } })),
  updateSelectedEntityId: (selectedEntityId: ID | null) =>
    set((state: any) => ({ armyActions: { ...state.armyActions, selectedEntityId } })),
  selectedHex: { col: 0, row: 0 },
  setSelectedHex: (hex: HexPosition | null) => set({ selectedHex: hex }),
  hoveredArmyEntityId: null,
  setHoveredArmyEntityId: (id: ID | null) => set({ hoveredArmyEntityId: id }),
  hoveredStructure: null,
  setHoveredStructure: (structure: StructureInfo | null) => set({ hoveredStructure: structure }),
  hoveredBattle: null,
  setHoveredBattle: (hex: Position | null) => set({ hoveredBattle: hex }),
  selectedBuilding: BuildingType.Farm,
  setSelectedBuilding: (building: BuildingType) => set({ selectedBuilding: building }),
  selectedBuildingEntityId: null,
  setSelectedBuildingEntityId: (selectedBuildingEntityId: ID | null) => set({ selectedBuildingEntityId }),
  selectedBuildingHex: { outerCol: 0, outerRow: 0, innerCol: 0, innerRow: 0 },
  setSelectedBuildingHex: ({
    outerCol,
    outerRow,
    innerCol,
    innerRow,
  }: {
    outerCol: number;
    outerRow: number;
    innerCol: number;
    innerRow: number;
  }) => set({ selectedBuildingHex: { outerCol, outerRow, innerCol, innerRow } }),
});
