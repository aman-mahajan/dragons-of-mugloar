import { formatRep } from '../reputation';
import { Reputation } from '../types';

interface Props {
  rep: Reputation;
  busy: boolean;
  over: boolean;
  onInvestigate: () => void;
}

export function ReputationPanel({ rep, busy, over, onInvestigate }: Props) {
  const cells: [string, number][] = [
    ['People', rep.people],
    ['State', rep.state],
    ['Underworld', rep.underworld],
  ];

  return (
    <section className="panel">
      <header>
        <h2>Reputation</h2>
        <button
          type="button"
          onClick={onInvestigate}
          disabled={busy || over}
        >
          {busy ? 'Checking…' : 'Check (1 turn)'}
        </button>
      </header>
      <ul>
        {cells.map(([label, value]) => (
          <li key={label} className={(value || 0) <= -2 ? 'low' : ''}>
            <span>{label}</span>
            <strong>{formatRep(value)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
