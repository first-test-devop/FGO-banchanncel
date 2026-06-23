import { useEffect, useMemo, useRef, useState } from "react";
import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type {
  CraftEssenceState,
  Servant,
} from "../domain/types";

interface SupportCraftEssencePickerProps {
  servant: Servant | null;
  allowGrand?: boolean;
  initialIsGrand?: boolean;
  initialCraftEssenceId?: string | null;
  initialState?: Exclude<CraftEssenceState, "none">;
  initialRewardCraftEssenceId?: string | null;
  initialRewardState?: Exclude<CraftEssenceState, "none">;
  onCancel: () => void;
  onConfirm: (value: {
    isGrand: boolean;
    primary: {
      id: string | null;
      state: Exclude<CraftEssenceState, "none">;
    };
    reward: {
      id: string | null;
      state: Exclude<CraftEssenceState, "none">;
    } | null;
  }) => void;
}

export const SupportCraftEssencePicker = ({
  servant,
  allowGrand = false,
  initialIsGrand = false,
  initialCraftEssenceId,
  initialState = "mlb",
  initialRewardCraftEssenceId = null,
  initialRewardState = "mlb",
  onCancel,
  onConfirm,
}: SupportCraftEssencePickerProps) => {
  const defaultId =
    initialCraftEssenceId === null
      ? null
      : initialCraftEssenceId ??
        BOND_CRAFT_ESSENCES.find(({ id }) => id === "chaldea-teatime")?.id ??
        BOND_CRAFT_ESSENCES[0].id;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  const [state, setState] =
    useState<Exclude<CraftEssenceState, "none">>(initialState);
  const [isGrand, setIsGrand] = useState(initialIsGrand);
  const [activeSlot, setActiveSlot] = useState<"primary" | "reward">(
    "primary",
  );
  const [rewardSelectedId, setRewardSelectedId] = useState<string | null>(
    initialRewardCraftEssenceId,
  );
  const [rewardState, setRewardState] =
    useState<Exclude<CraftEssenceState, "none">>(initialRewardState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!servant) return;
    setQuery("");
    setSelectedId(defaultId);
    setState(initialState);
    setIsGrand(allowGrand && initialIsGrand);
    setActiveSlot("primary");
    setRewardSelectedId(initialRewardCraftEssenceId);
    setRewardState(initialRewardState);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [
    defaultId,
    allowGrand,
    initialIsGrand,
    initialRewardCraftEssenceId,
    initialRewardState,
    initialState,
    servant,
  ]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return BOND_CRAFT_ESSENCES.filter((craftEssence) =>
      [
        craftEssence.name,
        craftEssence.target?.label,
        craftEssence.baseSecondaryBenefit,
        craftEssence.mlbSecondaryBenefit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query]);
  const selected = BOND_CRAFT_ESSENCES.find(({ id }) => id === selectedId);
  const rewardSelected = BOND_CRAFT_ESSENCES.find(
    ({ id }) => id === rewardSelectedId,
  );
  const activeSelectedId =
    activeSlot === "primary" ? selectedId : rewardSelectedId;
  const selectForActiveSlot = (id: string | null) => {
    if (activeSlot === "primary") setSelectedId(id);
    else setRewardSelectedId(id);
  };

  if (!servant) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        aria-label="选择助战礼装"
        aria-modal="true"
        className="picker-modal support-ce-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="picker-header">
          <div>
            <span className="eyebrow">SUPPORT SETUP · STEP 2/2</span>
            <h2>选择助战携带的礼装</h2>
            <p>
              已选择助战：{servant.name}。助战及其礼装不占你的编队 Cost。
            </p>
          </div>
          <button aria-label="取消选择助战" className="icon-button" onClick={onCancel}>
            ×
          </button>
        </div>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            aria-label="搜索助战礼装"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入助战携带的羁绊礼装"
            value={query}
          />
        </label>
        {allowGrand && (
          <label className="grand-support-toggle">
            <input
              checked={isGrand}
              onChange={(event) => setIsGrand(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>这是冠位助战</strong>
              <small>冠位战中可配置礼装位 1 与礼装位 3</small>
            </span>
          </label>
        )}
        {isGrand && (
          <div className="grand-ce-tabs">
            <button
              className={activeSlot === "primary" ? "is-active" : ""}
              onClick={() => setActiveSlot("primary")}
              type="button"
            >
              礼装位 1 · {selected?.shortName ?? "空"}
            </button>
            <button
              className={activeSlot === "reward" ? "is-active" : ""}
              onClick={() => setActiveSlot("reward")}
              type="button"
            >
              礼装位 3 · {rewardSelected?.shortName ?? "空"}
            </button>
          </div>
        )}
        <div className="support-ce-results">
          <button
            aria-pressed={activeSelectedId === null}
            className={`ce-picker-result support-empty-ce${
              activeSelectedId === null ? " is-selected" : ""
            }`}
            onClick={() => selectForActiveSlot(null)}
            type="button"
          >
            <span className="support-empty-icon">—</span>
            <span>
              <strong>不携带礼装</strong>
              <small>助战不提供礼装羁绊加成</small>
            </span>
            <i aria-hidden="true">
              {activeSelectedId === null ? "✓" : "+"}
            </i>
          </button>
          {results.map((craftEssence) => (
            <button
              aria-pressed={craftEssence.id === activeSelectedId}
              className={`ce-picker-result${
                craftEssence.id === activeSelectedId ? " is-selected" : ""
              }`}
              key={craftEssence.id}
              onClick={() => {
                selectForActiveSlot(craftEssence.id);
                if (!craftEssence.hasMlbEffect) {
                  if (activeSlot === "primary") setState("mlb");
                  else setRewardState("mlb");
                }
              }}
              type="button"
            >
              <img alt="" src={craftEssence.image} />
              <span>
                <strong>{craftEssence.name}</strong>
                <small>{craftEssence.target?.label ?? "全队羁绊效果"}</small>
              </span>
              <i aria-hidden="true">
                {craftEssence.id === activeSelectedId ? "✓" : "+"}
              </i>
            </button>
          ))}
        </div>
        <div className={`support-ce-footer${isGrand ? " is-grand" : ""}`}>
          <div>
            {selected ? (
              <img alt="" src={selected.image} />
            ) : (
              <span className="support-empty-preview">—</span>
            )}
            <span>
              <small>当前助战礼装</small>
              <strong>{selected?.name ?? "不携带礼装"}</strong>
            </span>
          </div>
          {selected ? (
            <label>
              <span>突破状态</span>
              <select
                aria-label="助战礼装突破状态"
                onChange={(event) =>
                  setState(
                    event.target.value as Exclude<CraftEssenceState, "none">,
                  )
                }
                value={selected.hasMlbEffect ? state : "mlb"}
              >
                {selected.hasMlbEffect ? (
                  <>
                    <option value="base">未满破</option>
                    <option value="mlb">满破</option>
                  </>
                ) : (
                  <option value="mlb">已持有</option>
                )}
              </select>
            </label>
          ) : (
            <span className="support-empty-state">无需设置突破状态</span>
          )}
          {isGrand && (
            <>
              <div>
                {rewardSelected ? (
                  <img alt="" src={rewardSelected.image} />
                ) : (
                  <span className="support-empty-preview">—</span>
                )}
                <span>
                  <small>礼装位 3 · Cost 0</small>
                  <strong>{rewardSelected?.name ?? "不携带礼装"}</strong>
                </span>
              </div>
              {rewardSelected ? (
                <label>
                  <span>位 3 突破状态</span>
                  <select
                    aria-label="冠位助战礼装位3突破状态"
                    onChange={(event) =>
                      setRewardState(
                        event.target.value as Exclude<
                          CraftEssenceState,
                          "none"
                        >,
                      )
                    }
                    value={
                      rewardSelected.hasMlbEffect ? rewardState : "mlb"
                    }
                  >
                    {rewardSelected.hasMlbEffect ? (
                      <>
                        <option value="base">未满破</option>
                        <option value="mlb">满破</option>
                      </>
                    ) : (
                      <option value="mlb">已持有</option>
                    )}
                  </select>
                </label>
              ) : (
                <span className="support-empty-state">位 3 为空</span>
              )}
            </>
          )}
          <button
            onClick={() =>
              onConfirm({
                isGrand,
                primary: {
                  id: selected?.id ?? null,
                  state: selected?.hasMlbEffect ? state : "mlb",
                },
                reward: isGrand
                  ? {
                      id: rewardSelected?.id ?? null,
                      state: rewardSelected?.hasMlbEffect
                        ? rewardState
                        : "mlb",
                    }
                  : null,
              })
            }
            type="button"
          >
            确认助战配置
          </button>
        </div>
      </section>
    </div>
  );
};
