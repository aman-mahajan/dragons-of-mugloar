import { useEffect, useRef, useState } from 'react';
import { decodeAd, sortAds } from '../ads';
import { buyItem, errMessage, getMessages, getReputation, getShop, solveAd, startGame } from '../api';
import {
  EMPTY_REP,
  fromLive,
  lowFactions,
  REP_STALE_AFTER,
  suggestAd,
} from '../reputation';
import { clearGame, loadGame, loadMaxScore, loadRecs, noteScore, saveGame, saveRecs } from '../storage';
import { Ad, Game, Reputation, ShopItem } from '../types';
import { AdList } from './AdList';
import { ReputationPanel } from './Reputation';
import { Shop } from './Shop';
import { Stats } from './Stats';

export type Mode = 'new' | 'load';

export function Play({ mode, onHome }: { mode: Mode; onHome: () => void }) {
  const initStarted = useRef(false);

  const [game, setGame] = useState<Game | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [shop, setShop] = useState<ShopItem[]>([]);
  const [rep, setRep] = useState(EMPTY_REP);
  const [repTurn, setRepTurn] = useState(0);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [busy, setBusy] = useState(false);
  const [maxScore, setMaxScore] = useState(loadMaxScore());
  const [recommendationsOn, setRecommendationsOn] = useState(loadRecs());
  const [reputationLoading, setReputationLoading] = useState(false);

  const over = Boolean(game && game.lives <= 0);
  const suggested = over || !recommendationsOn ? null : suggestAd(ads, rep);
  const suggestedId = suggested?.adId ?? null;
  const healHint = Boolean(game && !over && game.lives < 3);
  const low = lowFactions(rep);

  function setRecs(on: boolean) {
    saveRecs(on);
    setRecommendationsOn(on);
  }

  function persist(nextGame: Game, nextRep: Reputation, nextRepTurn: number) {
    saveGame({
      game: nextGame,
      rep: nextRep,
      repTurn: nextRepTurn,
    });
    setMaxScore(loadMaxScore());
  }

  function commit(nextGame: Game, nextRep: Reputation, nextRepTurn: number) {
    setGame(nextGame);
    setRep(nextRep);
    setRepTurn(nextRepTurn);
    if (nextGame.lives > 0) {
      persist(nextGame, nextRep, nextRepTurn);
    } else {
      noteScore(nextGame.score);
      clearGame();
      setMaxScore(loadMaxScore());
    }
  }

  async function loadBoard(gameId: string) {
    const [msgs, items] = await Promise.all([getMessages(gameId), getShop(gameId)]);
    setAds(sortAds((Array.isArray(msgs) ? msgs : []).map(decodeAd).filter((ad): ad is Ad => ad != null)));
    setShop(Array.isArray(items) ? items : []);
  }

  async function autoInvestigate(
    nextGame: Game,
    nextRep: Reputation,
    nextRepTurn: number,
    note: string,
  ) {
    if (nextGame.lives <= 0) {
      commit(nextGame, nextRep, nextRepTurn);
      setFlash(note);
      return;
    }
    if (!recommendationsOn || nextGame.turn - nextRepTurn < REP_STALE_AFTER) {
      commit(nextGame, nextRep, nextRepTurn);
      setFlash(note);
      await loadBoard(nextGame.gameId);
      return;
    }
    setReputationLoading(true);
    try {
      const live = await getReputation(nextGame.gameId);
      const fresh = fromLive(live);
      const after: Game = { ...nextGame, turn: (nextGame.turn || 0) + 1 };
      commit(after, fresh, after.turn);
      setFlash(`${note} Reputation auto-checked (costs a turn).`);
      await loadBoard(after.gameId);
    } catch (e) {
      const msg = errMessage(e);
      if (/game over/i.test(msg)) {
        const dead = { ...nextGame, lives: 0 };
        commit(dead, nextRep, nextRepTurn);
        throw e;
      }
      commit(nextGame, nextRep, nextRepTurn);
      setFlash(note);
      await loadBoard(nextGame.gameId);
    } finally {
      setReputationLoading(false);
    }
  }

  function goHome() {
    if (game && game.lives > 0) {
      persist(game, rep, repTurn);
    }
    onHome();
  }

  async function begin() {
    setBusy(true);
    setError('');
    setFlash('');
    setAds([]);
    setShop([]);
    setRep(EMPTY_REP);
    setRepTurn(0);
    try {
      const started = await startGame();
      setGame(started);
      setRep(EMPTY_REP);
      setRepTurn(started.turn);
      await loadBoard(started.gameId);
    } catch (e) {
      setError(errMessage(e));
      setGame(null);
      onHome();
    } finally {
      setBusy(false);
    }
  }

  async function loadCurrent() {
    const saved = loadGame();
    if (!saved) {
      onHome();
      return;
    }
    setBusy(true);
    setError('');
    setFlash('');
    try {
      await autoInvestigate(saved.game, saved.rep, saved.repTurn, '');
    } catch (e) {
      const msg = errMessage(e);
      setError(msg);
      if (/game over/i.test(msg)) {
        setMaxScore(loadMaxScore());
      } else {
        onHome();
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSolve(ad: Ad) {
    if (!game || busy || over) return;
    setBusy(true);
    setError('');
    setFlash('');
    try {
      const res = await solveAd(game.gameId, ad.adId);
      const nextGame: Game = {
        ...game,
        lives: res.lives,
        gold: res.gold,
        score: res.score,
        highScore: res.highScore,
        turn: res.turn,
      };
      await autoInvestigate(
        nextGame,
        rep,
        repTurn,
        res.message || (res.success ? 'Mission complete.' : 'Mission failed.'),
      );
    } catch (e) {
      const msg = errMessage(e);
      setError(msg);
      if (/game over/i.test(msg)) {
        const dead = { ...game, lives: 0 };
        commit(dead, rep, repTurn);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onBuy(item: ShopItem) {
    if (!game || busy || over) return;
    setBusy(true);
    setError('');
    setFlash('');
    try {
      const res = await buyItem(game.gameId, item.id);
      const nextGame: Game = {
        ...game,
        gold: res.gold,
        lives: res.lives,
        level: res.level,
        turn: res.turn,
      };
      await autoInvestigate(
        nextGame,
        rep,
        repTurn,
        res.shoppingSuccess ? `Bought ${item.name}.` : `Could not buy ${item.name}.`,
      );
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onInvestigate() {
    if (!game || busy || over) return;
    setBusy(true);
    setError('');
    setFlash('');
    try {
      const live = await getReputation(game.gameId);
      const nextRep = fromLive(live);
      const nextGame: Game = { ...game, turn: (game.turn || 0) + 1 };
      commit(nextGame, nextRep, nextGame.turn);
      setFlash('Reputation investigated (costs a turn).');
      await loadBoard(game.gameId);
    } catch (e) {
      const msg = errMessage(e);
      setError(msg);
      if (/game over/i.test(msg)) {
        const dead = { ...game, lives: 0 };
        commit(dead, rep, repTurn);
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;
    if (mode === 'new') begin();
    else loadCurrent();
  }, []);

  if (!game) {
    return (
      <section className="center-panel">
        <p>Loading…</p>
        {error && <p className="banner alert">{error}</p>}
      </section>
    );
  }

  return (
    <>
      <p>
        <button type="button" onClick={goHome} disabled={busy}>
          Home
        </button>
      </p>
      <Stats game={game} />
      <div className="panel row">
        <label>
          <input
            type="checkbox"
            checked={recommendationsOn}
            disabled={busy || over}
            onChange={(e) => setRecs(e.target.checked)}
          />
          Recommendations
        </label>
        <p>Reputation check every few turns when on. Each check costs 1 turn.</p>
      </div>

      {over && (
        <section className="center-panel">
          <h2>Game over</h2>
          <p>
            Final score <strong>{game.score}</strong>
            {maxScore ? ` · max score ${maxScore}` : ''}.
          </p>
          <button type="button" className="primary" onClick={begin} disabled={busy}>
            {busy ? 'Loading…' : 'Start new game'}
          </button>
        </section>
      )}

      {error && <p className="banner alert">{error}</p>}
      {flash && !error && (
        <p className={`banner${/fail|defeat|could not/i.test(flash) ? ' alert' : ''}`}>{flash}</p>
      )}
      {healHint && (
        <p className="banner">Lives are low — buy a healing potion (50 gold).</p>
      )}
      {recommendationsOn && low.length > 0 && !over && (
        <p className="banner">
          {low.join(', ')} reputation is low. Suggested picks will avoid jobs that push it lower.
        </p>
      )}

      {!over && (
        <div className="board">
          <AdList
            ads={ads}
            suggestedId={suggestedId}
            recommend={recommendationsOn}
            rep={rep}
            busy={busy}
            onSolve={onSolve}
          />
          <div className="side">
            <ReputationPanel
              rep={rep}
              busy={reputationLoading}
              over={over}
              onInvestigate={onInvestigate}
            />
            <Shop shop={shop} game={game} healHint={healHint} busy={busy} onBuy={onBuy} />
          </div>
        </div>
      )}
    </>
  );
}
