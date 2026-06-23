import { useCallback, useMemo, useState } from "react";
import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type { BondSettings, CraftEssenceState } from "../domain/types";
import { CraftEssencePicker } from "./CraftEssencePicker";

interface SettingsPanelProps {
  value: BondSettings;
  onChange: (settings: BondSettings) => void;
}

export const SettingsPanel = ({
  value,
  onChange,
}: SettingsPanelProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateCraftEssence = (
    id: string,
    state: CraftEssenceState,
  ) => {
    onChange({
      ...value,
      craftEssenceStates: {
        ...value.craftEssenceStates,
        [id]: state,
      },
    });
  };

  const selectedCraftEssences = useMemo(
    () =>
      BOND_CRAFT_ESSENCES.filter(
        ({ id }) => (value.craftEssenceStates[id] ?? "none") !== "none",
      ),
    [value.craftEssenceStates],
  );
  const selectedIds = selectedCraftEssences.map(({ id }) => id);

  const toggleCraftEssence = (id: string) => {
    const craftEssence = BOND_CRAFT_ESSENCES.find((item) => item.id === id);
    if (!craftEssence) return;
    const currentState = value.craftEssenceStates[id] ?? "none";
    updateCraftEssence(
      id,
      currentState === "none"
        ? craftEssence.hasMlbEffect
          ? "base"
          : "mlb"
        : "none",
    );
  };

  const closePicker = useCallback(() => setPickerOpen(false), []);

  return (
    <>
      <details className="settings-panel">
        <summary>
          <span>
            <strong>计算条件</strong>
            <small>
              {value.battleMode === "grand" ? "冠位战" : "普通关卡"} · Cost{" "}
              {value.maxPartyCost} · 已选{" "}
              {selectedCraftEssences.length} 张自有礼装
            </small>
          </span>
          <span className="settings-chevron">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-fields">
            <label className="field">
              <span>关卡基础羁绊</span>
              <input
                inputMode="numeric"
                max={9999}
                min={0}
                onChange={(event) =>
                  onChange({
                    ...value,
                    baseBond: Math.max(0, Number(event.target.value) || 0),
                  })
                }
                type="number"
                value={value.baseBond}
              />
              <small>示例：典位级常用 815；请以关卡实际值为准</small>
            </label>
            <label className="field">
              <span>编队 Cost 上限</span>
              <input
                inputMode="numeric"
                max={999}
                min={0}
                onChange={(event) =>
                  onChange({
                    ...value,
                    maxPartyCost: Math.max(
                      0,
                      Number(event.target.value) || 0,
                    ),
                  })
                }
                type="number"
                value={value.maxPartyCost}
              />
              <small>只计算五名自有从者及其礼装；助战不占 Cost</small>
            </label>
          </div>
          <fieldset className="ce-inventory">
            <div className="ce-inventory-heading">
              <span>自有羁绊礼装库存</span>
              <button onClick={() => setPickerOpen(true)} type="button">
                ＋ 选择礼装
              </button>
            </div>
            {selectedCraftEssences.length > 0 ? (
              <div className="ce-selected-list">
                {selectedCraftEssences.map((craftEssence) => {
                  const state =
                    value.craftEssenceStates[craftEssence.id] ?? "none";
                  const displayedValue =
                    state === "base"
                      ? craftEssence.baseOwnedValue
                      : craftEssence.mlbOwnedValue;
                  return (
                    <label key={craftEssence.id}>
                      <img alt="" src={craftEssence.image} />
                      <span>
                        {craftEssence.shortName}
                        <small>
                          Cost {craftEssence.cost}
                          {craftEssence.target && (
                            <>
                              {" · "}
                            {craftEssence.target.label}
                            {` +${displayedValue}%`}
                            </>
                          )}
                        </small>
                      </span>
                      <select
                        aria-label={`${craftEssence.name}突破状态`}
                        onChange={(event) =>
                          updateCraftEssence(
                            craftEssence.id,
                            event.target.value as CraftEssenceState,
                          )
                        }
                        value={state}
                      >
                        {craftEssence.hasMlbEffect ? (
                          <>
                            <option value="base">未满破</option>
                            <option value="mlb">满破</option>
                          </>
                        ) : (
                          <option value="mlb">已持有</option>
                        )}
                      </select>
                      <button
                        aria-label={`移除${craftEssence.name}`}
                        className="ce-remove-button"
                        onClick={() =>
                          updateCraftEssence(craftEssence.id, "none")
                        }
                        type="button"
                      >
                        ×
                      </button>
                    </label>
                  );
                })}
              </div>
            ) : (
              <button
                className="ce-empty-state"
                onClick={() => setPickerOpen(true)}
                type="button"
              >
                <span>＋</span>
                <strong>选择你持有的羁绊礼装</strong>
                <small>分析器只会使用你主动加入的礼装</small>
              </button>
            )}
          </fieldset>
        </div>
      </details>
      <CraftEssencePicker
        onClose={closePicker}
        onToggle={toggleCraftEssence}
        open={pickerOpen}
        selectedIds={selectedIds}
      />
    </>
  );
};
