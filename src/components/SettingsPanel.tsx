import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";
import type { BondSettings } from "../domain/types";

interface SettingsPanelProps {
  value: BondSettings;
  onChange: (settings: BondSettings) => void;
}

export const SettingsPanel = ({
  value,
  onChange,
}: SettingsPanelProps) => {
  const toggleCraftEssence = (id: string) => {
    const availableCeIds = value.availableCeIds.includes(id)
      ? value.availableCeIds.filter((item) => item !== id)
      : [...value.availableCeIds, id];
    onChange({ ...value, availableCeIds });
  };

  return (
    <details className="settings-panel">
      <summary>
        <span>
          <strong>计算条件</strong>
          <small>基础羁绊与已持有满破礼装</small>
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
          <legend>可用满破羁绊礼装</legend>
          <div>
            {BOND_CRAFT_ESSENCES.map((craftEssence) => (
              <label key={craftEssence.id}>
                <input
                  checked={value.availableCeIds.includes(craftEssence.id)}
                  onChange={() => toggleCraftEssence(craftEssence.id)}
                  type="checkbox"
                />
                <img alt="" src={craftEssence.image} />
                <span>
                  {craftEssence.shortName}
                  {craftEssence.target && (
                    <small>
                      {craftEssence.target.label} +{craftEssence.ownedValue}%
                    </small>
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
};
