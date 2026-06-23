import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnalysisResult } from "./components/AnalysisResult";
import { PartyCard } from "./components/PartyCard";
import { ServantPicker } from "./components/ServantPicker";
import { SettingsPanel } from "./components/SettingsPanel";
import { DEFAULT_CRAFT_ESSENCE_STATES } from "./data/bondCraftEssences";
import servantsData from "./data/servants.json";
import { analyzeBond } from "./domain/analyzeBond";
import { reorderParty } from "./domain/reorderParty";
import type {
  BondAnalysis,
  BondSettings,
  PartySlot,
  Servant,
} from "./domain/types";
import { logger } from "./lib/logger";

const EMPTY_PARTY: PartySlot[] = Array.from({ length: 6 }, (_, index) => ({
  kind: index === 5 ? "support" : "owned",
  servant: null,
}));

const DEMO_COLLECTION_NUMBERS = [385, 314, 215, 150, 236, 314];

export const App = () => {
  const [party, setParty] = useState<PartySlot[]>(EMPTY_PARTY);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<BondAnalysis | null>(null);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const pointerDragRef = useRef<{
    index: number;
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
    targetIndex: number;
  } | null>(null);
  const suppressChooseRef = useRef(false);
  const [settings, setSettings] = useState<BondSettings>({
    baseBond: 815,
    craftEssenceStates: DEFAULT_CRAFT_ESSENCE_STATES,
  });

  const selectedIds = useMemo(
    () => {
      if (pickerIndex === null || party[pickerIndex].kind === "support") {
        return [];
      }
      return party.flatMap(({ kind, servant }, index) =>
        kind === "owned" && index !== pickerIndex && servant
          ? [servant.id]
          : [],
      );
    },
    [party, pickerIndex],
  );

  const closePicker = useCallback(() => setPickerIndex(null), []);

  const selectServant = (servant: Servant) => {
    if (pickerIndex === null) return;
    setParty((current) =>
      current.map((slot, index) =>
        index === pickerIndex ? { ...slot, servant } : slot,
      ),
    );
    setAnalysis(null);
    closePicker();
  };

  const fillDemo = () => {
    const allServants = servantsData as Servant[];
    setParty((current) =>
      current.map((slot, index) => ({
        ...slot,
        servant:
          allServants.find(
            ({ collectionNo }) =>
              collectionNo === DEMO_COLLECTION_NUMBERS[index],
          ) ?? allServants[index],
      })),
    );
    setAnalysis(null);
  };

  const runAnalysis = () => {
    try {
      const result = analyzeBond(party, settings);
      setAnalysis(result);
      setError("");
      logger.info("bond_analysis_completed", {
        selectedSlots: result.recommendations.length,
        totalPartyBond: result.totalPartyBond,
      });
      window.setTimeout(
        () =>
          document
            .getElementById("analysis-result")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        0,
      );
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "分析失败，请稍后重试。";
      setError(message);
      setAnalysis(null);
      logger.warn("bond_analysis_rejected", { message });
    }
  };

  const selectedCount = party.filter(({ servant }) => servant !== null).length;
  const supportIndex = party.findIndex(({ kind }) => kind === "support");

  const movePartySlot = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setParty((current) => reorderParty(current, fromIndex, toIndex));
    setAnalysis(null);
  };

  const startPointerDrag = (
    index: number,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest(".clear-slot, .swap-support")) return;
    pointerDragRef.current = {
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      targetIndex: index,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updatePointerDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = pointerDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const distance = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY,
    );
    if (!current.dragging && distance < 8) return;
    if (!current.dragging) {
      current.dragging = true;
      suppressChooseRef.current = true;
      setDraggedIndex(current.index);
      setAnalysis(null);
    }

    event.preventDefault();
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-slot-index]");
    const targetIndex = target
      ? Number(target.dataset.slotIndex)
      : current.index;
    if (Number.isInteger(targetIndex)) {
      current.targetIndex = targetIndex;
      setDropTargetIndex(targetIndex);
    }
  };

  const finishPointerDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const current = pointerDragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.dragging) {
      movePartySlot(current.index, current.targetIndex);
    }
    pointerDragRef.current = null;
    setDraggedIndex(null);
    setDropTargetIndex(null);
    if (suppressChooseRef.current) {
      window.setTimeout(() => {
        suppressChooseRef.current = false;
      }, 0);
    }
  };

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#" aria-label="Chaldea Bond 首页">
          <span className="brand-mark">C</span>
          <span>
            <strong>CHALDEA BOND</strong>
            <small>羁绊礼装分析终端</small>
          </span>
        </a>
        <div className="data-badge">
          <span />
          国服英灵数据 · 441
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">BOND POINT OPTIMIZER · 01</span>
          <h1>
            让每一次出击
            <br />
            都更接近<span>羁绊</span>
          </h1>
          <p>
            选择你的六人阵容，系统将根据助战规则、关卡基础羁绊与礼装收益，
            找出整队总羁绊最高的配置。
          </p>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit outer" />
          <div className="orbit inner" />
          <div className="command-spell">✦</div>
        </div>
      </header>

      <section className="planner">
        <div className="section-heading">
          <div>
            <span className="section-number">01</span>
            <span>
              <small>FORMATION</small>
              <h2>编成出战阵容</h2>
            </span>
          </div>
          <button className="text-button" onClick={fillDemo}>
            填入示例阵容
          </button>
        </div>

        <div className="party-grid">
          {party.map((slot, index) => (
            <PartyCard
              isDragging={draggedIndex === index}
              isDropTarget={
                dropTargetIndex === index && draggedIndex !== index
              }
              index={index}
              key={index}
              onChoose={() => {
                if (!suppressChooseRef.current) setPickerIndex(index);
              }}
              onClear={() => {
                setParty((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, servant: null } : item,
                  ),
                );
                setAnalysis(null);
              }}
              onPointerDown={(event) => startPointerDrag(index, event)}
              onPointerMove={updatePointerDrag}
              onPointerUp={finishPointerDrag}
              onSwapWithSupport={() => {
                if (supportIndex < 0 || supportIndex === index) return;
                setParty((current) => {
                  const next = [...current];
                  [next[index], next[supportIndex]] = [
                    next[supportIndex],
                    next[index],
                  ];
                  return next;
                });
                setAnalysis(null);
              }}
              slot={slot}
            />
          ))}
        </div>

        <SettingsPanel
          onChange={(value) => {
            setSettings(value);
            setAnalysis(null);
          }}
          value={settings}
        />

        {error && (
          <div className="error-message" role="alert">
            <span>!</span>
            {error}
          </div>
        )}

        <button className="analyze-button" onClick={runAnalysis}>
          <span>开始分析阵容</span>
          <small>{selectedCount}/6 已选择</small>
          <i aria-hidden="true">→</i>
        </button>
      </section>

      {analysis && <AnalysisResult analysis={analysis} party={party} />}

      <footer>
        <span>CHALDEA BOND / v0.1.0</span>
        <p>
          本工具为非官方玩家项目。游戏素材版权归 TYPE-MOON / FGO PROJECT
          所有。
        </p>
      </footer>

      <ServantPicker
        onClose={closePicker}
        onSelect={selectServant}
        open={pickerIndex !== null}
        selectedIds={selectedIds}
      />
    </main>
  );
};
