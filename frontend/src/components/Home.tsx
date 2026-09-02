import { formatRep } from "../reputation";
import { loadGame, loadMaxScore } from "../storage";

interface Props {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function Home({ onNewGame, onLoadGame }: Props) {
  const maxScore = loadMaxScore();
  const hasSavedGame = Boolean(loadGame());

  return (
    <section className="center-panel">
      <p className="score">
        <span>Max score</span>
        <strong>{formatRep(maxScore)}</strong>
      </p>
      <div>
        <button type="button" className="primary" onClick={onNewGame}>
          Start new game
        </button>
        {hasSavedGame ? (
          <button type="button" onClick={onLoadGame}>
            Load current game
          </button>
        ) : (
          <button type="button" disabled>
            No game to load
          </button>
        )}
      </div>
    </section>
  )
}
