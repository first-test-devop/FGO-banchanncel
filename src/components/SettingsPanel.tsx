import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type {
  BondSettings,
  CraftEssenceState,
} from "../domain/types";

interface SettingsPanelProps {
  value: BondSettings;
  onChange: (settings: BondSettings) => void;
}

export const SettingsPanel = ({
  value,
  onChange,
}: SettingsPanelProps) => {
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

  return (
    <details className="settings-panel">
      <summary>
        <span>
          <strong>计算条件</strong>
          <small>基础羁绊与礼装突破状态</small>
        </span>
        <span className="settings-chevron">⌄</span>
      </summary>
      <div className="settings-content">
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
        <fieldset className="ce-inventory">
          <legend>羁绊礼装库存</legend>
          <div>
            {BOND_CRAFT_ESSENCES.map((craftEssence) => {
              const state =
                value.craftEssenceStates[craftEssence.id] ?? "none";
              const displayedValue =
                state === "base"
                  ? craftEssence.baseOwnedValue
                  : craftEssence.mlbOwnedValue;
              return (
                <label
                  className={state === "none" ? "is-unavailable" : ""}
                  key={craftEssence.id}
                >
                  <img alt="" src={craftEssence.image} />
                  <span>
                    {craftEssence.shortName}
                    {craftEssence.target && (
                      <small>
                        {craftEssence.target.label}
                        {state !== "none" && ` +${displayedValue}%`}
                      </small>
                    )}
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
                    <option value="none">未持有</option>
                    {craftEssence.hasMlbEffect ? (
                      <>
                        <option value="base">未满破</option>
                        <option value="mlb">满破</option>
                      </>
                    ) : (
                      <option value="mlb">已持有</option>
                    )}
                  </select>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </details>
  );
};
