import type { PointerEvent as ReactPointerEvent } from "react";
import type { PartySlot } from "../domain/types";
import { getServantBondTraits } from "../domain/servantTraits";

interface PartyCardProps {
  isDragging: boolean;
  isDropTarget: boolean;
  index: number;
  slot: PartySlot;
  onChoose: () => void;
  onClear: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onSwapWithSupport: () => void;
}

export const PartyCard = ({
  isDragging,
  isDropTarget,
  index,
  slot,
  onChoose,
  onClear,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSwapWithSupport,
}: PartyCardProps) => (
  <article
    aria-label={`${slot.kind === "support" ? "助战" : "自有"}卡槽 ${index + 1}${slot.servant ? `：${slot.servant.name}` : "：空"}`}
    className={[
      "party-card",
      slot.servant ? "is-filled" : "",
      isDragging ? "is-dragging" : "",
      isDropTarget ? "is-drop-target" : "",
    ]
      .filter(Boolean)
      .join(" ")}
    data-slot-index={index}
    onPointerCancel={onPointerUp}
    onPointerDown={slot.servant ? onPointerDown : undefined}
    onPointerMove={slot.servant ? onPointerMove : undefined}
    onPointerUp={slot.servant ? onPointerUp : undefined}
  >
    <div className="slot-label">
      <span>{slot.kind === "support" ? "SUPPORT" : `SLOT 0${index + 1}`}</span>
      <small>{slot.kind === "support" ? "助战" : index < 3 ? "前排" : "后备"}</small>
    </div>
    {slot.servant ? (
      <>
        <div className="drag-hint" aria-hidden="true">
          <span>⠿</span>
          按住拖动
        </div>
        <button className="servant-portrait" onClick={onChoose}>
          <img
            alt={slot.servant.name}
            draggable={false}
            src={slot.servant.face}
          />
          <span className="rarity">{"★".repeat(slot.servant.rarity)}</span>
        </button>
        <div className="servant-name">
          <strong>{slot.servant.name}</strong>
          <small>No.{slot.servant.collectionNo}</small>
          <span className="party-trait-preview">
            {getServantBondTraits(slot.servant)
              .slice(0, 3)
              .map((trait) => (
                <i key={trait.id} title={trait.description}>
                  {trait.label}
                </i>
              ))}
          </span>
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
