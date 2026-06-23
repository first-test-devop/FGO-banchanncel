import type { BondAnalysis, PartySlot } from "../domain/types";

interface AnalysisResultProps {
  analysis: BondAnalysis;
  party: PartySlot[];
}

export const AnalysisResult = ({
  analysis,
  party,
}: AnalysisResultProps) => (
  <section className="result-section" id="analysis-result">
    <div className="result-heading">
      <div>
        <span className="eyebrow">OPTIMAL LOADOUT</span>
        <h2>最优羁绊方案</h2>
      </div>
      <div className="total-bond">
        <small>本局预计总羁绊</small>
        <strong>{analysis.totalPartyBond.toLocaleString()}</strong>
        <span>
          +{(analysis.totalPartyBond - analysis.baseTotal).toLocaleString()}
        </span>
      </div>
    </div>

    <div className="cost-summary">
      <div>
        <span>编队 Cost</span>
        <strong>
          {analysis.partyCost} / {analysis.maxPartyCost}
        </strong>
      </div>
      <p>
        自有从者 {analysis.servantCost} + 自有礼装{" "}
        {analysis.craftEssenceCost}
        <small>助战从者及其固定礼装不计 Cost</small>
      </p>
      <span>剩余 {analysis.remainingCost}</span>
    </div>

    <div className="result-metrics">
      <div>
        <span>礼装百分比</span>
        <strong>
          +
          {analysis.minEquipmentPercent === analysis.maxEquipmentPercent
            ? analysis.minEquipmentPercent
            : `${analysis.minEquipmentPercent}–${analysis.maxEquipmentPercent}`}
          %
        </strong>
      </div>
      <div>
        <span>固定加成</span>
        <strong>+{analysis.flatBonus}</strong>
      </div>
      <div>
        <span>站位规则</span>
        <strong>
          首发 +20%
          {analysis.supportInStartingLineup ? " · 全队 +4%" : ""}
        </strong>
      </div>
      <div>
        <span>单名实际羁绊</span>
        <strong>
          {analysis.minServantBond === analysis.maxServantBond
            ? analysis.minServantBond
            : `${analysis.minServantBond}–${analysis.maxServantBond}`}
        </strong>
      </div>
    </div>

    <div className="recommendation-list">
      {analysis.recommendations.map((item, resultIndex) => {
        const slot = party[item.slotIndex];
        return (
          <article className="recommendation-card" key={item.slotIndex}>
            <div className="recommendation-index">
              {String(resultIndex + 1).padStart(2, "0")}
            </div>
            <div className="recommendation-servant">
              <img alt="" src={item.servant.face} />
              <span>
                <small>
                  {item.isGrand
                    ? slot.kind === "support"
                      ? "冠位助战"
                      : item.slotIndex < 3
                        ? `自有冠位 · 首发位 ${item.slotIndex + 1}`
                        : `自有冠位 · 后备位 ${item.slotIndex + 1}`
                    : slot.kind === "support"
                      ? "助战位"
                    : item.slotIndex < 3
                      ? `首发位 ${item.slotIndex + 1} · 羁绊 +20%`
                      : `后备位 ${item.slotIndex + 1}`}
                </small>
                <strong>{item.servant.name}</strong>
                <span className="trait-tags result-trait-tags">
                  {item.servantTraits.map((trait) => (
                    <i key={trait.id} title={trait.description}>
                      {trait.label}
                    </i>
                  ))}
                </span>
              </span>
            </div>
            <div className="equip-arrow" aria-hidden="true">
              →
            </div>
            <div className="recommendation-loadout">
              {item.equippedCraftEssences.map((equipment) => (
                <div
                  className="recommendation-ce"
                  key={equipment.slotLabel}
                >
                  {equipment.craftEssence.image ? (
                    <img alt="" src={equipment.craftEssence.image} />
                  ) : (
                    <div className="empty-ce-image" aria-hidden="true">
                      —
                    </div>
                  )}
                  <span>
                    <small>
                      {equipment.slotLabel} · Cost {equipment.effectiveCost}
                    </small>
                    <strong>{equipment.craftEssence.name}</strong>
                  </span>
                </div>
              ))}
              {item.isGrand && (
                <div className="locked-bond-ce">
                  <span>2</span>
                  <small>礼装位 2</small>
                  <strong>自身羁绊礼装</strong>
                  <i>固定 · Cost 0 · 不参与优化</i>
                </div>
              )}
            </div>
            <div className="equipment-reasons">
              {item.equippedCraftEssences.map((equipment) => (
                <div key={equipment.slotLabel}>
                  <strong>{equipment.slotLabel}</strong>
                  <p>{equipment.reason}</p>
                  {equipment.craftEssence.target &&
                    equipment.matchedBeneficiaries.length > 0 && (
                      <small>
                        受益：
                        {equipment.matchedBeneficiaries
                          .map(
                            ({ servantName, matchedTraits }) =>
                              `${servantName}（${matchedTraits.join(" + ")}）`,
                          )
                          .join("、")}
                      </small>
                    )}
                </div>
              ))}
            </div>
            {item.calculation && (
              <ol className="calculation-steps">
                <li>
                  <span>礼装乘区</span>
                  {item.calculation.equipmentBreakdown.length > 0 && (
                    <small>
                      {item.calculation.equipmentBreakdown
                        .map(
                          ({ name, value, stateLabel }) =>
                            `${name}（${stateLabel}）${value}%`,
                        )
                        .join(" + ")}
                    </small>
                  )}
                  <code>
                    ⌊{item.calculation.baseBond} × (1 +{" "}
                    {item.calculation.equipmentPercent}% +{" "}
                    {item.calculation.activityPercent}%)⌋ ={" "}
                    {item.calculation.afterEquipment}
                  </code>
                </li>
                <li>
                  <span>站位乘区</span>
                  <code>
                    ⌊{item.calculation.afterEquipment} × (1 +{" "}
                    {item.calculation.startingMemberPercent}% +{" "}
                    {item.calculation.supportSharePercent}%)⌋ ={" "}
                    {item.calculation.afterPosition}
                  </code>
                </li>
                <li>
                  <span>固定羁绊</span>
                  <code>
                    {item.calculation.afterPosition} +{" "}
                    {item.calculation.fixedBonus} ={" "}
                    <b>{item.calculation.finalBond}</b>
                  </code>
                </li>
              </ol>
            )}
          </article>
        );
      })}
    </div>

    <div className="analysis-notes">
      <strong>计算说明</strong>
      <ul>
        {analysis.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  </section>
);
