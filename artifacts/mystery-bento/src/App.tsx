import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { BookOpen, ChevronRight, Eye, LockKeyhole, RotateCcw, SkipForward, Sparkles, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

type MeterState = { progress: number; lastAcknowledgement: string };
type Persona = {
  id: string;
  name: string;
  flavorText: string;
  traits: { speed: number; balance: number; focus: number; luck: number; chaos: number };
  silhouetteKey: string;
  idleAnimationKey: string;
};
type ContestLedgerEntry = {
  id: string;
  contestName: string;
  contestants: string[];
  winner: string;
  memorableEvent: string;
  collectibleId: string;
  completedAt: string;
};
type Collectible = {
  id: string;
  kind: string;
  title: string;
  description: string;
  earnedBy: string;
  earnedAt: string;
};
type FoodItem = { id: string; name: string; note: string; glyph: string; color: string };
type ContestOutcome = { winner: Persona; memorableEvent: string; contestName: string };

const queryClient = new QueryClient();
const METER_KEY = 'mystery-bento-meter';
const LEDGER_KEY = 'mystery-bento-ledger';
const CURIO_KEY = 'mystery-bento-curios';

const personas: Persona[] = [
  { id: 'miso', name: 'Miso', flavorText: 'A meticulous tea spirit who counts every last leaf.', traits: { speed: 62, balance: 94, focus: 98, luck: 58, chaos: 12 }, silhouetteKey: 'crown', idleAnimationKey: 'hover', },
  { id: 'toro', name: 'Captain Toro', flavorText: 'A dramatic retired tuna captain with a foghorn laugh.', traits: { speed: 72, balance: 76, focus: 53, luck: 81, chaos: 86 }, silhouetteKey: 'toro', idleAnimationKey: 'sway', },
  { id: 'puck', name: 'Puck', flavorText: 'A cheerful rice-ball courier who never misses a shortcut.', traits: { speed: 96, balance: 70, focus: 74, luck: 77, chaos: 48 }, silhouetteKey: 'puck', idleAnimationKey: 'bounce', },
  { id: 'luma', name: 'Luma', flavorText: 'A sleepy cat-food critic with a very serious palate.', traits: { speed: 35, balance: 82, focus: 87, luck: 68, chaos: 29 }, silhouetteKey: 'cat', idleAnimationKey: 'blink', },
  { id: 'nori', name: 'Nori', flavorText: 'A tiny mushroom chef wielding an oversized ladle.', traits: { speed: 55, balance: 88, focus: 91, luck: 64, chaos: 61 }, silhouetteKey: 'mushroom', idleAnimationKey: 'stir', },
  { id: 'rin', name: 'Radish Rin', flavorText: 'A hyperactive radish mascot who runs on pure fizz.', traits: { speed: 99, balance: 45, focus: 49, luck: 89, chaos: 97 }, silhouetteKey: 'rin', idleAnimationKey: 'zip', },
];

const foodItems: FoodItem[] = [
  { id: 'tamago', name: 'Sunset tamago', note: 'soft, sweet, perfectly tucked', glyph: 'circle', color: '#ed9560' },
  { id: 'plum', name: 'Plum onigiri', note: 'a bright little secret', glyph: 'triangle', color: '#c96575' },
  { id: 'tofu', name: 'Sesame tofu', note: 'quietly nutty, cool as moonlight', glyph: 'square', color: '#d8bd78' },
  { id: 'eel', name: 'Lantern eel', note: 'smoky ribbons from the night stall', glyph: 'leaf', color: '#7d9c74' },
];

const acknowledgements = [
  'The stall keeper nods. Good instinct.',
  'A tiny bell rings somewhere behind the curtain.',
  'The lanterns brighten by one warm pixel.',
  'A secret recipe card slips into the breeze.',
  'The conveyor gives a pleased little shudder.',
];

const contestNames = [
  'Bento Dash',
  'Lantern Ladle League',
  'The Midnight Maki Match',
  'Wobble Plate Relay',
  'Tea Tray Twilight Trial',
];

const collectiblePool = [
  { id: 'recipe-midnight-sauce', kind: 'recipe fragment', title: 'The Unfinished Midnight Sauce', description: 'A recipe-card fragment with one suspiciously important ingredient missing.', earnedBy: 'miso' },
  { id: 'lantern-warm-glow', kind: 'lantern charm', title: 'Warm-Glow Wisp', description: 'A tiny charm that remembers the softest light in the alley.', earnedBy: 'toro' },
  { id: 'chef-ladle-champion', kind: 'chef sticker', title: 'Ladle Champion', description: 'A shiny sticker for a chef who made one enormous spoon look graceful.', earnedBy: 'nori' },
  { id: 'plate-moon-checker', kind: 'plate pattern', title: 'Moonlit Checker', description: 'A ceramic plate pattern in the exact colors of a late-night shortcut.', earnedBy: 'luma' },
  { id: 'snapshot-great-wobble', kind: 'victory snapshot', title: 'The Great Wobble', description: 'A framed snapshot of a rice ball refusing to give up.', earnedBy: 'puck' },
  { id: 'radish-spark-sticker', kind: 'chef sticker', title: 'Radish Spark', description: 'A zippy little sticker that seems to vibrate when nobody is looking.', earnedBy: 'rin' },
];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithRng<T>(items: T[], rng: () => number) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function resolveContest(contestants: Persona[], rng: () => number): ContestOutcome {
  const scored = contestants.map((persona) => {
    const traitScore =
      persona.traits.speed * 0.28 +
      persona.traits.balance * 0.2 +
      persona.traits.focus * 0.2 +
      persona.traits.luck * 0.17 +
      (100 - persona.traits.chaos) * 0.15;
    return { persona, score: traitScore + (rng() * 22 - 11) };
  }).sort((a, b) => b.score - a.score);
  const winner = scored[0]?.persona ?? contestants[0] ?? personas[0];
  const eventByPersona: Record<string, string> = {
    miso: 'Miso takes a perfect turn, right on the invisible line.',
    toro: 'Captain Toro pauses for a dramatic bow, then sails across the finish.',
    puck: 'Puck trips over enthusiasm, then sprints ahead with a grin.',
    luma: 'Luma stops to judge the plating and somehow gains ground.',
    nori: "Nori's oversized ladle saves the wobbling stack!",
    rin: 'Radish Rin zooms into a harmless pile of cushions and bounces onward.',
  };
  return {
    winner,
    memorableEvent: eventByPersona[winner.id] ?? `${winner.name} finds a curious shortcut.`,
    contestName: contestNames[Math.floor(rng() * contestNames.length)] ?? contestNames[0],
  };
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? (JSON.parse(saved) as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue] as const;
}

function FoodGlyph({ item }: { item: FoodItem }) {
  return <div className={`food-glyph ${item.glyph}`} style={{ '--food-color': item.color } as CSSProperties} aria-hidden="true" />;
}

function PersonaPortrait({ persona, large = false }: { persona: Persona; large?: boolean }) {
  const color = { miso: '#c98b61', toro: '#d65f52', puck: '#e9ae55', luma: '#9b83ad', nori: '#83a66f', rin: '#de7260' }[persona.id];
  return (
    <div className={`persona-orb ${persona.silhouetteKey} ${large ? 'scale-125' : ''}`} style={{ '--persona-color': color } as CSSProperties} aria-hidden="true">
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 w-7 rounded-full bg-[#30223c]/40" />
    </div>
  );
}

function Header({ onOpenCurio, ledgerCount, curioCount }: { onOpenCurio: (view: 'shelf' | 'ledger') => void; ledgerCount: number; curioCount: number }) {
  return (
    <header className="topbar border-b-2 border-[#17121e]">
      <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="logo-mark" aria-hidden="true"><div className="logo-bento" /></div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">Mystery Bento</div>
            <div className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f5c968]">after-hours food club</div>
          </div>
        </div>
        <nav className="flex items-center gap-2" aria-label="Collection navigation">
          <button type="button" onClick={() => onOpenCurio('shelf')} className="curio-button flex items-center gap-2 rounded-md border border-[#66536f] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:border-[#f5c968]" data-testid="button-open-shelf">
            <Sparkles className="h-4 w-4 text-[#f5c968]" aria-hidden="true" /><span className="hidden sm:inline">Curio shelf</span><span className="font-mono-ui text-[#f5c968]">{curioCount}</span>
          </button>
          <button type="button" onClick={() => onOpenCurio('ledger')} className="curio-button flex items-center gap-2 rounded-md border border-[#66536f] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:border-[#f5c968]" data-testid="button-open-ledger">
            <BookOpen className="h-4 w-4 text-[#f5c968]" aria-hidden="true" /><span className="hidden sm:inline">Ledger</span><span className="font-mono-ui text-[#f5c968]">{ledgerCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function Meter({ meter, onPointerStart, onPointerEnd, onMeterKeyDown, onMeterKeyUp, onContextMenu, meterPulse, isHolding }: { meter: MeterState; onPointerStart: (event: PointerEvent<HTMLDivElement>) => void; onPointerEnd: () => void; onMeterKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void; onMeterKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void; onContextMenu: (event: MouseEvent<HTMLDivElement>) => void; meterPulse: boolean; isHolding: boolean }) {
  return (
    <section className={`rounded-xl bg-[#f2d7a0] p-4 text-[#30223c] ${meterPulse ? 'bump' : ''}`} aria-labelledby="meter-heading">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2 id="meter-heading" className="font-display text-sm font-bold uppercase tracking-[.12em]">Mystery Bento Meter</h2>
          <p className="mt-1 text-xs text-[#6c4d51]">Fill the tray. Something curious is waiting.</p>
        </div>
        <div className="meter-rune" role="img" aria-label={`${meter.progress} percent charged`}><span>{meter.progress}</span></div>
      </div>
      <div className={`meter-track ${isHolding ? 'is-holding' : ''}`} role="progressbar" aria-label="Mystery Bento Meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={meter.progress} tabIndex={0} onPointerDown={onPointerStart} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onPointerLeave={onPointerEnd} onKeyDown={onMeterKeyDown} onKeyUp={onMeterKeyUp} onContextMenu={onContextMenu} data-testid="meter-charge-control">
        <div className={`meter-fill ${meter.progress >= 100 ? 'is-full' : ''}`} style={{ width: `${meter.progress}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono-ui text-[10px] uppercase tracking-wider text-[#765752]">
        <span data-testid="status-meter-acknowledgement">{meter.lastAcknowledgement}</span><span>{meter.progress >= 100 ? 'contest ready' : 'collecting'}</span>
      </div>
    </section>
  );
}

function ContestOverlay({ contestants, winner, step, contestName, memorableEvent, onSkip, onClose }: { contestants: Persona[]; winner: Persona | null; step: 'intro' | 'matchup' | 'winner'; contestName: string; memorableEvent: string; onSkip: () => void; onClose: () => void }) {
  const eventText = winner ? memorableEvent : 'The three silhouettes take their places beneath the market lantern.';
  return (
    <div className="contest-backdrop fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="contest-title">
      <div className="contest-stage modal-scroll w-full max-w-3xl rounded-xl p-5 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#f5c968]">live from the back alley</div><h2 id="contest-title" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{contestName}</h2></div>
          <button type="button" className="flex items-center gap-2 border border-[#806a85] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:bg-[#f5c968] hover:text-[#30223c]" onClick={onSkip} data-testid="button-skip-contest"><SkipForward className="h-4 w-4" aria-hidden="true" />Skip scene</button>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#d8c6af]">{step === 'intro' ? 'The curtain lifts. No votes, no wagers — just three peculiar regulars and one very good story.' : step === 'matchup' ? 'Their signature quirks collide in a blur of steam, speed, and suspiciously elegant footwork.' : eventText}</p>
        <div className="my-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {contestants.map((persona, index) => (
            <div key={persona.id} className={`persona-tile rounded-lg p-4 text-center transition-transform ${winner?.id === persona.id ? 'scale-[1.04] ring-4 ring-[#f5c968]' : ''}`} data-testid={`card-contestant-${persona.id}`}>
              <PersonaPortrait persona={persona} large={winner?.id === persona.id} />
              <h3 className="font-display text-lg font-bold">{persona.name}</h3>
              <p className="mt-1 min-h-10 text-xs leading-4 text-[#765752]">{persona.flavorText}</p>
              <div className="mt-3 flex justify-center gap-1" aria-label={`${persona.name} contest traits`}>
                {[persona.traits.speed, persona.traits.focus, persona.traits.luck].map((trait, traitIndex) => <span key={traitIndex} className={`h-1.5 w-5 ${trait > 75 ? 'bg-[#37745c]' : 'bg-[#d8b879]'}`} />)}
              </div>
              {winner?.id === persona.id && <div className="mt-4"><span className="winner-stamp">LANE WINNER</span></div>}
              {step === 'matchup' && index === 1 && <div className="mt-3 font-mono-ui text-[10px] uppercase tracking-wider text-[#b88f66]">making a scene</div>}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#64516b] pt-5 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-[#bca99b]"><Eye className="h-4 w-4 text-[#f5c968]" aria-hidden="true" />Spectator mode · the stall handles the rest</div>
          {winner && <button type="button" onClick={onClose} className="flex items-center gap-2 bg-[#f5c968] px-5 py-3 text-sm font-extrabold text-[#30223c] shadow-[4px_4px_0_#17121e] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none" data-testid="button-close-contest">Return to the stall <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>}
        </div>
      </div>
    </div>
  );
}

function CurioOverlay({ view, ledger, collectibles, onClose, onReset }: { view: 'shelf' | 'ledger'; ledger: ContestLedgerEntry[]; collectibles: Collectible[]; onClose: () => void; onReset: () => void }) {
  return (
    <div className="contest-backdrop fixed inset-0 z-20 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="curio-title">
      <div className="modal-scroll pixel-card w-full max-w-2xl rounded-xl bg-[#f5e8c9] p-5 text-[#30223c] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a34d43]">the things we keep</div><h2 id="curio-title" className="mt-2 font-display text-3xl font-bold">{view === 'shelf' ? 'Kitchen Curio Shelf' : 'Contest Ledger'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-[#e6ce9d]" aria-label="Close collection" data-testid="button-close-collection"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        {view === 'shelf' ? (
          collectibles.length ? <div className="grid gap-4 sm:grid-cols-2">{collectibles.map((item) => <article key={item.id} className="pixel-card rounded-lg bg-[#fff3d5] p-4" data-testid={`card-collectible-${item.id}`}><div className="mb-4 flex items-center justify-between"><div className="grid h-11 w-11 place-items-center border-2 border-[#30223c] bg-[#f5c968] text-[#30223c]"><Sparkles className="h-5 w-5" aria-hidden="true" /></div><span className="font-mono-ui text-[10px] uppercase text-[#96745e]">{item.kind}</span></div><h3 className="font-display text-lg font-bold">{item.title}</h3><p className="mt-1 text-sm leading-5 text-[#765752]">{item.description}</p><p className="mt-4 font-mono-ui text-[10px] uppercase tracking-wider text-[#a34d43]">earned by {item.earnedBy}</p></article>)}</div> : <EmptyState title="The shelf is listening" body="Finish a Persona Contest and your first little kitchen curio will appear here." /> 
        ) : (
          ledger.length ? <div className="space-y-3">{ledger.map((entry) => <article key={entry.id} className="ledger-entry rounded-r-lg p-4" data-testid={`row-ledger-${entry.id}`}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-display font-bold">{entry.contestName}</h3><time className="font-mono-ui text-[10px] text-[#96745e]">{new Date(entry.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div><p className="mt-2 text-sm text-[#765752]">{entry.memorableEvent}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono-ui text-[10px] uppercase tracking-wider text-[#a34d43]"><span>winner: {entry.winner}</span><span>seen by {entry.contestants.join(', ')}</span></div></article>)}</div> : <EmptyState title="No stories yet" body="The ledger is blank for now. Charge the meter with a few things from the conveyor." />
        )}
        <div className="mt-7 flex justify-end border-t border-[#d8bd87] pt-4"><button type="button" onClick={onReset} className="flex items-center gap-2 text-xs font-bold text-[#a34d43] underline decoration-dotted underline-offset-4 hover:text-[#30223c]" data-testid="button-reset-memory"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Clear local memory</button></div>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-lg border-2 border-dashed border-[#c6a86c] bg-[#fff3d5] p-8 text-center"><LockKeyhole className="mx-auto h-7 w-7 text-[#a34d43]" aria-hidden="true" /><h3 className="mt-3 font-display text-xl font-bold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-[#765752]">{body}</p></div>;
}

function Home() {
  const [meter, setMeter] = useStoredState<MeterState>(METER_KEY, { progress: 0, lastAcknowledgement: 'Choose a morsel to begin.' });
  const [ledger, setLedger] = useStoredState<ContestLedgerEntry[]>(LEDGER_KEY, []);
  const [collectibles, setCollectibles] = useStoredState<Collectible[]>(CURIO_KEY, []);
  const [acknowledgement, setAcknowledgement] = useState(meter.lastAcknowledgement);
  const [meterPulse, setMeterPulse] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [curioView, setCurioView] = useState<'shelf' | 'ledger' | null>(null);
  const [contestOpen, setContestOpen] = useState(false);
  const [contestStep, setContestStep] = useState<'intro' | 'matchup' | 'winner'>('intro');
  const [contestants, setContestants] = useState<Persona[]>([]);
  const [winner, setWinner] = useState<Persona | null>(null);
  const [liveStatus, setLiveStatus] = useState(acknowledgement);
  const holdTimer = useRef<number | null>(null);
  const contestTimer = useRef<number | null>(null);
  const contestQueued = useRef(false);
  const contestOutcome = useRef<ContestOutcome | null>(null);
  const completionGuard = useRef(false);
  const finishContestRef = useRef<() => void>(() => undefined);
  const selectedCount = useMemo(() => ledger.length + collectibles.length, [ledger.length, collectibles.length]);

  const cancelHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setIsHolding(false);
  };

  const finishContest = () => {
    const outcome = contestOutcome.current;
    const winningPersona = winner ?? outcome?.winner;
    if (!winningPersona || completionGuard.current) return;
    completionGuard.current = true;
    const now = new Date().toISOString();
    const template = collectiblePool.find((item) => item.earnedBy === winningPersona.id) ?? collectiblePool[0];
    const alreadyOwned = collectibles.some((item) => item.id === template.id || item.id.startsWith(`${template.id}-`));
    const collectibleId = alreadyOwned ? `${template.id}-${Date.now()}` : template.id;
    const memorableEvent = outcome?.memorableEvent ?? `${winningPersona.name} finds a curious shortcut.`;
    const entryId = `contest-${Date.now()}`;
    const collectible: Collectible = {
      ...template,
      id: collectibleId,
      title: alreadyOwned ? `${template.title} · echo` : template.title,
      earnedBy: winningPersona.name,
      earnedAt: now,
    };
    setLedger((current) => [{
      id: entryId,
      contestName: outcome?.contestName ?? 'Lantern Route, after closing',
      contestants: contestants.map((persona) => persona.name),
      winner: winningPersona.name,
      memorableEvent,
      collectibleId,
      completedAt: now,
    }, ...current].slice(0, 20));
    setCollectibles((current) => [collectible, ...current].slice(0, 30));
    setMeter({ progress: 0, lastAcknowledgement: `${winningPersona.name} left a story on the counter.` });
    setAcknowledgement(`${winningPersona.name} left a story on the counter.`);
    setLiveStatus(`Contest complete. ${winningPersona.name} wins and earns ${collectible.title}.`);
    setContestOpen(false);
    setContestStep('intro');
    setWinner(null);
    setContestants([]);
    contestOutcome.current = null;
    contestQueued.current = false;
  };
  finishContestRef.current = finishContest;

  const launchContest = () => {
    const rng = createRng(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
    const selected = shuffleWithRng(personas, rng).slice(0, rng() > 0.62 ? 4 : 3);
    const outcome = resolveContest(selected, rng);
    contestOutcome.current = outcome;
    completionGuard.current = false;
    setContestants(selected);
    setWinner(null);
    setContestStep('intro');
    setContestOpen(true);
    setLiveStatus(`${outcome.contestName} is ready. Contestants: ${selected.map((persona) => persona.name).join(', ')}.`);
  };

  const charge = () => {
    if (meter.progress >= 100 || contestOpen) return;
    const increment = 7 + Math.floor(Math.random() * 10);
    const progress = Math.min(100, meter.progress + increment);
    const nextAck = acknowledgements[Math.floor(Math.random() * acknowledgements.length)] ?? acknowledgements[0];
    setMeter({ progress, lastAcknowledgement: nextAck });
    setAcknowledgement(nextAck);
    setLiveStatus(`${nextAck} ${increment} sparkle points added.`);
    setMeterPulse(true);
    window.setTimeout(() => setMeterPulse(false), 420);
    if (progress >= 100 && !contestQueued.current) {
      contestQueued.current = true;
      setLiveStatus('The Mystery Bento Meter is full. The curtain is lifting.');
      window.setTimeout(launchContest, 520);
    }
  };

  const selectFood = () => charge();
  const startHold = () => {
    if (holdTimer.current || meter.progress >= 100 || contestOpen) return;
    setIsHolding(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      setIsHolding(false);
      setMeter({ progress: 100, lastAcknowledgement: 'The bento hums warmly…' });
      setAcknowledgement('The bento hums warmly…');
      setLiveStatus('The bento hums warmly. The Mystery Bento Meter is full.');
      setMeterPulse(true);
      contestQueued.current = true;
      window.setTimeout(launchContest, 520);
    }, 1500);
  };
  const handleMeterKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); startHold(); } };
  const handleMeterKeyUp = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cancelHold(); } };
  const handleMeterContextMenu = (event: MouseEvent<HTMLDivElement>) => { if (isHolding) event.preventDefault(); };
  const skipContest = () => {
    if (completionGuard.current) return;
    const winningPersona = winner ?? contestOutcome.current?.winner ?? contestants[0] ?? personas[0];
    setWinner(winningPersona);
    setContestStep('winner');
    setLiveStatus(`${winningPersona.name} reaches the finish. The stall is revealing the result.`);
  };
  useEffect(() => () => { if (holdTimer.current) window.clearTimeout(holdTimer.current); if (contestTimer.current) window.clearTimeout(contestTimer.current); }, []);
  useEffect(() => {
    window.addEventListener('blur', cancelHold);
    document.addEventListener('visibilitychange', cancelHold);
    return () => { window.removeEventListener('blur', cancelHold); document.removeEventListener('visibilitychange', cancelHold); };
  }, []);
  useEffect(() => {
    if (!contestOpen || contestStep !== 'intro') return;
    contestTimer.current = window.setTimeout(() => setContestStep('matchup'), 1100);
    return () => { if (contestTimer.current) window.clearTimeout(contestTimer.current); };
  }, [contestOpen, contestStep]);
  useEffect(() => {
    if (!contestOpen || contestStep !== 'matchup') return;
    contestTimer.current = window.setTimeout(() => {
      const outcome = contestOutcome.current ?? resolveContest(contestants, createRng(Date.now()));
      contestOutcome.current = outcome;
      setWinner(outcome.winner);
      setContestStep('winner');
      setLiveStatus(`${outcome.memorableEvent} ${outcome.winner.name} wins.`);
    }, 1800);
    return () => { if (contestTimer.current) window.clearTimeout(contestTimer.current); };
  }, [contestOpen, contestStep, contestants]);
  useEffect(() => {
    if (!contestOpen || contestStep !== 'winner') return;
    contestTimer.current = window.setTimeout(() => finishContestRef.current(), 2200);
    return () => { if (contestTimer.current) window.clearTimeout(contestTimer.current); };
  }, [contestOpen, contestStep]);

  const resetMemory = () => {
    setMeter({ progress: 0, lastAcknowledgement: 'Choose a morsel to begin.' });
    setAcknowledgement('Choose a morsel to begin.');
    setLiveStatus('Local memory cleared.');
    setLedger([]);
    setCollectibles([]);
    setCurioView(null);
    contestQueued.current = false;
    completionGuard.current = false;
    contestOutcome.current = null;
  };

  return (
    <div className="bento-app">
      <Header onOpenCurio={setCurioView} ledgerCount={ledger.length} curioCount={collectibles.length} />
      <main className="mx-auto max-w-6xl px-4 pb-10 pt-7 sm:px-6 md:px-8 md:pt-10">
        <section className="mb-7 grid items-end gap-5 md:grid-cols-[1fr_auto]">
          <div className="float-in">
            <div className="mb-3 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#a34d43]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#a34d43]" />open until the last lantern goes out</div>
            <h1 className="font-display max-w-3xl text-4xl font-bold leading-[.98] tracking-[-.05em] text-[#30223c] sm:text-6xl md:text-7xl">Pick a bite.<br /><span className="text-[#a34d43]">Wake the weird.</span></h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-[#765752]">A tiny night market for curious palates. Choose what catches your eye and the stall will decide who meets under the lanterns.</p>
          </div>
          <div className="hidden justify-end gap-2 md:flex" aria-label="Market details"><div className="h-8 w-5 rounded-t-full border-2 border-[#30223c] bg-[#f5c968]" /><div className="h-6 w-5 self-end rounded-t-full border-2 border-[#30223c] bg-[#a34d43]" /><div className="h-10 w-5 rounded-t-full border-2 border-[#30223c] bg-[#37745c]" /></div>
        </section>

        <section className="scene-shell pixel-card rounded-xl p-4 sm:p-6 md:p-8" aria-label="Mystery Bento night market">
          <div className="scene-content">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="stall-sign max-w-[260px] px-4 py-3 sm:px-6"><div className="font-mono-ui text-[10px] uppercase tracking-[.2em]">no. 07 · alley counter</div><div className="font-display mt-1 text-2xl font-bold sm:text-3xl">MYSTERY BENTO</div></div>
              <div className="relative mr-2 mt-2 hidden gap-4 sm:flex"><div className="lantern relative" /><div className="lantern relative bg-[#e57d5a]" /></div>
            </div>
            <div className="relative mb-6">
              <span className="pixel-star left-[8%] top-2" aria-hidden="true">+</span><span className="pixel-star right-[13%] top-10 text-sm" aria-hidden="true">+</span><span className="pixel-star right-[28%] top-0 text-xs" aria-hidden="true">+</span>
              <p className="mb-3 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#bca99b]">the conveyor is carrying tonight's clues</p>
              <div className="conveyor grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:gap-4 sm:p-5">
                {foodItems.map((item, index) => <button type="button" key={item.id} onClick={() => selectFood()} disabled={meter.progress >= 100 || contestOpen} className="food-button rounded-lg p-3 text-left" data-testid={`button-select-food-${item.id}`}><div className="food-illustration"><FoodGlyph item={item} /><span className="absolute right-1 top-0 font-mono-ui text-[10px] text-[#a34d43]">0{index + 1}</span></div><div className="font-display mt-2 text-sm font-bold leading-4">{item.name}</div><div className="mt-1 text-[11px] leading-4 text-[#765752]">{item.note}</div><div className="mt-2 flex items-center justify-between font-mono-ui text-[9px] uppercase tracking-wider text-[#a34d43]"><span>add 7–16</span><span aria-hidden="true">+</span></div></button>)}
              </div>
              <div className="conveyor-line mt-3 rounded-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_1.4fr] md:items-end">
              <div className="rounded-xl border-2 border-[#65506d] bg-[#261d31] p-4 text-[#f8e7c6] sm:p-5">
                <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center border border-[#f5c968] text-[#f5c968]"><Sparkles className="h-4 w-4" aria-hidden="true" /></div><div><div className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#f5c968]">stall note</div><p className="mt-1 text-sm leading-5 text-[#d8c6af]">Every selection changes the night. There is no wrong answer, only a stranger story.</p></div></div>
                <div className="ack-bubble mt-4 rounded-md px-3 py-2 text-xs font-bold" aria-live="polite" data-testid="status-acknowledgement">{acknowledgement}</div>
              </div>
              <Meter meter={meter} onPointerStart={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); startHold(); }} onPointerEnd={cancelHold} onMeterKeyDown={handleMeterKeyDown} onMeterKeyUp={handleMeterKeyUp} onContextMenu={handleMeterContextMenu} meterPulse={meterPulse} isHolding={isHolding} />
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 border-t-2 border-[#d9c496] pt-5 text-sm text-[#765752] sm:grid-cols-3">
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#a34d43]">01 · sample</div><p className="mt-1">Choose from the moving tray.</p></div>
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#a34d43]">02 · charge</div><p className="mt-1">The meter remembers your curiosity.</p></div>
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#a34d43]">03 · witness</div><p className="mt-1">A new contest story joins your shelf.</p></div>
        </section>
      </main>
      <div className="sr-only" role="status" aria-live="polite" data-testid="live-contest-status">{liveStatus}</div>
      {contestOpen && <ContestOverlay contestants={contestants} winner={winner} step={contestStep} contestName={contestOutcome.current?.contestName ?? 'The Persona Contest'} memorableEvent={contestOutcome.current?.memorableEvent ?? ''} onSkip={skipContest} onClose={finishContest} />}
      {curioView && <CurioOverlay view={curioView} ledger={ledger} collectibles={collectibles} onClose={() => setCurioView(null)} onReset={resetMemory} />}
      <div className="mx-auto flex max-w-6xl justify-end px-4 pb-6 sm:px-6 md:px-8"><span className="font-mono-ui text-[10px] uppercase tracking-wider text-[#96745e]">{selectedCount ? `${selectedCount} memories kept nearby` : 'local memory is empty'}</span></div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;