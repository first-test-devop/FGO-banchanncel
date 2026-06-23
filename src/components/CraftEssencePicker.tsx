import { useEffect, useMemo, useRef, useState } from "react";
import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";

interface CraftEssencePickerProps {
  open: boolean;
  selectedIds: string[];
  onClose: () => void;
  onToggle: (id: string) => void;
}

export const CraftEssencePicker = ({
  open,
  selectedIds,
  onClose,
  onToggle,
}: CraftEssencePickerProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return BOND_CRAFT_ESSENCES.filter((craftEssence) => {
      const searchableText = [
        craftEssence.name,
        craftEssence.shortName,
        craftEssence.target?.label,
        craftEssence.baseSecondaryBenefit,
        craftEssence.mlbSecondaryBenefit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return !normalized || searchableText.includes(normalized);
    });
  }, [query]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="选择羁绊礼装"
        aria-modal="true"
        className="picker-modal ce-picker-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="picker-header">
          <div>
            <span className="eyebrow">CHOOSE CRAFT ESSENCES</span>
            <h2>选择羁绊礼装</h2>
            <p>选择你持有或希望纳入本次分析的礼装，可一次添加多张。</p>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            aria-label="搜索羁绊礼装"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入礼装名或适用特性"
            value={query}
          />
          <kbd>ESC</kbd>
        </label>
        <div className="ce-picker-summary">
          已选择 <strong>{selectedIds.length}</strong> 张
        </div>
        <div className="ce-picker-results">
          {results.map((craftEssence) => {
            const selected = selectedIds.includes(craftEssence.id);
            return (
              <button
                aria-pressed={selected}
                className={`ce-picker-result${selected ? " is-selected" : ""}`}
                key={craftEssence.id}
                onClick={() => onToggle(craftEssence.id)}
                type="button"
              >
                <img alt="" loading="lazy" src={craftEssence.image} />
                <span>
                  <strong>{craftEssence.name}</strong>
                  <small>
                    {craftEssence.effect === "flat"
                      ? `固定羁绊 +${craftEssence.mlbOwnedValue}`
                      : craftEssence.target?.label ??
                        `羁绊 +${craftEssence.baseOwnedValue}% / ${craftEssence.mlbOwnedValue}%`}
                    {" · "}Cost {craftEssence.cost}
                  </small>
                </span>
                <i aria-hidden="true">{selected ? "✓" : "+"}</i>
              </button>
            );
          })}
          {results.length === 0 && (
            <div className="empty-search">
              <span>✦</span>
              <p>没有找到匹配的羁绊礼装</p>
            </div>
          )}
        </div>
        <div className="ce-picker-footer">
          <span>选择完成后，可在列表中设置每张礼装的突破状态。</span>
          <button onClick={onClose} type="button">
            完成选择 · {selectedIds.length}
          </button>
        </div>
      </section>
    </div>
  );
};
