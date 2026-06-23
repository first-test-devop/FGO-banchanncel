import type { PointerEvent as ReactPointerEvent } from "react";
import type { BattleMode, PartySlot } from "../domain/types";
import { getServantBondTraits } from "../domain/servantTraits";
import { BOND_CRAFT_ESSENCES } from "../data/bondCraftEssences";

interface PartyCardProps {
  isDragging: boolean;
  isDropTarget: boolean;
  index: number;
  slot: PartySlot;
  battleMode: BattleMode;
  onChoose: () => void;
  onClear: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onSwapWithSupport: () => void;
  onToggleGrand: () => void;
}

export const PartyCard = ({
  isDragging,
  isDropTarget,
  index,
  slot,
  battleMode,
  onChoose,
  onClear,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSwapWithSupport,
  onToggleGrand,
}: PartyCardProps) => {
  const supportCraftEssence =
    slot.kind === "support" && slot.supportCraftEssence?.id
      ? BOND_CRAFT_ESSENCES.find(
          ({ id }) => id === slot.supportCraftEssence?.id,
        )
      : null;
  const supportRewardCraftEssence =
    slot.kind === "support" && slot.supportRewardCraftEssence?.id
      ? BOND_CRAFT_ESSENCES.find(
          ({ id }) => id === slot.supportRewardCraftEssence?.id,
        )
      : null;

  return (
  <article
    aria-label={`${slot.kind === "support" ? "助战" : "自有"}卡槽 ${index + 1}${slot.servant ? `：${slot.servant.name}` : "：空"}`}
    className={[
      "party-card",
      slot.servant ? "is-filled" : "",
      battleMode === "grand" && slot.isGrand ? "is-grand" : "",
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
      <span>
        {battleMode === "grand" && slot.isGrand
          ? slot.kind === "support"
            ? "GRAND SUPPORT"
            : "GRAND SERVANT"
          : slot.kind === "support"
            ? "SUPPORT"
            : `SLOT 0${index + 1}`}
      </span>
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
          <small>
            No.{slot.servant.collectionNo}
            {slot.kind === "owned" ? ` · Cost ${slot.servant.cost}` : ""}
          </small>
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
        {supportCraftEssence && (
          <div className="support-ce-badge">
            <img alt="" src={supportCraftEssence.image} />
            <span>
              <small>固定助战礼装</small>
              <strong>{supportCraftEssence.shortName}</strong>
              <i>
                {supportCraftEssence.hasMlbEffect
                  ? slot.supportCraftEssence?.state === "mlb"
                    ? "满破"
                    : "未满破"
                  : "已持有"}
              </i>
            </span>
          </div>
        )}
        {slot.kind === "support" &&
          slot.supportCraftEssence &&
          !slot.supportCraftEssence.id && (
            <div className="support-ce-badge support-ce-empty-badge">
              <span className="support-empty-icon">—</span>
              <span>
                <small>固定助战礼装</small>
                <strong>不携带礼装</strong>
              </span>
            </div>
          )}
        {battleMode === "grand" &&
          slot.kind === "support" &&
          slot.isGrand && (
            <div className="support-reward-ce-badge">
              {supportRewardCraftEssence ? (
                <img alt="" src={supportRewardCraftEssence.image} />
              ) : (
                <span>—</span>
              )}
              <small>
                位 3：{supportRewardCraftEssence?.shortName ?? "空"}
              </small>
            </div>
          )}
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
        {battleMode === "grand" && (
          <button className="grand-toggle" onClick={onToggleGrand}>
            {slot.isGrand ? "已设为冠位" : "设为冠位"}
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
};
