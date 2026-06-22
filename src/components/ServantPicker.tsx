import { useEffect, useMemo, useRef, useState } from "react";
import servantsData from "../data/servants.json";
import type { Servant } from "../domain/types";

const servants = servantsData as Servant[];

const CLASS_NAMES: Record<string, string> = {
  saber: "剑阶",
  archer: "弓阶",
  lancer: "枪阶",
  rider: "骑阶",
  caster: "术阶",
  assassin: "杀阶",
  berserker: "狂阶",
  shielder: "盾阶",
  ruler: "裁阶",
  avenger: "仇阶",
  alterEgo: "他人格",
  moonCancer: "月癌",
  foreigner: "降临者",
  pretender: "伪装者",
  beast: "兽阶",
};

interface ServantPickerProps {
  open: boolean;
  selectedIds: number[];
  onClose: () => void;
  onSelect: (servant: Servant) => void;
}

export const ServantPicker = ({
  open,
  selectedIds,
  onClose,
  onSelect,
}: ServantPickerProps) => {
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
    return servants
      .filter(
        (servant) =>
          !selectedIds.includes(servant.id) &&
          (!normalized ||
            servant.name.toLocaleLowerCase().includes(normalized) ||
            String(servant.collectionNo).includes(normalized) ||
            (CLASS_NAMES[servant.className] ?? servant.className).includes(
              normalized,
            )),
      )
      .slice(0, 60);
  }, [query, selectedIds]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-label="选择英灵"
        aria-modal="true"
        className="picker-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="picker-header">
          <div>
            <span className="eyebrow">CHOOSE A SERVANT</span>
            <h2>选择英灵</h2>
          </div>
          <button aria-label="关闭" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            aria-label="搜索英灵"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入英灵名、职阶或图鉴编号"
            value={query}
          />
          <kbd>ESC</kbd>
        </label>
        <div className="servant-results">
          {results.map((servant) => (
            <button
              className="servant-result"
              key={servant.id}
              onClick={() => onSelect(servant)}
            >
              <img alt="" loading="lazy" src={servant.face} />
              <span>
                <strong>{servant.name}</strong>
                <small>
                  No.{servant.collectionNo} ·{" "}
                  {CLASS_NAMES[servant.className] ?? servant.className} ·{" "}
                  {"★".repeat(servant.rarity)}
                </small>
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="empty-search">
              <span>✦</span>
              <p>没有找到匹配的英灵</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
