import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { BookOpen, ChevronRight, Eye, LockKeyhole, RotateCcw, SkipForward, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { contestantDesigns, contestantFoodAnimationAspectRatios, contestantFoodAnimationFrames, contestantFoodSprites, contestantPortraits } from './contestant-design-config';
import { getMovementSpriteSheet, type MovementAction } from './movement-sprite-config';
import {
  getFirstRunnerObstacleHitOffset as getTimelineFirstRunnerObstacleHitOffset,
  getRaceFinishCrossingOffset,
  getRaceLaneProgressAtTime as getTimelineLaneProgressAtTime,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtTime,
  RACE_FINALE_WORLD_END_PERCENT,
  RACE_FINALE_WORLD_START_PERCENT,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_STAGE_DURATIONS,
  RACE_WARMUP_WORLD_END_PERCENT,
  type RaceTimelineCheckpoint,
} from './race-timeline';
import { resolveRaceEncounterResult } from './race-momentum';

type MeterState = { progress: number; lastAcknowledgement: string };
type Persona = {
  id: string;
  name: string;
  flavorText: string;
  traits: { speed: number; balance: number; focus: number; luck: number; chaos: number };
  silhouetteKey: string;
  idleAnimationKey: string;
  palette: { primary: string; accent: string; neutral: string };
  quirk: string;
  contestBehavior: string;
  memorableEvent: string;
  portraitSrc: string;
  foodSpriteSrc: string;
  foodAnimationFrameSrcs?: string[];
  foodAnimationSpriteSheetSrc?: string;
  foodAnimationSpriteSheetColumns?: number;
  foodAnimationSpriteSheetRows?: number;
  foodAnimationSpriteSheetFrameCount?: number;
  foodAnimationVideoSrc?: string;
  foodAnimationFrameDurationMs?: number;
  foodAnimationAspectRatio?: string;
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
type FoodItem = { id: string; name: string; note: string; imageSrc: string };
type RaceTrait = keyof Persona['traits'];
type RaceObstacleKind =
  | 'napkin-gust'
  | 'tea-puddle'
  | 'wobble-stack'
  | 'shortcut-reflection'
  | 'broken-cart'
  | 'ribbon-tunnel'
  | 'cushion-pile'
  | 'flour-sacks'
  | 'crumb-trail'
  | 'garnish-gate'
  | 'steam-gadget'
  | 'bento-stack';
type RaceEncounterResult = 'clear' | 'slow' | 'surge' | 'reroute';
type RaceRunnerReaction = 'ready' | 'jump' | 'dodge' | 'slide' | 'duck' | 'stumble' | 'weave' | 'surge';
type RaceObstacle = {
  id: string;
  kind: RaceObstacleKind;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  position: number;
  sourcePersonaId: string;
};
type RaceEncounter = {
  result: RaceEncounterResult;
  headline: string;
  detail: string;
};
type RaceLaneSimulation = {
  personaId: string;
  positions: Record<ContestStep, number>;
  finishPosition: number;
  finishScore: number;
  encounters: Record<string, RaceEncounter>;
  checkpoints: RaceTimelineCheckpoint[];
};
type RaceLeadChange = {
  obstacleId: string;
  fromPersonaId: string;
  toPersonaId: string;
  kind: 'overtake' | 'reversal';
};
type RaceSimulation = {
  obstacles: RaceObstacle[];
  lanes: RaceLaneSimulation[];
  winnerId: string;
  checkpointLeaders: Record<string, { beforeId: string; afterId: string }>;
  leadChanges: RaceLeadChange[];
};
type ContestOutcome = { winner: Persona; memorableEvent: string; contestName: string; race: RaceSimulation };
type ContestStep = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';

const queryClient = new QueryClient();
const METER_KEY = 'mystery-bento-meter';
const LEDGER_KEY = 'mystery-bento-ledger';
const CURIO_KEY = 'mystery-bento-curios';
const VOICE_ANNOUNCER_KEY = 'mystery-bento-voice-announcer';
const ANNOUNCER_AUDIO_BASE = `${import.meta.env.BASE_URL}audio/announcer`;
const PIP_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/pip-making-food-sprite-sheet.png`;
const RESTAURANT_BACKDROP_SRC = `${import.meta.env.BASE_URL}restaurant-background-attached.png`;
const SUSHI_PLATE_WARM_SRC = `${import.meta.env.BASE_URL}sushi-plate-warm.png`;
const SUSHI_PLATE_COOL_SRC = `${import.meta.env.BASE_URL}sushi-plate-cool.png`;
const SUSHI_PLATE_SHRIMP_SRC = `${import.meta.env.BASE_URL}sushi-plate-shrimp.png`;
const SUSHI_PLATE_ROLLS_SRC = `${import.meta.env.BASE_URL}sushi-plate-rolls.png`;
const SUSHI_PLATE_SALMON_SRC = `${import.meta.env.BASE_URL}sushi-plate-salmon.png`;
const SUSHI_PLATE_NIGIRI_SRC = `${import.meta.env.BASE_URL}sushi-plate-nigiri.png`;
const SENCHA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/sencha-making-tea-sprite-sheet.png`;

const TORO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/captain-toro-cooking-sprite-sheet.png`;
const NORI_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/nori-nib-cooking-sprite-sheet.png`;
const TILDA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/tilda-tofu-cooking-sprite-sheet.png`;
const ROLLO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/rollo-radish-cooking-sprite-sheet.png`;
const KIKU_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/kiku-kettle-cooking-sprite-sheet.png`;
const SAFFY_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/saffy-sashimi-cooking-sprite-sheet.png`;
const UMA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/uma-udon-cooking-sprite-sheet.png`;
const MISO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/miso-mallow-cooking-sprite-sheet.png`;
const PANKO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/panko-puff-cooking-sprite-sheet.png`;
const BIBI_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/bibi-bento-cooking-sprite-sheet.png`;
const MIN_ANNOUNCER_GAP_MS = 520;

const FINISH_CROSSING_SETTLE_MS = 240;
type AnnouncerClip = { id: string; src: string; label: string; durationMs: number };
type AnnouncerBeat = {
  id: string;
  step: ContestStep;
  label: string;
  clips: AnnouncerClip[];
  offset: number;
  deadlineOffset: number;
  gapAfterMs?: number;
};

// These are conservative metadata hints for the bundled clips. Runtime metadata
// can replace them after preload, but the schedule never has to wait for it.
const announcerClipDurations: Record<string, number> = {
  'character-intros/contestants-are': 1330,
  'race-starts/race-start-quiet-kitchen': 6350,
  'character-names/bibi': 850,
  'character-names/kiku': 850,
  'character-names/miso': 800,
  'character-names/nori': 900,
  'character-names/panko': 800,
  'character-names/pip': 500,
  'character-names/rollo': 800,
  'character-names/saffy': 800,
  'character-names/sencha': 750,
  'character-names/tilda': 900,
  'character-names/toro': 800,
  'character-names/uma': 750,
  'obstacles/bento-stack-at-the-finish': 1550,
  'obstacles/broken-cart-across-the-course': 1650,
  'obstacles/crumb-trail-ahead': 1150,
  'obstacles/cushion-pile-ahead': 1360,
  'obstacles/flour-sacks-coming-into-the-lane': 1780,
  'obstacles/garnish-gate-ahead': 1330,
  'obstacles/moon-reflection-ahead': 1360,
  'obstacles/napkin-gust-ahead': 1230,
  'obstacles/ribbon-tunnel-ahead': 1280,
  'obstacles/steam-gadget-ahead': 1460,
  'obstacles/tea-puddle-ahead': 1230,
  'obstacles/wobble-stack-ahead': 1230,
  'result-fragments/clean-line': 1000,
  'result-fragments/finds-an-unexpected-opening': 1460,
  'result-fragments/rerouted': 1000,
  'result-fragments/slowed-down': 1230,
  'reactions/ducks-beneath-it-and-keeps-moving': 2010,
  'reactions/jumps-over-it-and-keeps-moving': 2060,
  'reactions/sidesteps-it-and-holds-the-line': 1780,
  'reactions/slides-around-it-and-recovers': 1830,
  'reactions/stumbles-steadies-and-carries-on': 2490,
  'reactions/surges-through-the-opening': 1570,
  'reactions/weaves-through-and-finds-a-stranger-line': 2310,
  'pace-lead-changes/field-beginning-to-stretch': 1840,
  'pace-lead-changes/lead-changed-hands': 1580,
  'pace-lead-changes/new-leader-lantern-route': 1760,
  'pace-lead-changes/one-contender-finding-another-gear': 2180,
  'pace-lead-changes/pack-still-together': 1420,
  'stage-transitions/around-bend-into-matchup': 2210,
  'stage-transitions/finish-in-sight': 1430,
  'stage-transitions/warm-up-underway': 1480,
  'finish-results/takes-the-win': 1180,
};

const announcerClip = (family: string, file: string, label: string): AnnouncerClip => {
  const id = `${family}/${file}`;
  return {
    id,
    src: `${ANNOUNCER_AUDIO_BASE}/${family}/${file}.mp3`,
    label,
    durationMs: announcerClipDurations[id] ?? 2000,
  };
};

const obstacleAnnouncerClips: Record<RaceObstacleKind, [AnnouncerClip, AnnouncerClip]> = {
  'napkin-gust': [
    announcerClip('obstacles', 'napkin-gust-ahead', 'Napkin gust ahead'),
    announcerClip('obstacles', 'napkin-gust-sweeping-straightaway', 'Napkin gust sweeping across the straightaway'),
  ],
  'tea-puddle': [
    announcerClip('obstacles', 'tea-puddle-ahead', 'Tea puddle ahead'),
    announcerClip('obstacles', 'tea-puddle-careful-step', 'Tea puddle, careful step'),
  ],
  'wobble-stack': [
    announcerClip('obstacles', 'wobble-stack-ahead', 'Wobble stack ahead'),
    announcerClip('obstacles', 'wobble-stack-swaying-across-lane', 'Wobble stack swaying across the lane'),
  ],
  'shortcut-reflection': [
    announcerClip('obstacles', 'moon-reflection-ahead', 'Moon reflection ahead'),
    announcerClip('obstacles', 'moon-reflection-hiding-shortcut', 'Moon reflection hiding a shortcut'),
  ],
  'broken-cart': [
    announcerClip('obstacles', 'broken-cart-across-the-course', 'Broken cart across the course'),
    announcerClip('obstacles', 'broken-cart-blocking-course', 'Broken cart blocking the course'),
  ],
  'ribbon-tunnel': [
    announcerClip('obstacles', 'ribbon-tunnel-ahead', 'Ribbon tunnel ahead'),
    announcerClip('obstacles', 'ribbon-tunnel-moving-faster', 'Ribbon tunnel moving faster'),
  ],
  'cushion-pile': [
    announcerClip('obstacles', 'cushion-pile-ahead', 'Cushion pile ahead'),
    announcerClip('obstacles', 'cushion-pile-blocking-safest-route', 'Cushion pile blocking the safest route'),
  ],
  'flour-sacks': [
    announcerClip('obstacles', 'flour-sacks-coming-into-the-lane', 'Flour sacks coming into the lane'),
    announcerClip('obstacles', 'flour-sacks-tumbling-side-door', 'Flour sacks tumbling from the side door'),
  ],
  'crumb-trail': [
    announcerClip('obstacles', 'crumb-trail-ahead', 'Crumb trail ahead'),
    announcerClip('obstacles', 'crumb-trail-behind-crates', 'Crumb trail behind the crates'),
  ],
  'garnish-gate': [
    announcerClip('obstacles', 'garnish-gate-ahead', 'Garnish gate ahead'),
    announcerClip('obstacles', 'garnish-gate-one-elegant-line', 'Garnish gate, one elegant line'),
  ],
  'steam-gadget': [
    announcerClip('obstacles', 'steam-gadget-ahead', 'Steam gadget ahead'),
    announcerClip('obstacles', 'steam-gadget-filled-lane-with-fog', 'Steam gadget filled the lane with fog'),
  ],
  'bento-stack': [
    announcerClip('obstacles', 'bento-stack-at-the-finish', 'Bento stack at the finish'),
    announcerClip('obstacles', 'bento-stack-narrowed-final-lane', 'Bento stack narrowed the final lane'),
  ],
};

const resultAnnouncerClips: Record<RaceEncounterResult, AnnouncerClip> = {
  clear: announcerClip('result-fragments', 'clean-line', 'clean line'),
  slow: announcerClip('result-fragments', 'slowed-down', 'slowed down'),
  surge: announcerClip('result-fragments', 'finds-an-unexpected-opening', 'finds an unexpected opening'),
  reroute: announcerClip('result-fragments', 'rerouted', 'rerouted'),
};

const reactionAnnouncerClips: Record<Exclude<RaceRunnerReaction, 'ready'>, AnnouncerClip> = {
  jump: announcerClip('reactions', 'jumps-over-it-and-keeps-moving', 'jumps over it and keeps moving'),
  dodge: announcerClip('reactions', 'sidesteps-it-and-holds-the-line', 'sidesteps it and holds the line'),
  slide: announcerClip('reactions', 'slides-around-it-and-recovers', 'slides around it and recovers'),
  duck: announcerClip('reactions', 'ducks-beneath-it-and-keeps-moving', 'ducks beneath it and keeps moving'),
  stumble: announcerClip('reactions', 'stumbles-steadies-and-carries-on', 'stumbles, steadies, and carries on'),
  weave: announcerClip('reactions', 'weaves-through-and-finds-a-stranger-line', 'weaves through and finds a stranger line'),
  surge: announcerClip('reactions', 'surges-through-the-opening', 'surges through the opening'),
};

const stageAnnouncerClips: Partial<Record<ContestStep, AnnouncerClip>> = {
  warmup: announcerClip('stage-transitions', 'warm-up-underway', 'Warm-up underway'),
  matchup: announcerClip('stage-transitions', 'around-bend-into-matchup', 'Around the bend into the matchup'),
  finale: announcerClip('stage-transitions', 'finish-in-sight', 'Finish in sight'),
};

const paceAnnouncerClips = [
  announcerClip('pace-lead-changes', 'pack-still-together', 'The pack is still together'),
  announcerClip('pace-lead-changes', 'field-beginning-to-stretch', 'The field is beginning to stretch'),
  announcerClip('pace-lead-changes', 'lead-changed-hands', 'The lead changed hands'),
  announcerClip('pace-lead-changes', 'new-leader-lantern-route', 'A new leader takes the lantern route'),
  announcerClip('pace-lead-changes', 'one-contender-finding-another-gear', 'One contender finds another gear'),
];

const cookingSpriteSheetFrameCounts: Record<string, number> = {
  bibi: 52,
  toro: 25,
  kiku: 28,
  miso: 55,
  nori: 56,
  panko: 34,
  pip: 25,
  rollo: 51,
  saffy: 49,
  sencha: 25,
  tilda: 49,
  uma: 44,
};

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
  quirk: design.quirk,
  contestBehavior: design.contestBehavior,
  memorableEvent: design.memorableEvent,
  portraitSrc: contestantPortraits[design.id],
  foodSpriteSrc: contestantFoodSprites[design.id],
  foodAnimationFrameSrcs: design.id === 'pip' || design.id === 'sencha' || design.id === 'toro' ? undefined : contestantFoodAnimationFrames[design.id],
  foodAnimationSpriteSheetSrc: design.id === 'pip'
    ? PIP_ANIMATION_SPRITE_SHEET_SRC
    : design.id === 'sencha'
      ? SENCHA_ANIMATION_SPRITE_SHEET_SRC
      : design.id === 'toro'
        ? TORO_ANIMATION_SPRITE_SHEET_SRC
        : design.id === 'nori'
          ? NORI_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'tilda'
            ? TILDA_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'rollo'
            ? ROLLO_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'kiku'
            ? KIKU_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'saffy'
            ? SAFFY_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'uma'
            ? UMA_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'miso'
            ? MISO_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'panko'
            ? PANKO_ANIMATION_SPRITE_SHEET_SRC
          : design.id === 'bibi'
            ? BIBI_ANIMATION_SPRITE_SHEET_SRC
        : undefined,
  foodAnimationSpriteSheetColumns: design.id === 'bibi' || design.id === 'kiku' || design.id === 'miso' || design.id === 'nori' || design.id === 'panko' || design.id === 'rollo' || design.id === 'saffy' || design.id === 'tilda' || design.id === 'uma' ? 8 : design.id === 'pip' || design.id === 'sencha' || design.id === 'toro' ? 5 : undefined,
  foodAnimationSpriteSheetRows: design.id === 'kiku' ? 4 : design.id === 'uma' ? 6 : design.id === 'bibi' || design.id === 'miso' || design.id === 'nori' || design.id === 'rollo' || design.id === 'saffy' || design.id === 'tilda' ? 7 : design.id === 'panko' || design.id === 'pip' || design.id === 'sencha' || design.id === 'toro' ? 5 : undefined,
  foodAnimationSpriteSheetFrameCount: cookingSpriteSheetFrameCounts[design.id],
  foodAnimationFrameDurationMs: design.id === 'bibi' || design.id === 'kiku' || design.id === 'miso' || design.id === 'nori' || design.id === 'panko' || design.id === 'rollo' || design.id === 'saffy' || design.id === 'tilda' || design.id === 'uma' || design.id === 'pip' || design.id === 'sencha' || design.id === 'toro' ? Math.round(1000 / 12) : undefined,
  foodAnimationAspectRatio: contestantFoodAnimationAspectRatios[design.id],
}));
const spriteSheetContestants = personas.filter((persona) => (
  Boolean(
    persona.foodAnimationSpriteSheetSrc
    && persona.foodAnimationSpriteSheetColumns
    && persona.foodAnimationSpriteSheetRows
    && persona.foodAnimationSpriteSheetFrameCount,
  )
));

