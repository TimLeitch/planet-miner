import { GOODS, GoodId, Parts, UpgradeDef, upgradeCost } from '../game/data';
import { Action, GameState, canAfford, have } from '../game/state';

export type D = React.Dispatch<Action>;

export const cr = (n: number) => `${Math.floor(n).toLocaleString()} cr`;
export const perMin = (r: number) => (r * 60 >= 10 ? (r * 60).toFixed(0) : (r * 60).toFixed(1));

export function Cost({ s, credits, parts }: { s: GameState; credits: number; parts?: Parts }) {
  return (
    <span className="cost">
      <span className={s.credits >= credits ? '' : 'short'}>{cr(credits)}</span>
      {parts && (Object.entries(parts) as [GoodId, number][]).map(([g, n]) => (
        <span key={g} className={have(s, g) >= n ? '' : 'short'}> + {n} {GOODS[g].icon} {GOODS[g].name}</span>
      ))}
    </span>
  );
}

/** One upgrade row: level, current effect, next effect, cost and button. */
export function UpgradeRow({ s, u, level, onUpgrade }: { s: GameState; u: UpgradeDef; level: number; onUpgrade: () => void }) {
  const maxed = level >= u.max;
  const cost = maxed ? null : upgradeCost(u, level);
  const ok = cost ? canAfford(s, cost.credits, cost.parts) : false;
  return (
    <div className="upgrade">
      <div className="up-head">
        <b>{u.icon} {u.name}</b>
        <span className="pips" aria-label={`Level ${level} of ${u.max}`}>
          {Array.from({ length: u.max - u.start + 1 }, (_, i) => <i key={i} className={i <= level - u.start ? 'on' : ''} />)}
        </span>
      </div>
      <div className="small muted">{u.blurb}</div>
      <div className="small">Now: <b>{u.effect(level)}</b>{!maxed && <> → <span className="next">{u.effect(level + 1)}</span></>}</div>
      {maxed ? <span className="ok small">★ Maxed out</span> : (
        <button className={ok ? 'primary' : ''} disabled={!ok} onClick={onUpgrade}>
          Upgrade · <Cost s={s} credits={cost!.credits} parts={cost!.parts} />
        </button>
      )}
    </div>
  );
}

export function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className={`stat${warn ? ' warn' : ''}`}><small>{label}</small><b>{value}</b></div>;
}
