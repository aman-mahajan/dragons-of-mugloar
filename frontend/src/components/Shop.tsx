import { Game, ShopItem as ShopItemType } from '../types';

interface ShopProps {
  shop: ShopItemType[];
  game: Game;
  healHint: boolean;
  busy: boolean;
  onBuy: (item: ShopItemType) => void;
}

export function Shop({ shop, game, healHint, busy, onBuy }: ShopProps) {
  return (
    <section className="panel">
      <header>
        <h2>Shop</h2>
      </header>
      <ul>
        {shop.map((item) => (
          <ShopItem
            key={item.id}
            item={item}
            gold={game.gold}
            healHint={healHint}
            busy={busy}
            onBuy={onBuy}
          />
        ))}
      </ul>
    </section>
  );
}

function ShopItem({
  item,
  gold,
  healHint,
  busy,
  onBuy,
}: {
  item: ShopItemType;
  gold: number;
  healHint: boolean;
  busy: boolean;
  onBuy: (item: ShopItemType) => void;
}) {
  const canAfford = gold >= item.cost;
  const isHeal = item.id === 'hpot';

  return (
    <li className={isHeal && healHint ? 'highlight' : ''}>
      <div>
        <strong>{item.name}</strong>
        <span>{item.cost} gold</span>
      </div>
      <button
        type="button"
        className={isHeal ? 'primary' : ''}
        disabled={busy || !canAfford}
        onClick={() => onBuy(item)}
      >
        {canAfford ? 'Buy' : 'Too poor'}
      </button>
    </li>
  );
}
