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

    <div className="result-metrics">
      <div>
        <span>全队加成</span>
        <strong>+{analysis.percentBonus}%</strong>
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
                  {slot.kind === "support"
                    ? "助战位"
                    : item.slotIndex < 3
                      ? `首发位 ${item.slotIndex + 1} · 羁绊 +20%`
                      : `后备位 ${item.slotIndex + 1}`}
                </small>
                <strong>{item.servant.name}</strong>
              </span>
            </div>
            <div className="equip-arrow" aria-hidden="true">
              →
            </div>
            <div className="recommendation-ce">
              <img alt="" src={item.craftEssence.image} />
              <span>
                <small>推荐礼装</small>
                <strong>{item.craftEssence.name}</strong>
              </span>
            </div>
            <p>
              {item.reason}
            </p>
            {item.calculation && (
              <ol className="calculation-steps">
                <li>
                  <span>礼装乘区</span>
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