const foodItems: FoodItem[] = [
  { id: 'tamago', name: 'Sunset tamago', note: 'soft, sweet, perfectly tucked', imageSrc: SUSHI_PLATE_WARM_SRC },
  { id: 'plum', name: 'Plum onigiri', note: 'a bright little secret', imageSrc: SUSHI_PLATE_COOL_SRC },
  { id: 'tofu', name: 'Sesame tofu', note: 'quietly nutty, cool as moonlight', imageSrc: SUSHI_PLATE_WARM_SRC },
  { id: 'eel', name: 'Lantern eel', note: 'smoky ribbons from the night stall', imageSrc: SUSHI_PLATE_COOL_SRC },
  { id: 'shrimp-temaki', name: 'Firecracker temaki', note: 'sweet shrimp with a bright cucumber snap', imageSrc: SUSHI_PLATE_SHRIMP_SRC },
  { id: 'garden-maki', name: 'Moon garden maki', note: 'cool green rolls scattered with sesame', imageSrc: SUSHI_PLATE_ROLLS_SRC },
  { id: 'salmon-duo', name: 'Salmon sunset duo', note: 'two rich cuts tucked over warm rice', imageSrc: SUSHI_PLATE_SALMON_SRC },
  { id: 'night-salmon', name: 'Night-market salmon', note: 'glossy salmon served on the midnight plate', imageSrc: SUSHI_PLATE_NIGIRI_SRC },
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

const contestDurations = RACE_STAGE_DURATIONS;

const contestStepOffsets: Record<ContestStep, number> = {
  intro: 0,
  warmup: contestDurations.intro,
  matchup: contestDurations.intro + contestDurations.warmup,
  finale: contestDurations.intro + contestDurations.warmup + contestDurations.matchup,
  winner: contestDurations.intro + contestDurations.warmup + contestDurations.matchup + contestDurations.finale,
};
const RACE_FINISH_VISIBLE_FRACTION = 0.98;
const RACE_FINISH_ANNOUNCEMENT_DELAY_MS = 120;
const RACE_FINISH_VISIBLE_OFFSET_MS = Math.round(
  contestDurations.finale
  * (RACE_FINISH_VISIBLE_FRACTION * (RACE_FINALE_WORLD_END_PERCENT - RACE_FINALE_WORLD_START_PERCENT)
    / (RACE_FINALE_WORLD_END_PERCENT - RACE_FINALE_WORLD_START_PERCENT)),
);

function getRaceFinishVisibleOffset(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? 0 : RACE_FINISH_VISIBLE_OFFSET_MS;
}

function getRaceFinishVisibleAt(startedAt: number, prefersReducedMotion: boolean) {
  return startedAt + contestStepOffsets.finale + getRaceFinishVisibleOffset(prefersReducedMotion);
}
const contestNextStep: Partial<Record<ContestStep, ContestStep>> = {
  intro: 'warmup',
  warmup: 'matchup',
  matchup: 'finale',
  finale: 'winner',
};

const raceStepProgress: Record<ContestStep, number> = {
  intro: 0,
  warmup: 1,
  matchup: 2,
  finale: 3,
  winner: 4,
};

const raceObstacleCatalog: Record<RaceObstacleKind, {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  primaryTrait: RaceTrait;
  secondaryTrait: RaceTrait;
}> = {
  'napkin-gust': { label: 'Napkin gust', shortLabel: 'napkin gust', description: 'a loose napkin gust turns the straightaway into a paper storm', icon: '≈', primaryTrait: 'speed', secondaryTrait: 'focus' },
  'tea-puddle': { label: 'Tea puddle', shortLabel: 'tea puddle', description: 'a perfect tea puddle demands a very exact step', icon: '◌', primaryTrait: 'focus', secondaryTrait: 'balance' },
  'wobble-stack': { label: 'Wobble stack', shortLabel: 'wobble stack', description: 'a tower of bowls sways across the narrow lane', icon: '≋', primaryTrait: 'balance', secondaryTrait: 'focus' },
  'shortcut-reflection': { label: 'Moon reflection', shortLabel: 'moon reflection', description: 'a puddle reflection appears to reveal a suspicious shortcut', icon: '✦', primaryTrait: 'luck', secondaryTrait: 'focus' },
  'broken-cart': { label: 'Broken cart', shortLabel: 'broken cart', description: 'a pantry cart has parked itself directly across the course', icon: '□', primaryTrait: 'focus', secondaryTrait: 'chaos' },
  'ribbon-tunnel': { label: 'Ribbon tunnel', shortLabel: 'ribbon tunnel', description: 'celebration ribbons knot together into a fast-moving tunnel', icon: '∿', primaryTrait: 'chaos', secondaryTrait: 'luck' },
  'cushion-pile': { label: 'Cushion pile', shortLabel: 'cushion pile', description: 'a polite stack of cushions blocks the safest-looking route', icon: '⌂', primaryTrait: 'balance', secondaryTrait: 'chaos' },
  'flour-sacks': { label: 'Flour sacks', shortLabel: 'flour sacks', description: 'fresh flour sacks tumble into the lane from the side door', icon: '▦', primaryTrait: 'speed', secondaryTrait: 'balance' },
  'crumb-trail': { label: 'Crumb trail', shortLabel: 'crumb trail', description: 'one bright crumb trail winds behind a tempting stack of crates', icon: '·', primaryTrait: 'luck', secondaryTrait: 'focus' },
  'garnish-gate': { label: 'Garnish gate', shortLabel: 'a garnish gate', description: 'two precise garnish poles leave one elegant line through', icon: '╫', primaryTrait: 'focus', secondaryTrait: 'balance' },
  'steam-gadget': { label: 'Steam gadget', shortLabel: 'steam gadget', description: 'a little kettle device fills the lane with expressive steam', icon: '☼', primaryTrait: 'luck', secondaryTrait: 'focus' },
  'bento-stack': { label: 'Bento stack', shortLabel: 'bento stack', description: 'a stack of empty bento boxes makes the finish lane narrow', icon: '▤', primaryTrait: 'balance', secondaryTrait: 'speed' },
};

const personaObstacleKinds: Record<string, RaceObstacleKind> = {
  pip: 'napkin-gust',
  sencha: 'tea-puddle',
  toro: 'wobble-stack',
  nori: 'shortcut-reflection',
  tilda: 'broken-cart',
  rollo: 'ribbon-tunnel',
  miso: 'cushion-pile',
  uma: 'flour-sacks',
  panko: 'crumb-trail',
  saffy: 'garnish-gate',
  kiku: 'steam-gadget',
  bibi: 'bento-stack',
};

const raceJumpObstacleKinds = new Set<RaceObstacleKind>([
  'napkin-gust',
  'tea-puddle',
  'ribbon-tunnel',
  'flour-sacks',
  'steam-gadget',
]);

function getRaceRunnerReaction(obstacleKind: RaceObstacleKind, result: RaceEncounterResult): RaceRunnerReaction {
  if (result === 'slow') return obstacleKind === 'tea-puddle' || obstacleKind === 'crumb-trail' ? 'slide' : 'stumble';
  if (result === 'reroute') return obstacleKind === 'shortcut-reflection' || obstacleKind === 'cushion-pile' ? 'weave' : 'dodge';
  if (result === 'surge') return raceJumpObstacleKinds.has(obstacleKind) ? 'jump' : 'surge';
  if (obstacleKind === 'wobble-stack' || obstacleKind === 'bento-stack') return 'duck';
  return raceJumpObstacleKinds.has(obstacleKind) ? 'jump' : 'dodge';
}
function buildAnnouncerSequence(contestants: Persona[], race: RaceSimulation, prefersReducedMotion = false): AnnouncerBeat[] {
  const beats: AnnouncerBeat[] = [
    {
      id: 'intro-opening',
      step: 'intro',
      label: 'Tonight’s contestants are',
      offset: 0,
      deadlineOffset: contestDurations.intro,
      // Names are individual clips, so a shorter handoff keeps the roster
      // sounding like one introduction instead of a series of pauses.
      gapAfterMs: 180,
      clips: [
        announcerClip('character-intros', 'contestants-are', 'Tonight’s contestants are'),
        ...contestants.map((persona) => announcerClip('character-names', persona.id, persona.name)),
        announcerClip('race-starts', 'race-start-quiet-kitchen', 'The race is underway'),
      ],
    },
  ];
  let cleanLineAnnounced = false;

  const stageSteps: ContestStep[] = ['warmup', 'matchup', 'finale'];
  stageSteps.forEach((stage, stageIndex) => {
    const stageDuration = contestDurations[stage];
    const obstacleIndices = stage === 'finale' ? [2, 3] : [stageIndex];
    const obstacleMilestones = obstacleIndices
      .map((obstacleIndex) => race.obstacles[obstacleIndex])
      .filter((obstacle): obstacle is RaceObstacle => Boolean(obstacle))
      .map((obstacle) => ({
        obstacle,
        hitOffset: getTimelineFirstRunnerObstacleHitOffset(stage, obstacle, race.lanes, race.obstacles, prefersReducedMotion),
        // The obstacle cue is a milestone call, not a broad lead-in. Starting it
        // at the first resolved crossing keeps narration attached to the visual
        // encounter; the deadline below prevents queueing it late.
        offset: getTimelineFirstRunnerObstacleHitOffset(stage, obstacle, race.lanes, race.obstacles, prefersReducedMotion),
      }));
    const firstObstacleOffset = obstacleMilestones[0]?.offset ?? stageDuration;
    const transition = stageAnnouncerClips[stage];
    if (transition) {
      const transitionOffset = stage === 'finale'
        ? getRaceFinishVisibleOffset(prefersReducedMotion) + RACE_FINISH_ANNOUNCEMENT_DELAY_MS
        : 220;
      beats.push({
        id: `stage-${stage}`,
        step: stage,
        label: transition.label,
        offset: transitionOffset,
        deadlineOffset: stage === 'finale'
          ? contestDurations.finale + FINISH_CROSSING_SETTLE_MS + 2200
          : firstObstacleOffset,
        clips: [transition],
      });
    }
    obstacleMilestones.forEach(({ obstacle, offset }, obstacleOrder) => {
      const leaderId = race.checkpointLeaders[obstacle.id]?.afterId;
      const leadLane = race.lanes.find((lane) => lane.personaId === leaderId)
        ?? [...race.lanes].sort((a, b) => {
          const aCheckpoint = a.checkpoints.find((checkpoint) => checkpoint.obstacleId === obstacle.id);
          const bCheckpoint = b.checkpoints.find((checkpoint) => checkpoint.obstacleId === obstacle.id);
          return (bCheckpoint?.exitPosition ?? b.positions[stage]) - (aCheckpoint?.exitPosition ?? a.positions[stage]);
        })[0]
        ?? race.lanes[0];
      const encounter = leadLane?.encounters[obstacle.id];
      const reaction = encounter ? getRaceRunnerReaction(obstacle.kind, encounter.result) : 'ready';
      const clips: AnnouncerClip[] = [
        obstacleAnnouncerClips[obstacle.kind]?.[0],
      ].filter((clip): clip is AnnouncerClip => Boolean(clip));
      if (encounter) {
        if (encounter.result === 'clear') {
          clips.push(cleanLineAnnounced && reaction !== 'ready' ? reactionAnnouncerClips[reaction] : resultAnnouncerClips.clear);
          cleanLineAnnounced = true;
        } else {
          clips.push(reaction === 'ready'
            ? resultAnnouncerClips[encounter.result]
            : reactionAnnouncerClips[reaction]);
        }
      }
      beats.push({
        id: `obstacle-${obstacle.id}`,
        step: stage,
        label: `${obstacle.label} callout`,
        offset,
        deadlineOffset: obstacleMilestones[obstacleOrder + 1]?.offset ?? stageDuration,
        clips,
      });
    });

    const stageObstacleIds = obstacleIndices
      .map((obstacleIndex) => race.obstacles[obstacleIndex]?.id)
      .filter((obstacleId): obstacleId is string => Boolean(obstacleId));
    const stageLeadChanges = race.leadChanges.filter((change) => stageObstacleIds.includes(change.obstacleId));
    const gap = race.lanes.length > 1
      ? (Math.max(...race.lanes.map((lane) => lane.positions[stage])) - Math.min(...race.lanes.map((lane) => lane.positions[stage])))
      : 0;
    stageLeadChanges.forEach((change) => {
      const changeObstacle = race.obstacles.find((obstacle) => obstacle.id === change.obstacleId);
      const changeMilestone = obstacleMilestones.find((milestone) => milestone.obstacle.id === change.obstacleId);
      if (!changeObstacle || !changeMilestone) return;
      const paceClip = change.kind === 'reversal' ? paceAnnouncerClips[3] : paceAnnouncerClips[2];
      const changeIndex = stageLeadChanges.indexOf(change);
      beats.push({
        id: `pace-${stage}-${changeObstacle.id}-${changeIndex}`,
        step: stage,
        label: paceClip.label,
        offset: changeMilestone.offset,
        deadlineOffset: obstacleMilestones[obstacleMilestones.indexOf(changeMilestone) + 1]?.offset ?? stageDuration,
        clips: [paceClip],
      });
    });
    if (!stageLeadChanges.length && stage !== 'finale') {
      const paceClip = stage === 'warmup'
        ? paceAnnouncerClips[0]
        : gap > 28
          ? paceAnnouncerClips[1]
          : paceAnnouncerClips[4];
      const paceOffset = stage === 'warmup' ? 4_600 : 5_700;
      const nextMilestone = obstacleMilestones.find((milestone) => milestone.offset > paceOffset)?.offset ?? stageDuration;
      beats.push({
        id: `pace-${stage}`,
        step: stage,
        label: paceClip.label,
        offset: paceOffset,
        deadlineOffset: nextMilestone,
        clips: [paceClip],
      });
    }
  });

  const winner = contestants.find((persona) => persona.id === race.winnerId);
  if (winner) {
    beats.push({
      id: 'winner-call',
      step: 'winner',
      label: `${winner.name} takes the win`,
      offset: 900,
      deadlineOffset: contestDurations.winner - 500,
      clips: [
        announcerClip('character-names', winner.id, winner.name),
        announcerClip('finish-results', 'takes-the-win', 'takes the win'),
      ],
    });
  }
  return beats;
}

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

function clampRacePosition(value: number) {
  return Math.min(96, Math.max(4, value));
}

function buildRaceSimulation(contestants: Persona[], rng: () => number): RaceSimulation {
  const obstaclePositions = [18, 40, 62, 83];
  const fallbackKinds = shuffleWithRng(Object.keys(raceObstacleCatalog) as RaceObstacleKind[], rng);
  const selectedKinds = contestants.map((persona) => personaObstacleKinds[persona.id] ?? fallbackKinds[0]).slice(0, 4);
  for (const kind of fallbackKinds) {
    if (selectedKinds.length >= 4) break;
    if (!selectedKinds.includes(kind)) selectedKinds.push(kind);
  }
  const obstacles = selectedKinds.map((kind, index) => {
    const catalog = raceObstacleCatalog[kind];
    const sourcePersona = contestants[index % Math.max(1, contestants.length)] ?? spriteSheetContestants[0];
    if (!sourcePersona) throw new Error('No sprite-sheet contestants are configured.');
    return {
      id: `obstacle-${index + 1}`,
      kind,
      label: catalog.label,
      shortLabel: catalog.shortLabel,
      description: `${sourcePersona.name}'s signature hazard: ${catalog.description}. Their quirk — ${sourcePersona.quirk.toLowerCase()} — makes this one personal.`,
      icon: catalog.icon,
      position: obstaclePositions[index] ?? 83,
      sourcePersonaId: sourcePersona.id,
    };
  });

  type WorkingRaceLane = RaceLaneSimulation & { persona: Persona; progress: number };
  const lanes: WorkingRaceLane[] = contestants.map((persona) => {
    const startingStagger = (persona.traits.speed - 50) * 0.11
      + (persona.traits.chaos - 50) * 0.07
      + rng() * 8 - 4;
    let progress = 6 + persona.traits.speed * 0.06 + startingStagger;
    const lane: WorkingRaceLane = {
      persona,
      progress,
      encounters: {},
      checkpoints: [],
      finishPosition: 92,
      finishScore: 0,
      personaId: persona.id,
      positions: {
        intro: clampRacePosition(progress),
        warmup: clampRacePosition(progress),
        matchup: clampRacePosition(progress),
        finale: clampRacePosition(progress),
        winner: 92,
      },
    };
    return lane;
  });

  const checkpointLeaders: Record<string, { beforeId: string; afterId: string }> = {};
  const leadChanges: RaceLeadChange[] = [];
  const previouslyLed = new Set<string>();
  const startingLeader = [...lanes].sort((a, b) => b.progress - a.progress)[0];
  if (startingLeader) previouslyLed.add(startingLeader.personaId);

  obstacles.forEach((obstacle, obstacleIndex) => {
    const rankingBefore = [...lanes].sort((a, b) => b.progress - a.progress);
    const spread = (rankingBefore[0]?.progress ?? 0) - (rankingBefore[rankingBefore.length - 1]?.progress ?? 0);
    const leaderBefore = rankingBefore[0];

    lanes.forEach((lane) => {
      const rankIndex = rankingBefore.indexOf(lane);
      const catalog = raceObstacleCatalog[obstacle.kind];
      const result: RaceEncounterResult = resolveRaceEncounterResult({
        traits: lane.persona.traits,
        primaryTrait: catalog.primaryTrait,
        secondaryTrait: catalog.secondaryTrait,
        obstacleKind: obstacle.kind,
        rankIndex,
        laneCount: rankingBefore.length,
        spread,
        rng,
      });
      const progressDelta = result === 'surge' ? 16 : result === 'slow' ? -16 : result === 'reroute' ? -7 : 3;
      const pace = 18
        + (lane.persona.traits.speed - 50) * 0.05
        + (lane.persona.traits.focus - 50) * 0.015;
      const approachPosition = lane.progress;
      const rawExitPosition = approachPosition + pace + progressDelta;
      const nextObstaclePosition = obstacles[obstacleIndex + 1]?.position;
      const maximumExitPosition = typeof nextObstaclePosition === 'number'
        ? nextObstaclePosition - 2
        : 96;
      const exitPosition = clampRacePosition(
        Math.max(obstacle.position + 1, Math.min(rawExitPosition, maximumExitPosition)),
      );
      lane.progress = exitPosition;
      lane.checkpoints.push({
        obstacleId: obstacle.id,
        approachPosition,
        crossingPosition: obstacle.position,
        exitPosition,
      });
      const encounterCopy: Record<RaceEncounterResult, { headline: string; detail: string }> = {
        clear: { headline: 'clean line', detail: `${lane.persona.name} reads the ${catalog.shortLabel} and keeps pace. Their routine holds.` },
        slow: { headline: 'slowed down', detail: `${lane.persona.name} loses a few steps at the ${catalog.shortLabel}; ${lane.persona.contestBehavior.toLowerCase()}` },
        surge: { headline: 'found a break', detail: `${lane.persona.name} turns the ${catalog.shortLabel} into an unexpected opening. ${lane.persona.quirk}` },
        reroute: { headline: 'rerouted', detail: `${lane.persona.name} takes the strange line around the ${catalog.shortLabel}; ${lane.persona.contestBehavior}` },
      };
      const reaction = getRaceRunnerReaction(obstacle.kind, result);
      const reactionCopy: Record<RaceRunnerReaction, string> = {
        ready: 'They hold at the starting lantern.',
        jump: 'They jump over it with a bright little hop.',
        dodge: 'They sidestep it and keep their line.',
        slide: 'They slide around it, lose a few steps, and recover.',
        duck: 'They duck beneath it and keep moving.',
        stumble: 'They stumble, steady themselves, and lose a few steps.',
        weave: 'They weave through the clutter and find a stranger line.',
        surge: 'They spring over the opening and surge ahead.',
      };
      lane.encounters[obstacle.id] = {
        result,
        ...encounterCopy[result],
        detail: `${encounterCopy[result].detail} ${reactionCopy[reaction]}`,
      };
    });

    const rankingAfter = [...lanes].sort((a, b) => b.progress - a.progress);
    const leaderAfter = rankingAfter[0];
    if (!leaderBefore || !leaderAfter) return;
    checkpointLeaders[obstacle.id] = {
      beforeId: leaderBefore.personaId,
      afterId: leaderAfter.personaId,
    };
    if (leaderBefore.personaId !== leaderAfter.personaId) {
      leadChanges.push({
        obstacleId: obstacle.id,
        fromPersonaId: leaderBefore.personaId,
        toPersonaId: leaderAfter.personaId,
        kind: previouslyLed.has(leaderAfter.personaId) ? 'reversal' : 'overtake',
      });
    }
    previouslyLed.add(leaderAfter.personaId);
    if (obstacleIndex === 0) lanes.forEach((lane) => { lane.positions.warmup = lane.progress; });
    if (obstacleIndex === 1) lanes.forEach((lane) => { lane.positions.matchup = lane.progress; });
    if (obstacleIndex >= 2) lanes.forEach((lane) => { lane.positions.finale = lane.progress; });
  });

  if (obstacles.length < 3) lanes.forEach((lane) => { lane.positions.finale = lane.progress; });
  lanes.forEach((lane) => {
    lane.finishScore = lane.progress
      + lane.persona.traits.speed * 0.28
      + lane.persona.traits.balance * 0.1
      + lane.persona.traits.focus * 0.12
      + lane.persona.traits.luck * 0.14
      + (100 - lane.persona.traits.chaos) * 0.06
      + rng() * 8 - 4;
    lane.finishPosition = clampRacePosition(lane.progress + lane.persona.traits.focus * 0.08 + lane.persona.traits.luck * 0.06 + lane.persona.traits.chaos * 0.03 + rng() * 10 - 5);
    lane.positions.winner = lane.finishPosition;
  });

  const winnerLane = [...lanes].sort((a, b) => b.finishScore - a.finishScore)[0] ?? lanes[0];
  const winnerId = winnerLane?.personaId ?? contestants[0]?.id ?? spriteSheetContestants[0]?.id;
  if (!winnerId) throw new Error('Cannot build a race without a sprite-sheet contestant.');
  return {
    obstacles,
    lanes: lanes.map(({ persona: _persona, progress: _progress, ...lane }) => lane),
    winnerId,
    checkpointLeaders,
    leadChanges,
  };
}

function resolveContest(contestants: Persona[], rng: () => number): ContestOutcome {
  if (contestants.some((contestant) => !spriteSheetContestants.some((persona) => persona.id === contestant.id))) {
    throw new Error('A contest roster contains a contestant without a cooking sprite sheet.');
  }
  const race = buildRaceSimulation(contestants, rng);
  const winner = contestants.find((persona) => persona.id === race.winnerId) ?? contestants[0] ?? spriteSheetContestants[0];
  if (!winner) throw new Error('Cannot resolve a contest without a sprite-sheet contestant.');
  return {
    winner,
    memorableEvent: winner.memorableEvent,
    contestName: contestNames[Math.floor(rng() * contestNames.length)] ?? contestNames[0],
    race,
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

function FoodPlateArt({ item, selection = false }: { item: FoodItem; selection?: boolean }) {
  return <img className={`food-plate-image${selection ? ' food-plate-image-selection' : ''}`} src={item.imageSrc} alt="" aria-hidden="true" />;
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
            <FoodPlateArt item={item} selection />
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

function CurioBacksplash({ collectibles, showReturnSign }: { collectibles: Collectible[]; showReturnSign: boolean }) {
  const byZone = (zone: CurioDisplayZone) => collectibles.filter((item) => getCurioDisplayZone(item) === zone);
  const houseKeeps = byZone('house-keeps');
  const teaTools = byZone('tea-tools');
  const sparePlates = byZone('spare-plates');
  const littleFinds = byZone('little-finds');
  const emptySlot = (items: Collectible[], index: number, small = false) => (
    items[index] ? null : <span className={`background-shelf-slot${small ? ' background-shelf-slot-small' : ''}`} />
  );
  return (
    <div className="curio-backsplash restaurant-reference-backdrop" aria-hidden="true">
      <img className="restaurant-reference-image" src={RESTAURANT_BACKDROP_SRC} alt="" />
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
        {showReturnSign && (
          <div className="kitchen-return-sign" aria-hidden="true">
            <strong lang="ja">すぐ戻ります</strong>
            <span>be right back</span>
          </div>
        )}
      </div>
      <div className="curio-wall-lamp curio-wall-lamp-left" />
      <div className="curio-wall-lamp curio-wall-lamp-right" />
    </div>
  );
}

function AnimatedChefSprite({ persona }: { persona: Persona }) {
  const frames = persona.foodAnimationFrameSrcs ?? [];
  const spriteSheetSrc = persona.foodAnimationSpriteSheetSrc;
  const spriteSheetColumns = persona.foodAnimationSpriteSheetColumns ?? 1;
  const spriteSheetRows = persona.foodAnimationSpriteSheetRows ?? 1;
  const spriteSheetFrameCount = Math.min(
    persona.foodAnimationSpriteSheetFrameCount ?? spriteSheetColumns * spriteSheetRows,
    spriteSheetColumns * spriteSheetRows,
  );
  const frameCount = spriteSheetSrc ? spriteSheetFrameCount : frames.length;
  const [frameIndex, setFrameIndex] = useState(0);
  const aspectRatio = persona.foodAnimationAspectRatio ?? '362 / 724';
  const frameDurationMs = persona.foodAnimationFrameDurationMs ?? 300;

  useEffect(() => {
    if (frameCount < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frameCount);
    }, frameDurationMs);
    return () => window.clearInterval(timer);
  }, [frameCount, frameDurationMs]);

  if (persona.foodAnimationVideoSrc) {
    return (
      <span
        className="counter-chef-sprite counter-chef-video"
        role="img"
        aria-label={`${persona.name} cooking animation`}
        style={{ aspectRatio: '848 / 480' }}
      >
        <video
          className="counter-chef-frame-video"
          src={persona.foodAnimationVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={persona.foodSpriteSrc}
          aria-hidden="true"
        />
      </span>
    );
  }

  if (spriteSheetSrc) {
    const column = frameIndex % spriteSheetColumns;
    const row = Math.floor(frameIndex / spriteSheetColumns);
    const backgroundPosition = `${spriteSheetColumns > 1 ? (column / (spriteSheetColumns - 1)) * 100 : 0}% ${spriteSheetRows > 1 ? (row / (spriteSheetRows - 1)) * 100 : 0}%`;
    return (
      <span
        className="counter-chef-sprite counter-chef-sprite-sheet"
        role="img"
        aria-label={`${persona.name} cooking animation`}
        style={{ aspectRatio: '1' }}
      >
        <span
          className="counter-chef-sprite-sheet-frame"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${spriteSheetSrc})`,
            backgroundSize: `${spriteSheetColumns * 100}% ${spriteSheetRows * 100}%`,
            backgroundPosition,
          }}
        />
      </span>
    );
  }

  return (
    <span
      className="counter-chef-sprite"
      role="img"
      aria-label={`${persona.name} cooking animation`}
      style={{ aspectRatio }}
    >
      <img className="counter-chef-frame-image" src={frames[frameIndex] ?? frames[0]} alt="" />
    </span>
  );
}

function MovementSprite({
  persona,
  action,
  prefersReducedMotion,
}: {
  persona: Persona;
  action: MovementAction;
  prefersReducedMotion: boolean;
}) {
  const spriteSheet = getMovementSpriteSheet(persona.id, action);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
    if (!spriteSheet || prefersReducedMotion || spriteSheet.frameCount < 2) return;
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % spriteSheet.frameCount);
    }, spriteSheet.frameDurationMs);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, spriteSheet]);

  if (!spriteSheet) return <PersonaPortrait persona={persona} />;

  const column = frameIndex % spriteSheet.columns;
  const row = Math.floor(frameIndex / spriteSheet.columns);
  const backgroundPosition = `${spriteSheet.columns > 1 ? (column / (spriteSheet.columns - 1)) * 100 : 0}% ${spriteSheet.rows > 1 ? (row / (spriteSheet.rows - 1)) * 100 : 0}%`;

  return (
    <span
      className="race-movement-sprite"
      role="img"
      aria-label={`${persona.name} ${action} movement`}
      data-movement-action={action}
      data-movement-frame={frameIndex}
      data-movement-grid={`${spriteSheet.columns}x${spriteSheet.rows}`}
    >
      <span
        className="race-movement-frame"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${spriteSheet.src})`,
          backgroundSize: `${spriteSheet.columns * 100}% ${spriteSheet.rows * 100}%`,
          backgroundPosition,
        }}
      />
    </span>
  );
}

function RestaurantCurioDisplays({ collectibles }: { collectibles: Collectible[] }) {
  const byZone = (zone: CurioDisplayZone) => collectibles.filter((item) => getCurioDisplayZone(item) === zone).slice(0, 2);
  const latestCurioId = collectibles[0]?.id;
  const displayClass = (baseClass: string, item: Collectible) => `${baseClass}${item.id === latestCurioId ? ' displayed-curio-latest' : ''}`;
  const shelfItems = (['house-keeps', 'tea-tools', 'spare-plates', 'little-finds', 'hanging-tools'] as CurioDisplayZone[])
    .flatMap((zone) => byZone(zone));
  return (
    <div className="restaurant-curio-displays" aria-label="Curios displayed on the restaurant shelf">
      <div className="restaurant-curio-shelf-grid">
        {shelfItems.map((item) => (
          <CurioHotspot item={item} className={displayClass('displayed-curio', item)} key={item.id} />
        ))}
      </div>
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

function ContestOverlay({ contestants, winner, step, contestName, memorableEvent, race, finishLineVisible, finishCrossed, contestStartedAt, announcerResetKey, onAnnouncerBeat, onSkip, onClose }: { contestants: Persona[]; winner: Persona | null; step: ContestStep; contestName: string; memorableEvent: string; race: RaceSimulation; finishLineVisible: boolean; finishCrossed: boolean; contestStartedAt: number | null; announcerResetKey: number; onAnnouncerBeat: (label: string) => void; onSkip: () => void; onClose: () => void }) {
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [raceClockMs, setRaceClockMs] = useState(() => contestStartedAt ? Math.max(0, Date.now() - contestStartedAt) : 0);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(VOICE_ANNOUNCER_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const [spokenBeatLabel, setSpokenBeatLabel] = useState('Waiting for the starting lantern');
  const announcerAudio = useRef<HTMLAudioElement | null>(null);
  const pendingAudio = useRef<{
    audio: HTMLAudioElement;
    beat: AnnouncerBeat;
    clipIndex: number;
    resume: () => Promise<void>;
    cancel: () => void;
  } | null>(null);
  const announcerAudioReadyAt = useRef(0);
  const spokenBeatIds = useRef(new Set<string>());
  const announcerSequence = useMemo(() => buildAnnouncerSequence(contestants, race, prefersReducedMotion), [contestants, race, prefersReducedMotion]);
  const announcerBeatCallback = useRef(onAnnouncerBeat);
  announcerBeatCallback.current = onAnnouncerBeat;
  const currentObstacleIndex = step === 'intro' ? -1 : Math.min(race.obstacles.length - 1, raceStepProgress[step] - 1);
  const currentObstacle = currentObstacleIndex >= 0 ? race.obstacles[currentObstacleIndex] : null;
  const currentObstacleCopy = currentObstacle
    ? `${currentObstacle.label}: ${currentObstacle.description}`
    : 'The route is being set. Four trouble spots are waiting beyond the starting lantern.';
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);
  useEffect(() => {
    if (!contestStartedAt || prefersReducedMotion) {
      if (contestStartedAt) setRaceClockMs(Math.max(0, Date.now() - contestStartedAt));
      return;
    }
    let frame = 0;
    const tick = () => {
      setRaceClockMs(Math.max(0, Date.now() - contestStartedAt));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [contestStartedAt, prefersReducedMotion]);
  useEffect(() => {
    if (finishLineVisible) setSpokenBeatLabel('Finish in sight');
  }, [finishLineVisible]);
  const getLaneProgress = (lane: RaceLaneSimulation | undefined) => lane
    ? getTimelineLaneProgressAtTime(step, lane, race.obstacles, raceClockMs - contestStepOffsets[step], prefersReducedMotion)
    : 0;
  const worldTravelPercent = getRaceWorldTravelPercentAtTime(
    step,
    raceClockMs - contestStepOffsets[step],
    prefersReducedMotion,
  );
  const getReachedObstacleIndex = (lane: RaceLaneSimulation | undefined) => {
    if (!lane || step === 'intro') return -1;
    const progress = getLaneProgress(lane);
    return race.obstacles.reduce((reachedIndex, obstacle, obstacleIndex) => (
      progress >= obstacle.position ? obstacleIndex : reachedIndex
    ), -1);
  };
  const getCurrentLaneObstacleIndex = (lane: RaceLaneSimulation | undefined) => {
    const reachedIndex = getReachedObstacleIndex(lane);
    const stageObstacleIndex = Math.min(race.obstacles.length - 1, Math.max(0, raceStepProgress[step] - 1));
    if (step === 'intro' || step === 'winner' || reachedIndex < stageObstacleIndex) return -1;
    return reachedIndex;
  };
  const displayedContestants = finishCrossed || step === 'winner' ? [] : contestants;
  const toggleVoice = () => {
    if (voiceEnabled && audioNeedsGesture && pendingAudio.current) {
      const pending = pendingAudio.current;
      const startedAt = contestStartedAt ?? Date.now();
      const deadlineAt = startedAt + contestStepOffsets[pending.beat.step] + pending.beat.deadlineOffset;
      const durationMs = Number.isFinite(pending.audio.duration)
        ? pending.audio.duration * 1000
        : pending.beat.clips[pending.clipIndex]?.durationMs ?? 2000;
      if (Date.now() + durationMs > deadlineAt) {
        pending.audio.pause();
        pending.audio.currentTime = 0;
        pendingAudio.current = null;
        pending.cancel();
        setAudioNeedsGesture(false);
        return;
      }
      void pending.resume()
        .then(() => {
          spokenBeatIds.current.add(pending.beat.id);
          setAudioNeedsGesture(false);
        })
        .catch(() => setAudioNeedsGesture(true));
      return;
    }
    const nextValue = !voiceEnabled;
    setVoiceEnabled(nextValue);
    try {
      window.localStorage.setItem(VOICE_ANNOUNCER_KEY, nextValue ? 'on' : 'off');
    } catch {
      // Audio remains available even when local storage is unavailable.
    }
    if (!nextValue && announcerAudio.current) {
      announcerAudio.current.pause();
      announcerAudio.current.currentTime = 0;
      announcerAudioReadyAt.current = Math.max(announcerAudioReadyAt.current, Date.now() + MIN_ANNOUNCER_GAP_MS);
      pendingAudio.current = null;
      announcerAudio.current = null;
    }
  };

  useEffect(() => {
    setShowWinnerReveal(false);
    if (step !== 'winner' || !winner) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShowWinnerReveal(true);
      return;
    }
    const timer = window.setTimeout(() => setShowWinnerReveal(true), 2600);
    return () => window.clearTimeout(timer);
  }, [step, winner]);

  useEffect(() => {
    // A reset is used by Skip scene to start the winner call from the
    // interruption point instead of waiting for the original race clock.
    const startedAt = announcerResetKey > 0 ? Date.now() : (contestStartedAt ?? Date.now());
    const beats = announcerSequence
      .filter((beat) => announcerResetKey === 0 || beat.step === 'winner')
      .map((beat) => ({
        beat,
        offset: contestStepOffsets[beat.step] + beat.offset,
      }))
      .sort((a, b) => a.offset - b.offset);
    const timers: number[] = [];
    const pendingBeatIds = new Set(beats.map(({ beat }) => beat.id));
    let cancelled = false;
    let activeBeat: { beat: AnnouncerBeat; clipIndex: number } | null = null;
    const metadataAudio = new Map<string, HTMLAudioElement>();
    const metadataDurations = new Map<string, number>();
    const failedSources = new Set<string>();

    const stopAudio = () => {
      if (announcerAudio.current) {
        announcerAudio.current.pause();
        announcerAudio.current.currentTime = 0;
        announcerAudioReadyAt.current = Math.max(announcerAudioReadyAt.current, Date.now() + MIN_ANNOUNCER_GAP_MS);
      }
      announcerAudio.current = null;
      pendingAudio.current = null;
    };

    const uniqueClips = Array.from(new Map(
      beats.flatMap(({ beat }) => beat.clips).map((clip) => [clip.src, clip]),
    ).values());
    uniqueClips.forEach((clip) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          metadataDurations.set(clip.src, audio.duration * 1000);
        }
      }, { once: true });
      audio.addEventListener('error', () => failedSources.add(clip.src), { once: true });
      audio.src = clip.src;
      audio.load();
      metadataAudio.set(clip.src, audio);
    });

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, Math.max(0, delay));
      timers.push(timer);
    };

    function deadlineFor(beat: AnnouncerBeat) {
      return startedAt + contestStepOffsets[beat.step] + beat.deadlineOffset;
    }

    function finishBeat(beat: AnnouncerBeat) {
      if (cancelled || activeBeat?.beat !== beat) return;
      pendingBeatIds.delete(beat.id);
      activeBeat = null;
    }

    function skipClip(beat: AnnouncerBeat, clipIndex: number) {
      if (cancelled || activeBeat?.beat !== beat || activeBeat.clipIndex !== clipIndex) return;
      if (beat.clips[clipIndex + 1]) {
        activeBeat = { beat, clipIndex: clipIndex + 1 };
        playClip(beat, clipIndex + 1);
      } else {
        finishBeat(beat);
      }
    }

    function clipDurationMs(clip: AnnouncerClip) {
      return metadataDurations.get(clip.src) ?? clip.durationMs;
    }

    function fitsBeforeDeadline(beat: AnnouncerBeat, clip: AnnouncerClip, now: number) {
      const startAt = Math.max(now, announcerAudioReadyAt.current);
      return startAt + clipDurationMs(clip) <= deadlineFor(beat);
    }

    function playClip(beat: AnnouncerBeat, clipIndex: number) {
      if (cancelled || !voiceEnabled || activeBeat?.beat !== beat) return;
      const clip = beat.clips[clipIndex];
      if (!clip) {
        finishBeat(beat);
        return;
      }
      if (failedSources.has(clip.src) || !fitsBeforeDeadline(beat, clip, Date.now())) {
        skipClip(beat, clipIndex);
        return;
      }
      const pauseBeforeClip = Math.max(0, announcerAudioReadyAt.current - Date.now());
      if (pauseBeforeClip > 0) {
        schedule(() => playClip(beat, clipIndex), pauseBeforeClip);
        return;
      }
      const previousAudio = announcerAudio.current;
      if (previousAudio) {
        previousAudio.pause();
        previousAudio.currentTime = 0;
      }
      const audio = new Audio(clip.src);
      audio.preload = 'auto';
      audio.volume = 0.94;
      announcerAudio.current = audio;
      setSpokenBeatLabel(clip.label);
      announcerBeatCallback.current(clip.label);
      const continueBeat = () => {
        if (cancelled || announcerAudio.current !== audio) return;
        pendingAudio.current = null;
        announcerAudio.current = null;
        const gapAfterClip = beat.gapAfterMs ?? MIN_ANNOUNCER_GAP_MS;
        announcerAudioReadyAt.current = Date.now() + gapAfterClip;
        schedule(() => skipClip(beat, clipIndex), gapAfterClip);
      };
      audio.addEventListener('ended', continueBeat, { once: true });
      audio.addEventListener('error', continueBeat, { once: true });
      pendingAudio.current = {
        audio,
        beat,
        clipIndex,
        resume: () => audio.play(),
        cancel: () => skipClip(beat, clipIndex),
      };
      void audio.play()
        .then(() => {
          if (!cancelled) {
            setAudioNeedsGesture(false);
            spokenBeatIds.current.add(beat.id);
          }
        })
        .catch(() => {
          if (!cancelled && !audio.error && audio.readyState > 0) setAudioNeedsGesture(true);
        });
    }

    const startBeat = (beat: AnnouncerBeat) => {
      if (cancelled || !voiceEnabled || spokenBeatIds.current.has(beat.id) || !beat.clips.length) {
        pendingBeatIds.delete(beat.id);
        return;
      }
      // Beats never wait in a queue: a busy announcer or a missed deadline
      // means this optional line is skipped so the visual race stays primary.
      if (activeBeat || pendingAudio.current || Date.now() > deadlineFor(beat)) {
        pendingBeatIds.delete(beat.id);
        return;
      }
      activeBeat = { beat, clipIndex: 0 };
      playClip(beat, 0);
    };

    if (voiceEnabled) {
      beats.forEach(({ beat, offset }) => {
        schedule(() => startBeat(beat), Math.max(0, startedAt + offset - Date.now()));
      });
    } else {
      pendingBeatIds.clear();
    }
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      stopAudio();
      metadataAudio.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [announcerResetKey, announcerSequence, contestStartedAt, voiceEnabled]);

  useEffect(() => () => {
    if (announcerAudio.current) {
      announcerAudio.current.pause();
      announcerAudio.current.currentTime = 0;
      announcerAudioReadyAt.current = Math.max(announcerAudioReadyAt.current, Date.now() + MIN_ANNOUNCER_GAP_MS);
    }
    announcerAudio.current = null;
    pendingAudio.current = null;
  }, []);

  return (
    <div className="contest-backdrop fixed inset-0 z-30 flex items-stretch justify-center" role="dialog" aria-modal="true" aria-labelledby="contest-title">
      <div className="contest-stage w-full p-3 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 id="contest-title" className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{contestName}</h2>
          <button type="button" className="flex items-center gap-2 border border-[#806a85] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:bg-[#f5c968] hover:text-[#30223c]" onClick={onSkip} data-testid="button-skip-contest"><SkipForward className="h-4 w-4" aria-hidden="true" />Skip scene</button>
        </div>
        <div className={`contest-race contest-race-${step}`} data-finish-visible={finishLineVisible || undefined} data-finish-crossed={finishCrossed || undefined} aria-label="Animated contest race">
          <div className="race-track-label font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#bca99b]"><span>start</span><span>finish</span></div>
          <div className="race-course-viewport">
            <div
              className="race-world-track"
              style={{ transform: `translateX(-${worldTravelPercent}%)` }}
              data-world-travel-percent={worldTravelPercent.toFixed(3)}
            >
              <div className="race-scenery-track" aria-hidden="true">
                {['lantern alley', 'steam crossing', 'market bend', 'moon gate', 'finish stall'].map((section, index) => (
                  <div className={`race-scenery-panel race-scenery-panel-${index}`} key={section}>
                    <span className="race-scenery-skyline" />
                    <span className="race-scenery-lantern" />
                    <span className="race-scenery-detail">{section}</span>
                  </div>
                ))}
              </div>
              <div className="race-course-road">
                <div className="race-finish-line" aria-hidden="true" />
                {contestants.map((persona) => {
                  const lane = race.lanes.find((candidate) => candidate.personaId === persona.id);
                  const reachedObstacleIndex = getReachedObstacleIndex(lane);
                  const laneCurrentObstacleIndex = getCurrentLaneObstacleIndex(lane);
                  return (
                    <div className="race-lane" key={persona.id}>
                      {race.obstacles.map((obstacle, obstacleIndex) => {
                        const encounter = lane?.encounters[obstacle.id];
                        const obstacleState = obstacleIndex <= reachedObstacleIndex ? `race-obstacle-${encounter?.result ?? 'clear'}` : 'race-obstacle-upcoming';
                        return (
                          <span
                            className={`race-obstacle race-obstacle-${obstacle.kind} ${obstacleState} ${obstacleIndex === laneCurrentObstacleIndex ? 'is-current' : ''}`}
                            style={{ left: `${obstacle.position}%` }}
                            key={`${persona.id}-${obstacle.id}`}
                            title={obstacle.label}
                            aria-hidden="true"
                          >
                            <b>{obstacle.icon}</b>
                            <small>{obstacle.shortLabel}</small>
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="race-runner-overlay">
              {contestants.map((persona, index) => {
                const lane = race.lanes.find((candidate) => candidate.personaId === persona.id) ?? race.lanes[index];
                const laneProgress = getLaneProgress(lane);
                const laneCurrentObstacleIndex = getCurrentLaneObstacleIndex(lane);
                const laneCurrentObstacle = laneCurrentObstacleIndex >= 0 ? race.obstacles[laneCurrentObstacleIndex] : null;
                const encounter = laneCurrentObstacle ? lane?.encounters[laneCurrentObstacle.id] : undefined;
                const runnerReaction = laneCurrentObstacle && encounter ? getRaceRunnerReaction(laneCurrentObstacle.kind, encounter.result) : 'ready';
                const isWinner = (winner?.id ?? race.winnerId) === persona.id;
                 const finishCrossingActive = isWinner && step === 'finale' && finishLineVisible && !finishCrossed;
                 const finishCrossingDuration = Math.max(
                   1,
                   getRaceFinishCrossingOffset(prefersReducedMotion) - getRaceFinishVisibleOffset(prefersReducedMotion),
                 );
                 const runnerScreenAnchor = isWinner && (step === 'winner' || finishCrossed)
                   ? 'var(--race-finish-anchor)'
                   : getRaceWorldScreenAnchor(laneProgress, worldTravelPercent);
                return (
                  <div className="race-runner-lane" key={persona.id}>
                    <div className="race-lane-number font-mono-ui text-[10px] text-[#bca99b]">{String(index + 1).padStart(2, '0')}</div>
                    <div className="race-lane-name font-mono-ui text-[10px] uppercase tracking-wider text-[#d8c6af]">{persona.name}</div>
                    <div
                      className={`race-runner race-runner-reaction-${runnerReaction} ${isWinner ? 'is-winner' : ''} ${finishCrossingActive ? 'is-finish-crossing' : ''}`}
                      style={{
                        '--race-intro-anchor': getRaceWorldScreenAnchor(lane?.positions.intro ?? 5, 0),
                        '--race-warmup-anchor': getRaceWorldScreenAnchor(lane?.positions.warmup ?? 28, RACE_WARMUP_WORLD_END_PERCENT),
                        '--race-matchup-anchor': getRaceWorldScreenAnchor(lane?.positions.matchup ?? 52, RACE_MATCHUP_WORLD_END_PERCENT),
                        '--race-finale-anchor': getRaceWorldScreenAnchor(lane?.positions.finale ?? 78, RACE_FINALE_WORLD_END_PERCENT),
                        '--race-winner-anchor': 'var(--race-finish-anchor)',
                        '--race-runner-anchor': runnerScreenAnchor,
                        '--race-finish-crossing-duration': `${finishCrossingDuration}ms`,
                        '--race-runner-tempo': `${Math.max(0.72, 1.28 - persona.traits.speed * 0.0032 + persona.traits.balance * 0.001).toFixed(2)}s`,
                      } as CSSProperties}
                    >
                      <span className="race-runner-sprite">
                        {step === 'winner' || finishCrossed ? (
                          <PersonaPortrait persona={persona} />
                        ) : (
                          <MovementSprite
                            persona={persona}
                            action={runnerReaction === 'jump' ? 'jump' : step === 'intro' ? 'idle' : step === 'warmup' ? 'walk' : 'run'}
                            prefersReducedMotion={prefersReducedMotion}
                          />
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="race-event-report" role="status" aria-live="polite">
            <div className="race-event-heading">
              <span className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#f5c968]">{step === 'winner' || finishCrossed ? 'finish report' : 'course report'}</span>
              <strong>{finishLineVisible ? 'Finish line' : currentObstacle?.label ?? 'Starting lantern'}</strong>
              <button
                type="button"
                className="race-voice-toggle"
                onClick={toggleVoice}
                aria-pressed={voiceEnabled}
                aria-label={audioNeedsGesture ? 'Play the current race announcement' : `${voiceEnabled ? 'Mute' : 'Enable'} race announcements`}
                title={audioNeedsGesture ? 'Play the current race announcement' : `${voiceEnabled ? 'Mute' : 'Enable'} race announcements`}
              >
                {voiceEnabled && !audioNeedsGesture ? <Volume2 className="h-3.5 w-3.5" aria-hidden="true" /> : <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{audioNeedsGesture ? 'play announcement' : (voiceEnabled ? 'announcements on' : 'announcements off')}</span>
              </button>
            </div>
            <p>{spokenBeatLabel} · {finishLineVisible ? 'The finish line is in sight. The last crossing is being settled.' : step === 'winner' && winner ? `${winner.name} takes the finish after the last hazard.` : currentObstacleCopy}</p>
            <div className="race-encounter-row" aria-label="Contestant obstacle results">
              {contestants.map((persona) => {
                const lane = race.lanes.find((candidate) => candidate.personaId === persona.id);
                const laneCurrentObstacleIndex = getCurrentLaneObstacleIndex(lane);
                const laneCurrentObstacle = laneCurrentObstacleIndex >= 0 ? race.obstacles[laneCurrentObstacleIndex] : null;
                const encounter = laneCurrentObstacle ? lane?.encounters[laneCurrentObstacle.id] : null;
                return (
                  <span className={`race-encounter race-encounter-${encounter?.result ?? 'clear'}`} key={persona.id}>
                    <b>{persona.name.split(' ')[0]}</b>
                    {laneCurrentObstacle && encounter ? `${laneCurrentObstacle.shortLabel}: ${encounter.headline}` : 'approaching'}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="race-obstacle-list" aria-label="Course hazards">
            {race.obstacles.map((obstacle, index) => (
              <span className={step !== 'winner' && index === currentObstacleIndex ? 'is-current' : index < currentObstacleIndex || step === 'winner' ? 'is-cleared' : ''} key={obstacle.id}>
                <i aria-hidden="true">{obstacle.icon}</i>{obstacle.shortLabel}
              </span>
            ))}
          </div>
        </div>
        {winner && showWinnerReveal && (
          <div className="race-winner-reveal" role="status" aria-live="polite" data-testid="winner-reveal-card">
            <div className="race-winner-reveal-card">
              <div className="race-winner-reveal-kicker font-mono-ui">winner's card · revealed after the finish</div>
              <PersonaPortrait persona={winner} large />
              <div className="race-winner-reveal-copy">
                <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#f5c968]">lane winner</span>
                <h3 className="font-display text-3xl font-bold">{winner.name}</h3>
                <p>{memorableEvent}</p>
                <span className="race-winner-reveal-note">A story for the ledger, and a curio for the shelf.</span>
              </div>
            </div>
          </div>
        )}
        <div className="my-9 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {displayedContestants.map((persona, index) => (
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
  const [finishLineVisible, setFinishLineVisible] = useState(false);
  const [finishCrossed, setFinishCrossed] = useState(false);
  const [announcerResetKey, setAnnouncerResetKey] = useState(0);
  const [foodSplash, setFoodSplash] = useState<{ item: FoodItem; key: number } | null>(null);
  const [contestants, setContestants] = useState<Persona[]>([]);
  const [winner, setWinner] = useState<Persona | null>(null);
  const [liveStatus, setLiveStatus] = useState(acknowledgement);
  const holdTimer = useRef<number | null>(null);
  const contestTimer = useRef<number | null>(null);
  const finishTransitionTimer = useRef<number | null>(null);
  const contestIntroStartedAt = useRef<number | null>(null);
  const foodSplashTimer = useRef<number | null>(null);
  const foodSplashSequence = useRef(0);
  const contestQueued = useRef(false);
  const contestOutcome = useRef<ContestOutcome | null>(null);
  const completionGuard = useRef(false);
  const finishCrossedRef = useRef(false);
  const finishContestRef = useRef<() => void>(() => undefined);
  const selectedCount = useMemo(() => ledger.length + collectibles.length, [ledger.length, collectibles.length]);
  const lastWinner = useMemo(() => {
    const latestEntry = ledger[0];
    if (!latestEntry) return null;
    return spriteSheetContestants.find((persona) => persona.id === latestEntry.winnerId)
      ?? spriteSheetContestants.find((persona) => persona.name === latestEntry.winner)
      ?? null;
  }, [ledger]);
  const activeChef = spriteSheetContestants.find((persona) => persona.id === winner?.id)
    ?? lastWinner
    ?? null;

  useEffect(() => {
    setCollectibles((current) => {
      const showcaseById = new Map(showcaseCollectibles.map((item) => [item.id, item]));
      const refreshed = current.map((item) => {
        const template = showcaseById.get(item.id);
        return template ? { ...item, kind: template.kind, title: template.title, description: template.description, earnedBy: template.earnedBy } : item;
      });
      const needsRefresh = refreshed.some((item, index) => item !== current[index]);
      return needsRefresh ? refreshed : current;
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
    if (!winningPersona || !spriteSheetContestants.some((persona) => persona.id === winningPersona.id) || completionGuard.current) return;
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
    setFinishLineVisible(false);
    setFinishCrossed(false);
    setWinner(null);
    setContestants([]);
    contestIntroStartedAt.current = null;
    contestOutcome.current = null;
    contestQueued.current = false;
    finishCrossedRef.current = false;
  };
  finishContestRef.current = finishContest;

  const launchContest = () => {
    const rng = createRng(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
    const selected = shuffleWithRng(spriteSheetContestants, rng).slice(0, rng() > 0.62 ? 4 : 3);
    const outcome = resolveContest(selected, rng);
    contestOutcome.current = outcome;
    completionGuard.current = false;
    contestIntroStartedAt.current = Date.now();
    setContestants(selected);
    setWinner(null);
    setContestStep('intro');
    setFinishLineVisible(false);
    setFinishCrossed(false);
    finishCrossedRef.current = false;
    setAnnouncerResetKey(0);
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
    setFinishLineVisible(true);
    finishCrossedRef.current = true;
    setFinishCrossed(true);
    setWinner(winningPersona);
    setContestStep('winner');
    setAnnouncerResetKey((current) => current + 1);
    setLiveStatus(`${winningPersona.name} crosses the finish line. The stall is revealing the result.`);
  };
  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (contestTimer.current) window.clearTimeout(contestTimer.current);
    if (finishTransitionTimer.current) window.clearTimeout(finishTransitionTimer.current);
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
    const startedAt = contestIntroStartedAt.current ?? Date.now();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextStepAt = nextStep === 'winner'
      ? getRaceFinishVisibleAt(startedAt, prefersReducedMotion)
      : startedAt + contestStepOffsets[nextStep];
    contestTimer.current = window.setTimeout(() => {
      if (nextStep === 'winner') {
        if (finishLineVisible || finishCrossedRef.current) return;
        setFinishLineVisible(true);
        setLiveStatus('The finish line is in sight. The last crossing is being settled.');
          const finishCrossingAt = startedAt
            + contestStepOffsets.finale
            + getRaceFinishCrossingOffset(prefersReducedMotion);
          finishTransitionTimer.current = window.setTimeout(() => {
            if (!contestOpen || completionGuard.current || finishCrossedRef.current) return;
            finishCrossedRef.current = true;
            setFinishCrossed(true);
            finishTransitionTimer.current = window.setTimeout(() => {
              if (!contestOpen || completionGuard.current) return;
              const outcome = contestOutcome.current ?? resolveContest(contestants, createRng(Date.now()));
              contestOutcome.current = outcome;
              setWinner(outcome.winner);
              setContestStep('winner');
              setLiveStatus(`${outcome.memorableEvent} ${outcome.winner.name} wins.`);
            }, FINISH_CROSSING_SETTLE_MS);
          }, Math.max(0, finishCrossingAt - Date.now()));
        return;
      }
      if (finishCrossedRef.current) return;
      const stageMessages: Record<Exclude<ContestStep, 'winner'>, string> = {
        intro: 'The contestants have arrived. The warm-up begins beneath the lanterns.',
        warmup: 'The world rolls. The first hazard is already coming into view.',
        matchup: 'The market slips past. The next hazard is waiting around the bend.',
        finale: 'The last hazard is ahead. The final lane is still unfolding.',
      };
      setContestStep(nextStep);
      setLiveStatus(stageMessages[nextStep]);
    }, Math.max(0, nextStepAt - Date.now()));
    return () => {
      if (contestTimer.current) window.clearTimeout(contestTimer.current);
      if (finishTransitionTimer.current) window.clearTimeout(finishTransitionTimer.current);
    };
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
          <CurioBacksplash collectibles={collectibles} showReturnSign={!ledger.length && !winner && !contestOpen} />
          {activeChef && (
            <div className="restaurant-chef-layer" aria-hidden="true">
              <div className={`counter-chef counter-chef-${activeChef.id}`}>
                {activeChef.foodAnimationVideoSrc || activeChef.foodAnimationFrameSrcs || activeChef.foodAnimationSpriteSheetSrc ? (
                  <AnimatedChefSprite persona={activeChef} />
                ) : (
                  <img className="counter-chef-image" src={activeChef.foodSpriteSrc} alt="" />
                )}
              </div>
            </div>
          )}
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
                                    <FoodPlateArt item={item} />
                                    <div className="food-name font-display text-base font-bold leading-4">{item.name}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bar-meter-rail">
                      <span className="font-mono-ui text-[8px] uppercase tracking-[.14em]">mystery bento meter</span>
                      <Meter compact meter={meter} onPointerStart={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); startHold(); }} onPointerEnd={cancelHold} onMeterClick={handleMeterClick} onMeterKeyDown={handleMeterKeyDown} onMeterKeyUp={handleMeterKeyUp} onContextMenu={handleMeterContextMenu} meterPulse={meterPulse} isHolding={isHolding} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {foodSplash && <FoodSelectionSplash key={foodSplash.key} item={foodSplash.item} />}
        </section>

      </main>
      <div className="sr-only" role="status" aria-live="polite" data-testid="live-contest-status">{liveStatus}</div>
      {contestOpen && contestOutcome.current && <ContestOverlay contestants={contestants} winner={winner} step={contestStep} contestName={contestOutcome.current.contestName} memorableEvent={contestOutcome.current.memorableEvent} race={contestOutcome.current.race} finishLineVisible={finishLineVisible} finishCrossed={finishCrossed} contestStartedAt={contestIntroStartedAt.current} announcerResetKey={announcerResetKey} onAnnouncerBeat={(label) => setLiveStatus(`Announcer: ${label}.`)} onSkip={skipContest} onClose={finishContest} />}
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
