import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { BookOpen, ChevronRight, Eye, LockKeyhole, RotateCcw, SkipForward, Sparkles, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { contestantDesigns, contestantPortraits } from './contestant-design-config';

type MeterState = { progress: number; lastAcknowledgement: string };
type Persona = {
  id: string;
  name: string;
  flavorText: string;
  traits: { speed: number; balance: number; focus: number; luck: number; chaos: number };
  silhouetteKey: string;
  idleAnimationKey: string;
  palette: { primary: string; accent: string; neutral: string };
  memorableEvent: string;
  portraitSrc: string;
};
type ContestLedgerEntry = {
  id: string;
  contestName: string;
  contestants: string[];
  winnerId?: string;
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
type ContestStep = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';

const queryClient = new QueryClient();
const METER_KEY = 'mystery-bento-meter';
const LEDGER_KEY = 'mystery-bento-ledger';
const CURIO_KEY = 'mystery-bento-curios';

const personas: Persona[] = contestantDesigns.map((design) => ({
  id: design.id,
  name: design.name,
  flavorText: `${design.contestEdge} ace · ${design.readableSpriteFeature.toLowerCase()}.`,
  traits: {
    speed: design.traits.speed * 10,
    balance: design.traits.balance * 10,
    focus: design.traits.focus * 10,
    luck: design.traits.luck * 10,
    chaos: design.traits.chaos * 10,
  },
  silhouetteKey: design.silhouetteKey,
  idleAnimationKey: design.idleAnimationKey,
  palette: design.palette,
  memorableEvent: design.memorableEvent,
  portraitSrc: contestantPortraits[design.id],
}));

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

const contestDurations: Record<ContestStep, number> = {
  intro: 8000,
  warmup: 18000,
  matchup: 32000,
  finale: 45000,
  winner: 17000,
};

const contestNextStep: Partial<Record<ContestStep, ContestStep>> = {
  intro: 'warmup',
  warmup: 'matchup',
  matchup: 'finale',
  finale: 'winner',
};

const contestStepLabels: Record<ContestStep, string> = {
  intro: 'arrival',
  warmup: 'warm-up',
  matchup: 'main course',
  finale: 'final stretch',
  winner: 'recap',
};

const collectiblePool = [
  { id: 'recipe-midnight-sauce', kind: 'recipe fragment', title: 'The Unfinished Midnight Sauce', description: 'A recipe-card fragment with one suspiciously important ingredient missing.', earnedBy: 'miso' },
  { id: 'recipe-after-hours-note', kind: 'recipe fragment', title: 'The After-Hours Note', description: 'A folded kitchen note that begins with “never skip the toasted sesame.”', earnedBy: 'miso' },
  { id: 'teacup-perfect-steep', kind: 'porcelain keepsake', title: 'The Perfect Steep Cup', description: 'A tiny porcelain cup with a gold line marking the exact moment green tea becomes itself.', earnedBy: 'sencha' },
  { id: 'lantern-warm-glow', kind: 'lantern charm', title: 'Warm-Glow Wisp', description: 'A tiny charm that remembers the softest light in the alley.', earnedBy: 'toro' },
  { id: 'lantern-rain-ticket', kind: 'lantern charm', title: 'Rainy Lantern Ticket', description: 'A little ticket from a stormy night when every puddle reflected gold.', earnedBy: 'toro' },
  { id: 'chef-ladle-champion', kind: 'chef sticker', title: 'Ladle Champion', description: 'A shiny sticker for a chef who made one enormous spoon look graceful.', earnedBy: 'nori' },
  { id: 'chef-ladle-night-shift', kind: 'chef sticker', title: 'Night-Shift Ladle Patch', description: 'A stitched patch for the cook who kept the late service perfectly stirred.', earnedBy: 'nori' },
  { id: 'wrench-do-not-relocate', kind: 'pantry tool', title: 'The Do-Not-Relocate Wrench', description: 'A perfectly labeled wrench from Tilda’s chair-and-tool maintenance system.', earnedBy: 'tilda' },
  { id: 'plate-moon-checker', kind: 'plate pattern', title: 'Moonlit Checker', description: 'A ceramic plate pattern in the exact colors of a late-night shortcut.', earnedBy: 'bibi' },
  { id: 'plate-rainbow-rim', kind: 'plate pattern', title: 'Rainbow Rim Test Tile', description: 'A test tile with a rim that catches every color of the market sign.', earnedBy: 'saffy' },
  { id: 'snapshot-great-wobble', kind: 'victory snapshot', title: 'The Great Wobble', description: 'A framed snapshot of a rice ball refusing to give up.', earnedBy: 'panko' },
  { id: 'snapshot-last-tray', kind: 'victory snapshot', title: 'The Last Tray Home', description: 'A tiny photograph of an empty tray making it safely back to the pass.', earnedBy: 'pip' },
  { id: 'radish-spark-sticker', kind: 'chef sticker', title: 'Radish Spark', description: 'A zippy little sticker that seems to vibrate when nobody is looking.', earnedBy: 'rollo' },
  { id: 'radish-fizz-pin', kind: 'chef sticker', title: 'Fizz Route Pin', description: 'A bright pin marking the fastest route between the pantry and the dance floor.', earnedBy: 'rollo' },
  { id: 'medal-longest-noodle', kind: 'flour-stall medal', title: 'The Longest Noodle Medal', description: 'A heavy little medal awarded for pulling one scientifically unnecessary, gloriously long noodle.', earnedBy: 'uma' },
  { id: 'kettle-mostly-safe', kind: 'workshop charm', title: 'The Mostly Safe Kettle', description: 'A copper pocket kettle with a handwritten label: “safe-ish, especially when complimented.”', earnedBy: 'kiku' },
];

const showcaseCollectibles: Collectible[] = collectiblePool.map((item) => ({
  ...item,
  earnedBy: personas.find((persona) => persona.id === item.earnedBy)?.name ?? item.earnedBy,
  earnedAt: new Date().toISOString(),
}));

type CurioDisplayZone = 'house-keeps' | 'tea-tools' | 'spare-plates' | 'little-finds' | 'hanging-tools';

function getCurioDisplayZone(item: Collectible): CurioDisplayZone {
  if (item.id.includes('chef-ladle-champion')) return 'hanging-tools';
  if (item.id.includes('chef-ladle-night-shift')) return 'hanging-tools';
  if (item.id.includes('wrench-do-not-relocate')) return 'hanging-tools';
  if (item.id.includes('teacup-perfect-steep')) return 'tea-tools';
  if (item.id.includes('plate-moon-checker')) return 'spare-plates';
  if (item.id.includes('plate-rainbow-rim')) return 'spare-plates';
  if (item.id.includes('lantern-warm-glow')) return 'tea-tools';
  if (item.id.includes('lantern-rain-ticket')) return 'tea-tools';
  if (item.id.includes('radish-spark-sticker')) return 'little-finds';
  if (item.id.includes('radish-fizz-pin')) return 'little-finds';
  if (item.id.includes('kettle-mostly-safe')) return 'little-finds';
  if (item.id.includes('medal-longest-noodle')) return 'house-keeps';
  return 'house-keeps';
}

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
  return {
    winner,
    memorableEvent: winner.memorableEvent,
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

function FoodSelectionSplash({ item }: { item: FoodItem }) {
  return (
    <div className="selection-splash" role="status" aria-live="polite" data-testid={`selection-splash-${item.id}`}>
      <span className="splash-particle splash-particle-one" aria-hidden="true">✦</span>
      <span className="splash-particle splash-particle-two" aria-hidden="true">+</span>
      <span className="splash-particle splash-particle-three" aria-hidden="true">✦</span>
      <div className="selection-card">
        <div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#f5c968]">fresh off the belt</div>
        <div className="selection-card-main">
          <div className="selection-plate" aria-hidden="true">
            <div className="plate"><FoodGlyph item={item} /></div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold leading-none sm:text-3xl">{item.name}</div>
            <p className="mt-2 text-sm text-[#d8c6af]">{item.note}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#64516b] pt-3 font-mono-ui text-[10px] uppercase tracking-wider text-[#f5c968]">
          <span>clue collected</span>
          <span>meter remembers</span>
        </div>
      </div>
    </div>
  );
}

function CurioGlyph({ item }: { item: Collectible }) {
  const glyphClass = item.id.includes('recipe-midnight-sauce')
    ? 'recipe'
    : item.id.includes('recipe-after-hours-note')
      ? 'note'
      : item.id.includes('teacup-perfect-steep')
        ? 'cup'
    : item.id.includes('lantern-warm-glow')
      ? 'lantern'
      : item.id.includes('lantern-rain-ticket')
        ? 'ticket'
      : item.id.includes('chef-ladle-champion')
        ? 'ladle'
        : item.id.includes('chef-ladle-night-shift')
          ? 'patch'
          : item.id.includes('wrench-do-not-relocate')
            ? 'wrench'
        : item.id.includes('plate-moon-checker')
          ? 'checker'
        : item.id.includes('plate-rainbow-rim')
          ? 'tile'
          : item.id.includes('snapshot-great-wobble')
            ? 'snapshot'
        : item.id.includes('snapshot-last-tray')
          ? 'tray'
        : item.id.includes('radish-fizz-pin')
          ? 'pin'
        : item.id.includes('medal-longest-noodle')
          ? 'medal'
        : item.id.includes('kettle-mostly-safe')
          ? 'kettle'
            : 'radish';
  return (
    <div className={`curio-glyph curio-glyph-${glyphClass}`} aria-hidden="true">
      <span className="curio-glyph-detail" />
      <span className="curio-glyph-shine" />
    </div>
  );
}

function CurioInfoCard({ item }: { item: Collectible }) {
  return (
    <span className="curio-info-card" id={`curio-info-${item.id}`} role="tooltip">
      <strong>{item.title}</strong>
      <span className="curio-info-kind">{item.kind}</span>
      <span className="curio-info-description">{item.description}</span>
      <span className="curio-info-earned">earned by {item.earnedBy}</span>
    </span>
  );
}

function CurioHotspot({ item, className }: { item: Collectible; className: string }) {
  const isLatest = className.includes('displayed-curio-latest');
  return (
    <button
      type="button"
      className={`curio-hotspot ${className}`}
      aria-label={`View curio information for ${item.title}`}
      aria-describedby={`curio-info-${item.id}`}
    >
      {isLatest && <span className="curio-award-marker" aria-hidden="true">new</span>}
      <CurioGlyph item={item} />
      <span className="curio-place-label">{item.kind}</span>
      <CurioInfoCard item={item} />
    </button>
  );
}

function CurioBacksplash({ collectibles, lastWinner }: { collectibles: Collectible[]; lastWinner: Persona | null }) {
  const byZone = (zone: CurioDisplayZone) => collectibles.filter((item) => getCurioDisplayZone(item) === zone);
  const houseKeeps = byZone('house-keeps');
  const teaTools = byZone('tea-tools');
  const sparePlates = byZone('spare-plates');
  const littleFinds = byZone('little-finds');
  const emptySlot = (items: Collectible[], index: number, small = false) => (
    items[index] ? null : <span className={`background-shelf-slot${small ? ' background-shelf-slot-small' : ''}`} />
  );
  return (
    <div className="curio-backsplash" aria-hidden="true">
      <div className="restaurant-background-dressing">
        <div className="background-shelf background-shelf-left">
          <span className="background-shelf-title">house keeps</span>
          {emptySlot(houseKeeps, 0)}
          {emptySlot(houseKeeps, 1, true)}
        </div>
        <div className="background-shelf background-shelf-right">
          <span className="background-shelf-title">tea + tools</span>
          {emptySlot(teaTools, 0)}
          {emptySlot(teaTools, 1, true)}
        </div>
        <div className="background-shelf background-shelf-low-left">
          <span className="background-shelf-title">spare plates</span>
          {emptySlot(sparePlates, 0)}
          {emptySlot(sparePlates, 1, true)}
        </div>
        <div className="background-shelf background-shelf-low-right">
          <span className="background-shelf-title">little finds</span>
          {emptySlot(littleFinds, 0)}
          {emptySlot(littleFinds, 1, true)}
        </div>
        <div className="background-utensil-rail">
          <span className="background-utensil background-utensil-spatula" />
          {!byZone('hanging-tools')[0] && <span className="background-utensil-slot" />}
          <span className="background-utensil background-utensil-whisk" />
          <span className="background-utensil background-utensil-tongs" />
        </div>
        <div className="background-hanging-plant background-hanging-plant-left">
          <span className="background-plant-vine background-plant-vine-one" />
          <span className="background-plant-vine background-plant-vine-two" />
          <span className="background-plant-leaf background-plant-leaf-one" />
          <span className="background-plant-leaf background-plant-leaf-two" />
          <span className="background-plant-leaf background-plant-leaf-three" />
          <span className="background-plant-pot" />
        </div>
        <div className="background-hanging-plant background-hanging-plant-right">
          <span className="background-plant-vine background-plant-vine-one" />
          <span className="background-plant-vine background-plant-vine-two" />
          <span className="background-plant-leaf background-plant-leaf-one" />
          <span className="background-plant-leaf background-plant-leaf-two" />
          <span className="background-plant-leaf background-plant-leaf-three" />
          <span className="background-plant-pot" />
        </div>
        <div className="background-spice-shelf background-spice-shelf-left">
          <span className="background-spice-label">daily mise en place</span>
          <span className="background-spice-jar background-spice-jar-gold" />
          <span className="background-spice-jar background-spice-jar-coral" />
          <span className="background-spice-jar background-spice-jar-green" />
        </div>
        <div className="background-spice-shelf background-spice-shelf-right">
          <span className="background-spice-label">prep drawer</span>
          <span className="background-spice-jar background-spice-jar-blue" />
          <span className="background-spice-jar background-spice-jar-gold" />
          <span className="background-spice-jar background-spice-jar-coral" />
        </div>
        <div className="background-bonsai">
          <span className="background-bonsai-trunk" />
          <span className="background-bonsai-branch background-bonsai-branch-one" />
          <span className="background-bonsai-branch background-bonsai-branch-two" />
          <span className="background-bonsai-cloud background-bonsai-cloud-one" />
          <span className="background-bonsai-cloud background-bonsai-cloud-two" />
          <span className="background-bonsai-cloud background-bonsai-cloud-three" />
          <span className="background-bonsai-pot" />
          <span className="background-tree-shelf" />
        </div>
        <div className="background-cherry-tree">
          <span className="background-cherry-trunk" />
          <span className="background-cherry-branch background-cherry-branch-one" />
          <span className="background-cherry-branch background-cherry-branch-two" />
          <span className="background-cherry-blossom background-cherry-blossom-one" />
          <span className="background-cherry-blossom background-cherry-blossom-two" />
          <span className="background-cherry-blossom background-cherry-blossom-three" />
          <span className="background-cherry-blossom background-cherry-blossom-four" />
          <span className="background-cherry-blossom background-cherry-blossom-five" />
          <span className="background-cherry-pot" />
          <span className="background-tree-shelf" />
        </div>
      </div>
      <div className="restaurant-window restaurant-window-left">
        <span className="restaurant-window-sign">OPEN LATE</span>
        <span className="restaurant-window-light restaurant-window-light-one" />
        <span className="restaurant-window-light restaurant-window-light-two" />
      </div>
      <div className="restaurant-window restaurant-window-right">
        <span className="restaurant-window-sign">SUSHI BAR</span>
        <span className="restaurant-window-light restaurant-window-light-one" />
        <span className="restaurant-window-light restaurant-window-light-two" />
      </div>
      <div className="restaurant-menu-board">
        <span className="font-mono-ui text-[8px] uppercase tracking-[.16em]">tonight's menu</span>
        <strong className="font-display">maki · miso · mystery</strong>
        <span className="font-mono-ui text-[8px] uppercase tracking-wider">served after dark</span>
      </div>
      <div className="open-kitchen">
        <div className="kitchen-hood"><span className="font-mono-ui text-[8px] uppercase tracking-[.18em]">open kitchen · staff at work</span></div>
        <div className="kitchen-rack">
          <span className="kitchen-pot kitchen-pot-one" />
          <span className="kitchen-pot kitchen-pot-two" />
          <span className="kitchen-bowl kitchen-bowl-one" />
          <span className="kitchen-bowl kitchen-bowl-two" />
        </div>
        <div className="kitchen-prep-light kitchen-prep-light-one" />
        <div className="kitchen-prep-light kitchen-prep-light-two" />
        <div className="kitchen-steam kitchen-steam-one" />
        <div className="kitchen-steam kitchen-steam-two" />
        {!lastWinner && (
          <div className="kitchen-return-sign" aria-hidden="true">
            <strong lang="ja">すぐ戻ります</strong>
            <span>be right back</span>
          </div>
        )}
        {lastWinner && (
          <div className="kitchen-chef" aria-label={`${lastWinner.name}, the latest contest winner, is preparing sushi`}>
            <span className="kitchen-chef-label">{lastWinner.name} · on shift</span>
            <PersonaPortrait persona={lastWinner} />
            <div className="kitchen-chef-station" aria-hidden="true">
              <span className="kitchen-chef-board" />
              <span className="kitchen-chef-roll kitchen-chef-roll-one" />
              <span className="kitchen-chef-roll kitchen-chef-roll-two" />
              <span className="kitchen-chef-knife" />
            </div>
          </div>
        )}
      </div>
      <div className="curio-wall-lamp curio-wall-lamp-left" />
      <div className="curio-wall-lamp curio-wall-lamp-right" />
    </div>
  );
}

function RestaurantCurioDisplays({ collectibles }: { collectibles: Collectible[] }) {
  const byZone = (zone: CurioDisplayZone) => collectibles.filter((item) => getCurioDisplayZone(item) === zone).slice(0, 2);
  const latestCurioId = collectibles[0]?.id;
  const displayClass = (baseClass: string, item: Collectible) => `${baseClass}${item.id === latestCurioId ? ' displayed-curio-latest' : ''}`;
  return (
    <div className="restaurant-curio-displays" aria-label="Curios displayed around the restaurant">
      {byZone('house-keeps').map((item, index) => <CurioHotspot item={item} className={displayClass(`displayed-curio displayed-curio-house-keeps-${index}`, item)} key={item.id} />)}
      {byZone('tea-tools').map((item, index) => <CurioHotspot item={item} className={displayClass(`displayed-curio displayed-curio-tea-tools-${index}`, item)} key={item.id} />)}
      {byZone('spare-plates').map((item, index) => <CurioHotspot item={item} className={displayClass(`displayed-curio displayed-curio-spare-plates-${index}`, item)} key={item.id} />)}
      {byZone('little-finds').map((item, index) => <CurioHotspot item={item} className={displayClass(`displayed-curio displayed-curio-little-finds-${index}`, item)} key={item.id} />)}
      {byZone('hanging-tools').slice(0, 1).map((item) => <CurioHotspot item={item} className={displayClass('displayed-curio displayed-curio-hanging-tools', item)} key={item.id} />)}
    </div>
  );
}

function PersonaPortrait({ persona, large = false }: { persona: Persona; large?: boolean }) {
  return (
    <div className={`persona-portrait ${persona.silhouetteKey} ${large ? 'is-featured' : ''}`} style={{ '--persona-color': persona.palette.primary, '--persona-accent': persona.palette.accent } as CSSProperties} aria-hidden="true">
      <img className="persona-portrait-image" src={persona.portraitSrc} alt="" />
      <span className="persona-portrait-shine" />
      <span className="persona-portrait-shadow" />
    </div>
  );
}

function RestaurantControls({ onOpenCurio, ledgerCount, curioCount }: { onOpenCurio: (view: 'shelf' | 'ledger') => void; ledgerCount: number; curioCount: number }) {
  return (
    <div className="restaurant-controls">
      <div className="restaurant-brand-lockup">
        <div className="restaurant-brand-mark" aria-hidden="true"><div className="logo-bento" /></div>
        <div>
          <div className="font-display text-lg font-bold tracking-tight">Mystery Bento</div>
          <div className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#f5c968]">after-hours sushi club</div>
        </div>
      </div>
      <nav className="restaurant-nav" aria-label="Collection navigation">
        <button type="button" onClick={() => onOpenCurio('shelf')} className="curio-button" data-testid="button-open-shelf">
          <Sparkles className="h-3.5 w-3.5 text-[#f5c968]" aria-hidden="true" /><span>Curios</span><span className="font-mono-ui text-[#f5c968]">{curioCount}</span>
        </button>
        <button type="button" onClick={() => onOpenCurio('ledger')} className="curio-button" data-testid="button-open-ledger">
          <BookOpen className="h-3.5 w-3.5 text-[#f5c968]" aria-hidden="true" /><span>Ledger</span><span className="font-mono-ui text-[#f5c968]">{ledgerCount}</span>
        </button>
      </nav>
    </div>
  );
}

function Meter({ meter, onPointerStart, onPointerEnd, onMeterClick, onMeterKeyDown, onMeterKeyUp, onContextMenu, meterPulse, isHolding, compact = false }: { meter: MeterState; onPointerStart: (event: PointerEvent<HTMLDivElement>) => void; onPointerEnd: () => void; onMeterClick: () => void; onMeterKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void; onMeterKeyUp: (event: KeyboardEvent<HTMLDivElement>) => void; onContextMenu: (event: MouseEvent<HTMLDivElement>) => void; meterPulse: boolean; isHolding: boolean; compact?: boolean }) {
  return (
    <section className={`meter-shell rounded-xl bg-[#f2d7a0] p-4 text-[#30223c] ${compact ? 'compact-meter' : ''} ${meterPulse ? 'bump' : ''}`} aria-labelledby="meter-heading" onClick={onMeterClick} data-testid="meter-shell">
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

function ForegroundSeating() {
  return (
    <div className="foreground-seating" aria-hidden="true">
      <div className="seating-floor-line" />
      {[0, 1, 2, 3, 4, 5].map((chair) => (
        <div className="restaurant-chair" key={chair}>
          <div className="chair-back"><span /></div>
          <div className="chair-seat" />
          <div className="chair-leg chair-leg-left" />
          <div className="chair-leg chair-leg-right" />
        </div>
      ))}
    </div>
  );
}

function ContestOverlay({ contestants, winner, step, contestName, memorableEvent, onSkip, onClose }: { contestants: Persona[]; winner: Persona | null; step: ContestStep; contestName: string; memorableEvent: string; onSkip: () => void; onClose: () => void }) {
  const eventText = winner ? memorableEvent : 'The contestants take their places beneath the market lantern.';
  const stepCopy: Record<ContestStep, string> = {
    intro: 'The curtain lifts. No votes, no wagers — just a few peculiar regulars and one very good story.',
    warmup: 'The contestants test their footing, balance their plates, and learn the shape of the alley.',
    matchup: 'The main course begins. Their signature quirks collide in a slow blur of steam and suspiciously elegant footwork.',
    finale: 'The last corner is ahead. Every wobble matters now as the field makes its final, careful push.',
    winner: eventText,
  };
  const stepIndex = Object.keys(contestStepLabels).indexOf(step);
  return (
    <div className="contest-backdrop fixed inset-0 z-30 flex items-stretch justify-center" role="dialog" aria-modal="true" aria-labelledby="contest-title">
      <div className="contest-stage w-full p-5 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><div className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#f5c968]">live from the back alley</div><h2 id="contest-title" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-5xl">{contestName}</h2></div>
          <button type="button" className="flex items-center gap-2 border border-[#806a85] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:bg-[#f5c968] hover:text-[#30223c]" onClick={onSkip} data-testid="button-skip-contest"><SkipForward className="h-4 w-4" aria-hidden="true" />Skip scene</button>
        </div>
        <div className="contest-phase-row">
          <span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#f5c968]">act {stepIndex + 1} of 5 · {contestStepLabels[step]}</span>
          <span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#bca99b]">long-form spectator match · about 2 min</span>
        </div>
        <div className="contest-progress" aria-label={`Contest progress: act ${stepIndex + 1} of 5`}>
          {Object.entries(contestStepLabels).map(([key, label], index) => <span key={key} className={index <= stepIndex ? 'is-active' : ''}><i aria-hidden="true" />{label}</span>)}
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#d8c6af]">{stepCopy[step]}</p>
        <div className={`contest-race contest-race-${step}`} aria-label="Animated contest race">
          <div className="race-track-label font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#bca99b]"><span>start</span><span>finish</span></div>
          <div className="race-finish-line" aria-hidden="true" />
          {contestants.map((persona, index) => {
            const restingPosition = [52, 72, 61, 78][index % 4];
            const middlePosition = Math.max(28, restingPosition - 16);
            return (
              <div className="race-lane" key={persona.id}>
                <div className="race-lane-number font-mono-ui text-[10px] text-[#bca99b]">{String(index + 1).padStart(2, '0')}</div>
                <div className="race-lane-name font-mono-ui text-[10px] uppercase tracking-wider text-[#d8c6af]">{persona.name}</div>
                <div
                  className={`race-runner ${winner?.id === persona.id ? 'is-winner' : ''}`}
                  style={{ '--race-mid': `${middlePosition}%`, '--race-end': winner?.id === persona.id ? '91%' : `${restingPosition}%` } as CSSProperties}
                >
                  <PersonaPortrait persona={persona} />
                </div>
              </div>
            );
          })}
        </div>
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
              {step === 'warmup' && index === 0 && <div className="mt-3 font-mono-ui text-[10px] uppercase tracking-wider text-[#b88f66]">checking the trays</div>}
              {step === 'matchup' && index === 1 && <div className="mt-3 font-mono-ui text-[10px] uppercase tracking-wider text-[#b88f66]">making a scene</div>}
              {step === 'finale' && index === 2 && <div className="mt-3 font-mono-ui text-[10px] uppercase tracking-wider text-[#b88f66]">last corner</div>}
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
          collectibles.length ? <div className="curio-room" aria-label="Illustrated kitchen curio room">{collectibles.map((item, index) => <article key={item.id} className={`curio-display curio-display-${index % 3}`} data-testid={`card-collectible-${item.id}`}><div className="curio-display-art"><CurioGlyph item={item} /></div><div className="curio-display-label"><span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-[#a34d43]">{item.kind}</span><h3 className="font-display mt-1 text-lg font-bold leading-5">{item.title}</h3><p className="mt-2 text-sm leading-5 text-[#765752]">{item.description}</p><p className="mt-4 font-mono-ui text-[10px] uppercase tracking-wider text-[#a34d43]">earned by {item.earnedBy}</p></div></article>)}</div> : <EmptyState title="The shelf is listening" body="Finish a Persona Contest and your first little kitchen curio will appear here." />
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
  const [contestStep, setContestStep] = useState<ContestStep>('intro');
  const [foodSplash, setFoodSplash] = useState<{ item: FoodItem; key: number } | null>(null);
  const [contestants, setContestants] = useState<Persona[]>([]);
  const [winner, setWinner] = useState<Persona | null>(null);
  const [liveStatus, setLiveStatus] = useState(acknowledgement);
  const holdTimer = useRef<number | null>(null);
  const contestTimer = useRef<number | null>(null);
  const foodSplashTimer = useRef<number | null>(null);
  const foodSplashSequence = useRef(0);
  const contestQueued = useRef(false);
  const contestOutcome = useRef<ContestOutcome | null>(null);
  const completionGuard = useRef(false);
  const finishContestRef = useRef<() => void>(() => undefined);
  const selectedCount = useMemo(() => ledger.length + collectibles.length, [ledger.length, collectibles.length]);
  const lastWinner = useMemo(() => {
    const latestEntry = ledger[0];
    if (!latestEntry) return null;
    return personas.find((persona) => persona.id === latestEntry.winnerId)
      ?? personas.find((persona) => persona.name === latestEntry.winner)
      ?? null;
  }, [ledger]);

  useEffect(() => {
    setCollectibles((current) => {
      const showcaseById = new Map(showcaseCollectibles.map((item) => [item.id, item]));
      const refreshed = current.map((item) => {
        const template = showcaseById.get(item.id);
        return template ? { ...item, kind: template.kind, title: template.title, description: template.description, earnedBy: template.earnedBy } : item;
      });
      const ownedIds = new Set(refreshed.map((item) => item.id));
      const missing = showcaseCollectibles.filter((item) => !ownedIds.has(item.id));
      const needsRefresh = refreshed.some((item, index) => item !== current[index]);
      return missing.length || needsRefresh ? [...missing, ...refreshed].slice(0, 30) : current;
    });
  }, [setCollectibles]);

  const queueContest = (message: string) => {
    if (contestOpen || contestQueued.current) return;
    contestQueued.current = true;
    setLiveStatus(message);
    window.setTimeout(launchContest, 520);
  };

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
    const isOwned = (template: (typeof collectiblePool)[number]) => collectibles.some((item) => item.id === template.id || item.id.startsWith(`${template.id}-`));
    const availableCurios = collectiblePool.filter((item) => !isOwned(item));
    const template = availableCurios.find((item) => item.earnedBy === winningPersona.id);
    const memorableEvent = outcome?.memorableEvent ?? `${winningPersona.name} finds a curious shortcut.`;
    const entryId = `contest-${Date.now()}`;
    const collectible: Collectible | null = template ? {
      ...template,
      earnedBy: winningPersona.name,
      earnedAt: now,
    } : null;
    setLedger((current) => [{
      id: entryId,
      contestName: outcome?.contestName ?? 'Lantern Route, after closing',
      contestants: contestants.map((persona) => persona.name),
      winnerId: winningPersona.id,
      winner: winningPersona.name,
      memorableEvent,
      collectibleId: collectible?.id ?? 'all-curios-collected',
      completedAt: now,
    }, ...current].slice(0, 20));
    if (collectible) setCollectibles((current) => [collectible, ...current].slice(0, 30));
    setMeter({ progress: 0, lastAcknowledgement: `${winningPersona.name} left a story on the counter.` });
    setAcknowledgement(`${winningPersona.name} left a story on the counter.`);
    setLiveStatus(collectible ? `Contest complete. ${winningPersona.name} wins and earns ${collectible.title}.` : `Contest complete. ${winningPersona.name} wins. No new matching curio remains in the collection.`);
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

  const charge = (item: FoodItem) => {
    if (meter.progress >= 100 || contestOpen) return;
    const increment = 7 + Math.floor(Math.random() * 10);
    const progress = Math.min(100, meter.progress + increment);
    const nextAck = acknowledgements[Math.floor(Math.random() * acknowledgements.length)] ?? acknowledgements[0];
    setMeter({ progress, lastAcknowledgement: nextAck });
    setAcknowledgement(nextAck);
    setLiveStatus(`${nextAck} ${increment} sparkle points added.`);
    setMeterPulse(true);
    window.setTimeout(() => setMeterPulse(false), 420);
    if (foodSplashTimer.current) window.clearTimeout(foodSplashTimer.current);
    setFoodSplash({ item, key: foodSplashSequence.current + 1 });
    foodSplashSequence.current += 1;
    foodSplashTimer.current = window.setTimeout(() => {
      setFoodSplash(null);
      foodSplashTimer.current = null;
    }, 12600);
    if (progress >= 100 && !contestQueued.current) {
      queueContest('The Mystery Bento Meter is full. The curtain is lifting.');
    }
  };

  const selectFood = (item: FoodItem) => charge(item);
  const startHold = () => {
    if (holdTimer.current || contestOpen) return;
    if (meter.progress >= 100) {
      queueContest('The Mystery Bento Meter is already full. The curtain is lifting.');
      return;
    }
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
  const handleMeterClick = () => {
    if (contestOpen || contestQueued.current) return;
    if (meter.progress >= 100) {
      queueContest('The Mystery Bento Meter is already full. The curtain is lifting.');
      return;
    }
    cancelHold();
    setMeter({ progress: 100, lastAcknowledgement: 'The bento hums warmly…' });
    setAcknowledgement('The bento hums warmly…');
    setLiveStatus('The bento hums warmly. The Mystery Bento Meter is full.');
    setMeterPulse(true);
    window.setTimeout(() => setMeterPulse(false), 420);
    queueContest('The bento hums warmly. The Mystery Bento Meter is full.');
  };
  const skipContest = () => {
    if (completionGuard.current) return;
    const winningPersona = winner ?? contestOutcome.current?.winner ?? contestants[0] ?? personas[0];
    setWinner(winningPersona);
    setContestStep('winner');
    setLiveStatus(`${winningPersona.name} reaches the finish. The stall is revealing the result.`);
  };
  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (contestTimer.current) window.clearTimeout(contestTimer.current);
    if (foodSplashTimer.current) window.clearTimeout(foodSplashTimer.current);
  }, []);
  useEffect(() => {
    window.addEventListener('blur', cancelHold);
    document.addEventListener('visibilitychange', cancelHold);
    return () => { window.removeEventListener('blur', cancelHold); document.removeEventListener('visibilitychange', cancelHold); };
  }, []);
  useEffect(() => {
    if (!contestOpen) return;
    const nextStep = contestNextStep[contestStep];
    if (!nextStep) return;
    contestTimer.current = window.setTimeout(() => {
      if (nextStep === 'winner') {
        const outcome = contestOutcome.current ?? resolveContest(contestants, createRng(Date.now()));
        contestOutcome.current = outcome;
        setWinner(outcome.winner);
        setContestStep('winner');
        setLiveStatus(`${outcome.memorableEvent} ${outcome.winner.name} wins.`);
        return;
      }
      const stageMessages: Record<Exclude<ContestStep, 'winner'>, string> = {
        intro: 'The contestants have arrived. The warm-up begins beneath the lanterns.',
        warmup: 'The trays are balanced. The long race is finally underway.',
        matchup: 'The field reaches the last corner. Watch the final stretch.',
        finale: 'The finish is near. The stall is preparing the winner’s story.',
      };
      setContestStep(nextStep);
      setLiveStatus(stageMessages[nextStep]);
    }, contestDurations[contestStep]);
    return () => { if (contestTimer.current) window.clearTimeout(contestTimer.current); };
  }, [contestOpen, contestStep, contestants]);
  useEffect(() => {
    if (!contestOpen || contestStep !== 'winner') return;
    contestTimer.current = window.setTimeout(() => finishContestRef.current(), contestDurations.winner);
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
      <main className="min-h-[100dvh]" aria-label="Mystery Bento night market">
        <section className="scene-shell min-h-[100dvh] p-4 sm:p-6 md:p-10" aria-label="Mystery Bento night market">
          <CurioBacksplash collectibles={collectibles} lastWinner={lastWinner} />
          <RestaurantCurioDisplays collectibles={collectibles} />
          <div className="scene-content">
            <div className="restaurant-top-zone">
              <RestaurantControls onOpenCurio={setCurioView} ledgerCount={ledger.length} curioCount={collectibles.length} />
              <div className="restaurant-meter-bay">
                <div className="lantern relative" aria-hidden="true" />
                <div className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-[#f5c968]">after-hours service</div>
                <div className="lantern relative bg-[#e57d5a]" aria-hidden="true" />
              </div>
            </div>
            <div className="restaurant-bar-stack">
              <div className="relative mt-6">
                <span className="pixel-star left-[8%] top-2" aria-hidden="true">+</span><span className="pixel-star right-[13%] top-10 text-sm" aria-hidden="true">+</span><span className="pixel-star right-[28%] top-0 text-xs" aria-hidden="true">+</span>
                <div className="restaurant-counter">
                  <div className="conveyor rounded-xl p-3 sm:p-4">
                    <div className="conveyor-window" aria-label="Moving plated bento selections">
                      <div className="conveyor-track">
                        {[0, 1].map((copy) => (
                          <div className="conveyor-group" key={`conveyor-group-${copy}`}>
                            {foodItems.map((item, index) => (
                              <button
                                type="button"
                                key={`${item.id}-${copy}`}
                                onClick={() => selectFood(item)}
                                disabled={meter.progress >= 100 || contestOpen}
                                tabIndex={copy === 0 ? 0 : -1}
                                className="food-button"
                                data-testid={`button-select-food-${item.id}${copy ? '-repeat' : ''}`}
                              >
                                <div className="food-illustration">
                                  <div className="plate-display">
                                    <div className="plate"><FoodGlyph item={item} /></div>
                                    <span className="plate-glint" aria-hidden="true" />
                                  </div>
                                  <span className="plate-number font-mono-ui text-[10px] text-[#a34d43]">0{index + 1}</span>
                                </div>
                                <div className="food-name font-display mt-3 text-base font-bold leading-4">{item.name}</div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="conveyor-line mt-1 rounded-full" />
                  <div className="bar-meter-rail">
                    <span className="font-mono-ui text-[8px] uppercase tracking-[.14em]">mystery bento meter</span>
                  <Meter compact meter={meter} onPointerStart={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); startHold(); }} onPointerEnd={cancelHold} onMeterClick={handleMeterClick} onMeterKeyDown={handleMeterKeyDown} onMeterKeyUp={handleMeterKeyUp} onContextMenu={handleMeterContextMenu} meterPulse={meterPulse} isHolding={isHolding} />
                  </div>
                </div>
              </div>
              <ForegroundSeating />
            </div>
          </div>
          {foodSplash && <FoodSelectionSplash key={foodSplash.key} item={foodSplash.item} />}
        </section>

      </main>
      <div className="sr-only" role="status" aria-live="polite" data-testid="live-contest-status">{liveStatus}</div>
      {contestOpen && <ContestOverlay contestants={contestants} winner={winner} step={contestStep} contestName={contestOutcome.current?.contestName ?? 'The Persona Contest'} memorableEvent={contestOutcome.current?.memorableEvent ?? ''} onSkip={skipContest} onClose={finishContest} />}
      {curioView && <CurioOverlay view={curioView} ledger={ledger} collectibles={collectibles} onClose={() => setCurioView(null)} onReset={resetMemory} />}
      <span className="sr-only">{selectedCount ? `${selectedCount} memories kept nearby` : 'local memory is empty'}</span>
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