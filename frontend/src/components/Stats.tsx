import { formatRep } from '../reputation';
import { Game } from '../types';

export function Stats({ game }: { game: Game }) {
  const cells: [string, number][] = [
    ['Lives', game.lives],
    ['Gold', game.gold],
    ['Score', game.score],
    ['Level', game.level],
    ['Turn', game.turn],
  ];
  return (
    <ul className="stats">
      {cells.map(([label, value]) => (
        <StatCell key={label} label={label} value={value} />
      ))}
    </ul>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <li>
      <span>{label}</span>
      <strong>{formatRep(value)}</strong>
    </li>
  );
}
