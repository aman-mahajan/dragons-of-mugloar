import { isSketchy, putSuggestedFirst, rewardVsRisk, riskLevel } from '../ads';
import { hurtsLowFaction } from '../reputation';
import { Ad as AdType, Reputation } from '../types';

interface ListProps {
  ads: AdType[];
  suggestedId: string | null;
  recommend: boolean;
  rep: Reputation;
  busy: boolean;
  onSolve: (ad: AdType) => void;
};

export function AdList({ ads, suggestedId, recommend, rep, busy, onSolve }: ListProps) {
  const displayAds = putSuggestedFirst(ads, suggestedId);

  return (
    <section className="panel">
      <header>
        <h2>Tavern board</h2>
        <span>
          {recommend ? 'Sorted safest first · suggested pick highlighted' : 'Sorted safest first'}
        </span>
      </header>
      {ads.length === 0 ? (
        <p>No ads right now.</p>
      ) : (
        <ul>
          {displayAds.map((ad) => (
            <Ad
              key={ad.adId}
              ad={ad}
              suggested={suggestedId === ad.adId}
              rep={rep}
              busy={busy}
              onSolve={onSolve}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function Ad({
  ad,
  suggested,
  rep,
  busy,
  onSolve,
}: {
  ad: AdType;
  suggested: boolean;
  rep: Reputation;
  busy: boolean;
  onSolve: (ad: AdType) => void;
}) {
  const risk = riskLevel(ad.probability);
  const ratio = rewardVsRisk(ad);
  const hurts = hurtsLowFaction(ad, rep);

  return (
    <li className={`ad risk-${risk}${suggested ? ' highlight' : ''}`}>
      <header>
        <span className="tag">
          {ad.probability}
        </span>
        <strong>+{ad.reward} gold</strong>
        {ratio && <span>reward/risk {ratio}</span>}
        <span>expires in {ad.expiresIn}</span>
      </header>
      <p>
        {ad.message}
      </p>
      <footer>
        {suggested && <span className="tag">Suggested</span>}
        {hurts && <span className="tag warn">Hurts a low faction</span>}
        {isSketchy(ad.message) && (
          <span className="tag warn">Steal / kill — extra risk</span>
        )}
        <button type="button" disabled={busy} onClick={() => onSolve(ad)}>
          Solve
        </button>
      </footer>
    </li>
  );
}
