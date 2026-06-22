import type { PartySlot } from "../domain/types";

interface PartyCardProps {
  index: number;
  slot: PartySlot;
  onChoose: () => void;
  onClear: () => void;
  onSwapWithSupport: () => void;
}

export const PartyCard = ({
  index,
  slot,
  onChoose,
  onClear,
  onSwapWithSupport,
}: PartyCardProps) => (
  <article className={`party-card ${slot.servant ? "is-filled" : ""}`}>
    <div className="slot-label">
      <span>{slot.kind === "support" ? "SUPPORT" : `SLOT 0${index + 1}`}</span>
      <small>{slot.kind === "support" ? "助战" : index < 3 ? "前排" : "后备"}</small>
    </div>
    {slot.servant ? (
      <>
        <button className="servant-portrait" onClick={onChoose}>
          <img alt={slot.servant.name} src={slot.servant.face} />
          <span className="rarity">{"★".repeat(slot.servant.rarity)}</span>
        </button>
        <div className="servant-name">
          <strong>{slot.servant.name}</strong>
          <small>No.{slot.servant.collectionNo}</small>
        </div>
        <button
          aria-label={`移除${slot.servant.name}`}
          className="clear-slot"
          onClick={onClear}
        >
          ×
        </button>
        {slot.kind === "owned" && (
          <button className="swap-support" onClick={onSwapWithSupport}>
            与助战换位
          </button>
        )}
      </>
    ) : (
      <button className="empty-slot" onClick={onChoose}>
        <span>＋</span>
        <strong>选择英灵</strong>
        <small>点击搜索</small>
      </button>
    )}
  </article>
);
