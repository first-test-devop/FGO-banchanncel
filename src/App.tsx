import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { AnalysisResult } from "./components/AnalysisResult";
import { PartyCard } from "./components/PartyCard";
import { ServantPicker } from "./components/ServantPicker";
import { SettingsPanel } from "./components/SettingsPanel";
import { SupportCraftEssencePicker } from "./components/SupportCraftEssencePicker";
import { DEFAULT_CRAFT_ESSENCE_STATES } from "./data/bondCraftEssences";
import { DATA_MANIFEST } from "./data/dataManifest";
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
  isGrand: false,
  supportCraftEssence: null,
  supportRewardCraftEssence: null,
}));

const DEMO_COLLECTION_NUMBERS = [385, 314, 215, 150, 236, 314];
const SETTINGS_STORAGE_KEY = "chaldea-bond-planner.settings";

const loadInitialSettings = (): BondSettings => {
  const fallback: BondSettings = {
    battleMode: "normal",
    baseBond: 815,
    maxPartyCost: 120,
    craftEssenceStates: DEFAULT_CRAFT_ESSENCE_STATES,
  };
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<BondSettings>;
    return {
      battleMode:
        parsed.battleMode === "grand" ? "grand" : fallback.battleMode,
      baseBond:
        typeof parsed.baseBond === "number" && parsed.baseBond >= 0
          ? parsed.baseBond
          : fallback.baseBond,
      maxPartyCost:
        typeof parsed.maxPartyCost === "number" && parsed.maxPartyCost >= 0
          ? parsed.maxPartyCost
          : fallback.maxPartyCost,
      craftEssenceStates:
        parsed.craftEssenceStates &&
        typeof parsed.craftEssenceStates === "object"
          ? parsed.craftEssenceStates
          : fallback.craftEssenceStates,
    };
  } catch {
    return fallback;
  }
};

export const App = () => {
  const [party, setParty] = useState<PartySlot[]>(EMPTY_PARTY);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<BondAnalysis | null>(null);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [pendingSupport, setPendingSupport] = useState<{
    index: number;
    servant: Servant;
    initialCraftEssenceId?: string | null;
    initialState?: "base" | "mlb";
    initialIsGrand?: boolean;
    initialRewardCraftEssenceId?: string | null;
    initialRewardState?: "base" | "mlb";
  } | null>(null);
  const pointerDragRef = useRef<{
    index: number;
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
    targetIndex: number;
  } | null>(null);
  const suppressChooseRef = useRef(false);
  const [settings, setSettings] = useState<BondSettings>(loadInitialSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch {
      logger.warn("settings_persistence_failed");
    }
  }, [settings]);

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
    const slot = party[pickerIndex];
    if (slot.kind === "support") {
      setPendingSupport({
        index: pickerIndex,
        servant,
        initialCraftEssenceId: slot.supportCraftEssence?.id,
        initialState: slot.supportCraftEssence?.state,
        initialIsGrand: slot.isGrand,
        initialRewardCraftEssenceId: slot.supportRewardCraftEssence?.id,
        initialRewardState: slot.supportRewardCraftEssence?.state,
      });
      closePicker();
      return;
    }
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
        supportCraftEssence:
          slot.kind === "support"
            ? { id: "chaldea-teatime", state: "mlb" }
            : null,
        supportRewardCraftEssence: null,
        isGrand: false,
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
    if (target.closest(".clear-slot, .swap-support, .grand-toggle")) return;
    pointerDragRef.current = {
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      targetIndex: index,
    };
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
      event.currentTarget.setPointerCapture(event.pointerId);
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
    } else {
      setPickerIndex(current.index);
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
          数据 {DATA_MANIFEST.dataVersion} · 英灵{" "}
          {DATA_MANIFEST.servants.count} · 羁绊礼装{" "}
          {DATA_MANIFEST.bondCraftEssences.count}
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

        <div className="battle-mode-switch" aria-label="关卡模式">
          <button
            className={settings.battleMode === "normal" ? "is-active" : ""}
            onClick={() => {
              setSettings((current) => ({
                ...current,
                battleMode: "normal",
              }));
              setAnalysis(null);
            }}
            type="button"
          >
            <strong>普通关卡</strong>
            <small>每名英灵使用一个礼装位</small>
          </button>
          <button
            className={settings.battleMode === "grand" ? "is-active" : ""}
            onClick={() => {
              setSettings((current) => ({
                ...current,
                battleMode: "grand",
              }));
              setAnalysis(null);
            }}
            type="button"
          >
            <strong>冠位战</strong>
            <small>指定冠位英灵并开放额外礼装位</small>
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
              battleMode={settings.battleMode}
              key={index}
              onChoose={() => {
                if (!suppressChooseRef.current) setPickerIndex(index);
              }}
              onClear={() => {
                setParty((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          servant: null,
                          isGrand: false,
                          supportCraftEssence: null,
                          supportRewardCraftEssence: null,
                        }
                      : item,
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
              onToggleGrand={() => {
                setParty((current) =>
                  current.map((item, itemIndex) => ({
                    ...item,
                    isGrand:
                      itemIndex === index
                        ? !item.isGrand
                        : item.kind === "owned" && slot.kind === "owned"
                          ? false
                          : item.isGrand,
                  })),
                );
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
        <span>
          CHALDEA BOND / v{DATA_MANIFEST.appVersion} / 数据{" "}
          {DATA_MANIFEST.dataVersion}
        </span>
        <p>
          本工具为非官方玩家项目。游戏素材版权归 TYPE-MOON / FGO PROJECT
          所有。英灵数据来自 {DATA_MANIFEST.sources.servants}
          ；羁绊礼装规则为人工审核数据。
        </p>
      </footer>

      <ServantPicker
        isSupport={
          pickerIndex !== null && party[pickerIndex]?.kind === "support"
        }
        onClose={closePicker}
        onSelect={selectServant}
        open={pickerIndex !== null}
        selectedIds={selectedIds}
      />
      <SupportCraftEssencePicker
        allowGrand={settings.battleMode === "grand"}
        initialIsGrand={pendingSupport?.initialIsGrand}
        initialCraftEssenceId={pendingSupport?.initialCraftEssenceId}
        initialRewardCraftEssenceId={
          pendingSupport?.initialRewardCraftEssenceId
        }
        initialRewardState={pendingSupport?.initialRewardState}
        initialState={pendingSupport?.initialState}
        onCancel={() => setPendingSupport(null)}
        onConfirm={(value) => {
          if (!pendingSupport) return;
          setParty((current) =>
            current.map((slot, index) =>
              index === pendingSupport.index
                  ? {
                    ...slot,
                    servant: pendingSupport.servant,
                    isGrand: value.isGrand,
                    supportCraftEssence: value.primary,
                    supportRewardCraftEssence: value.reward,
                  }
                : slot,
            ),
          );
          setAnalysis(null);
          setPendingSupport(null);
        }}
        servant={pendingSupport?.servant ?? null}
      />
    </main>
  );
};
