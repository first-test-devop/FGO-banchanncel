import { useEffect, useMemo, useRef, useState } from "react";
import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type {
  CraftEssenceState,
  Servant,
} from "../domain/types";

interface SupportCraftEssencePickerProps {
  servant: Servant | null;
  initialCraftEssenceId?: string;
  initialState?: Exclude<CraftEssenceState, "none">;
  onCancel: () => void;
  onConfirm: (
    craftEssenceId: string,
    state: Exclude<CraftEssenceState, "none">,
  ) => void;
}

export const SupportCraftEssencePicker = ({
  servant,
  initialCraftEssenceId,
  initialState = "mlb",
  onCancel,
  onConfirm,
}: SupportCraftEssencePickerProps) => {
  const defaultId =
    initialCraftEssenceId ??
    BOND_CRAFT_ESSENCES.find(({ id }) => id === "chaldea-teatime")?.id ??
    BOND_CRAFT_ESSENCES[0].id;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultId);
  const [state, setState] =
    useState<Exclude<CraftEssenceState, "none">>(initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!servant) return;
    setQuery("");
    setSelectedId(defaultId);
    setState(initialState);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [defaultId, initialState, servant]);

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

  if (!servant || !selected) return null;

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
        <div className="support-ce-results">
          {results.map((craftEssence) => (
            <button
              aria-pressed={craftEssence.id === selectedId}
              className={`ce-picker-result${
                craftEssence.id === selectedId ? " is-selected" : ""
              }`}
              key={craftEssence.id}
              onClick={() => {
                setSelectedId(craftEssence.id);
                if (!craftEssence.hasMlbEffect) setState("mlb");
              }}
              type="button"
            >
              <img alt="" src={craftEssence.image} />
              <span>
                <strong>{craftEssence.name}</strong>
                <small>{craftEssence.target?.label ?? "全队羁绊效果"}</small>
              </span>
              <i aria-hidden="true">
                {craftEssence.id === selectedId ? "✓" : "+"}
              </i>
            </button>
          ))}
        </div>
        <div className="support-ce-footer">
          <div>
            <img alt="" src={selected.image} />
            <span>
              <small>当前助战礼装</small>
              <strong>{selected.name}</strong>
            </span>
          </div>
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
          <button
            onClick={() =>
              onConfirm(selected.id, selected.hasMlbEffect ? state : "mlb")
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
