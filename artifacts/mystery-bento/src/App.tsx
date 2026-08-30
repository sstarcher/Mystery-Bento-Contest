import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { BookOpen, ChevronRight, Eye, LockKeyhole, RotateCcw, SkipForward, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { contestantDesigns, contestantFoodAnimationAspectRatios, contestantFoodAnimationFrames, contestantFoodSprites, contestantPortraits } from './contestant-design-config';

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
type FoodItem = { id: string; name: string; note: string; glyph: string; color: string };
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
};
type RaceSimulation = {
  obstacles: RaceObstacle[];
  lanes: RaceLaneSimulation[];
  winnerId: string;
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
const SENCHA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}video/sencha-making-tea-sprite-sheet.png`;
const MIN_ANNOUNCER_GAP_MS = 520;
const MAX_RACE_STAGE_GAP = 20;

type AnnouncerClip = { id: string; src: string; label: string };
type AnnouncerBeat = { id: string; step: ContestStep; label: string; clips: AnnouncerClip[]; offset: number };

const announcerClip = (family: string, file: string, label: string): AnnouncerClip => ({
  id: `${family}/${file}`,
  src: `${ANNOUNCER_AUDIO_BASE}/${family}/${file}.mp3`,
  label,
});

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
  foodAnimationFrameSrcs: design.id === 'pip' || design.id === 'sencha' ? undefined : contestantFoodAnimationFrames[design.id],
  foodAnimationSpriteSheetSrc: design.id === 'pip' ? PIP_ANIMATION_SPRITE_SHEET_SRC : undefined,
  foodAnimationSpriteSheetSrc: design.id === 'pip'
    ? PIP_ANIMATION_SPRITE_SHEET_SRC
    : design.id === 'sencha'
      ? SENCHA_ANIMATION_SPRITE_SHEET_SRC
      : undefined,
  foodAnimationSpriteSheetColumns: design.id === 'pip' || design.id === 'sencha' ? 5 : undefined,
  foodAnimationSpriteSheetRows: design.id === 'pip' || design.id === 'sencha' ? 5 : undefined,
  foodAnimationSpriteSheetFrameCount: design.id === 'pip' || design.id === 'sencha' ? 25 : undefined,
  foodAnimationFrameDurationMs: design.id === 'pip' || design.id === 'sencha' ? Math.round(1000 / 12) : undefined,
  foodAnimationAspectRatio: contestantFoodAnimationAspectRatios[design.id],
}));
const animatedContestants = personas.filter((persona) => (
  (persona.foodAnimationFrameSrcs?.length ?? 0) >= 2
  || persona.foodAnimationSpriteSheetSrc
  || persona.foodAnimationVideoSrc
));

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
  intro: 13600,
  warmup: 7600,
  matchup: 9200,
  finale: 11000,
  winner: 16500,
};

const contestStepOffsets: Record<ContestStep, number> = {
  intro: 0,
  warmup: contestDurations.intro,
  matchup: contestDurations.intro + contestDurations.warmup,
  finale: contestDurations.intro + contestDurations.warmup + contestDurations.matchup,
  winner: contestDurations.intro + contestDurations.warmup + contestDurations.matchup + contestDurations.finale,
};

const contestNextStep: Partial<Record<ContestStep, ContestStep>> = {
  intro: 'warmup',
  warmup: 'matchup',
  matchup: 'finale',
  finale: 'winner',
};

const contestPreviousStep: Partial<Record<ContestStep, ContestStep>> = {
  warmup: 'intro',
  matchup: 'warmup',
  finale: 'matchup',
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

function getFirstRunnerObstacleHitOffset(stage: ContestStep, obstacle: RaceObstacle, race: RaceSimulation) {
  const previousStage = contestPreviousStep[stage];
  const stageStart = previousStage
    ? (lane: RaceLaneSimulation) => lane.positions[previousStage]
    : (lane: RaceLaneSimulation) => lane.positions.intro;
  const stageDuration = contestDurations[stage];
  const hitFractions = race.lanes.map((lane) => {
    const start = stageStart(lane);
    const end = lane.positions[stage];
    if (end <= start) return obstacle.position <= start ? 0 : 1;
    return Math.max(0, Math.min(1, (obstacle.position - start) / (end - start)));
  });
  return Math.round(Math.min(...hitFractions, 1) * stageDuration);
}

function buildAnnouncerSequence(contestants: Persona[], race: RaceSimulation): AnnouncerBeat[] {
  const beats: AnnouncerBeat[] = [
    {
      id: 'intro-contestants',
      step: 'intro',
      label: 'Contestant names',
      offset: 180,
      clips: contestants.map((persona) => announcerClip('character-names', persona.id, persona.name)),
    },
    {
      id: 'intro-follow-up',
      step: 'intro',
      label: 'Race introduction',
      offset: 2_600,
      clips: [
        announcerClip('character-intros', 'contestants-are', 'Contestants are'),
        announcerClip('race-starts', 'race-start-primary', 'Race start'),
      ],
    },
  ];
  let cleanLineAnnounced = false;

  const stageSteps: ContestStep[] = ['warmup', 'matchup', 'finale'];
  stageSteps.forEach((stage, stageIndex) => {
    const transition = stageAnnouncerClips[stage];
    if (transition) {
      beats.push({
        id: `stage-${stage}`,
        step: stage,
        label: transition.label,
        offset: 180,
        clips: [transition],
      });
    }
    const obstacleIndices = stage === 'finale' ? [2, 3] : [stageIndex];
    obstacleIndices.forEach((obstacleIndex, obstacleOrder) => {
      const obstacle = race.obstacles[obstacleIndex];
      if (!obstacle) return;
      const lanesAtBeat = race.lanes
        .map((lane) => ({ lane, position: lane.positions[stage] }))
        .sort((a, b) => b.position - a.position);
      const leadLane = lanesAtBeat[0]?.lane ?? race.lanes[0];
      const encounter = leadLane?.encounters[obstacle.id];
      const reaction = encounter ? getRaceRunnerReaction(obstacle.kind, encounter.result) : 'ready';
      const clips: AnnouncerClip[] = [
        obstacleAnnouncerClips[obstacle.kind]?.[stage === 'finale' && obstacleOrder === 0 ? 1 : 0],
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
        offset: getFirstRunnerObstacleHitOffset(stage, obstacle, race),
        clips,
      });
    });

    const previousStage = contestPreviousStep[stage];
    const currentLeader = [...race.lanes].sort((a, b) => b.positions[stage] - a.positions[stage])[0];
    const previousLeader = previousStage
      ? [...race.lanes].sort((a, b) => b.positions[previousStage] - a.positions[previousStage])[0]
      : undefined;
    const leaderChanged = Boolean(currentLeader && previousLeader && currentLeader.personaId !== previousLeader.personaId);
    const gap = race.lanes.length > 1
      ? (Math.max(...race.lanes.map((lane) => lane.positions[stage])) - Math.min(...race.lanes.map((lane) => lane.positions[stage])))
      : 0;
    const paceClip = stage === 'warmup'
      ? paceAnnouncerClips[0]
      : leaderChanged
        ? paceAnnouncerClips[2 + stageIndex - 1]
        : gap > 28
          ? paceAnnouncerClips[1]
          : paceAnnouncerClips[4];
    if (stage !== 'finale') {
      beats.push({
        id: `pace-${stage}`,
        step: stage,
        label: paceClip.label,
        offset: stage === 'warmup' ? 6_000 : 7_200,
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

function limitRaceLaneDisparity(lanes: RaceLaneSimulation[]) {
  const stages: ContestStep[] = ['intro', 'warmup', 'matchup', 'finale'];
  stages.forEach((stage) => {
    const positions = lanes.map((lane) => lane.positions[stage]);
    const minimum = Math.min(...positions);
    const maximum = Math.max(...positions);
    const spread = maximum - minimum;
    if (spread <= MAX_RACE_STAGE_GAP) return;
    const compression = MAX_RACE_STAGE_GAP / spread;
    lanes.forEach((lane) => {
      lane.positions[stage] = clampRacePosition(maximum - (maximum - lane.positions[stage]) * compression);
    });
  });
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
    const sourcePersona = contestants[index % Math.max(1, contestants.length)] ?? personas[0];
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

  const lanes = contestants.map((persona) => {
    const startingStagger = (persona.traits.speed - 50) * 0.11
      + (persona.traits.chaos - 50) * 0.07
      + rng() * 8 - 4;
    let progress = 6 + persona.traits.speed * 0.06 + startingStagger;
    const encounters: Record<string, RaceEncounter> = {};
    const positions: Record<ContestStep, number> = {
      intro: clampRacePosition(progress),
      warmup: clampRacePosition(progress),
      matchup: clampRacePosition(progress),
      finale: clampRacePosition(progress),
      winner: 92,
    };

    obstacles.forEach((obstacle, obstacleIndex) => {
      const catalog = raceObstacleCatalog[obstacle.kind];
      const control = persona.traits[catalog.primaryTrait] * 0.52
        + persona.traits[catalog.secondaryTrait] * 0.24
        + persona.traits.luck * 0.12
        + (100 - persona.traits.chaos) * 0.12;
      const luckyBreak = persona.traits.chaos >= 70
        && (catalog.primaryTrait === 'luck' || obstacle.kind === 'ribbon-tunnel' || obstacle.kind === 'shortcut-reflection')
        && rng() > 0.35;
      const roll = control + rng() * 22 - 11;
      const result: RaceEncounterResult = luckyBreak
        ? 'surge'
        : roll >= 76
          ? 'clear'
          : roll < 51
            ? 'slow'
            : persona.traits.chaos >= 72 && rng() > 0.48
              ? 'reroute'
              : 'clear';
      const progressDelta = result === 'surge' ? 16 : result === 'slow' ? -16 : result === 'reroute' ? -7 : 3;
      const pace = 18
        + (persona.traits.speed - 50) * 0.05
        + (persona.traits.focus - 50) * 0.015;
      progress = clampRacePosition(progress + pace + progressDelta);
      const encounterCopy: Record<RaceEncounterResult, { headline: string; detail: string }> = {
        clear: { headline: 'clean line', detail: `${persona.name} reads the ${catalog.shortLabel} and keeps pace. Their routine holds.` },
        slow: { headline: 'slowed down', detail: `${persona.name} loses a few steps at the ${catalog.shortLabel}; ${persona.contestBehavior.toLowerCase()}` },
        surge: { headline: 'found a break', detail: `${persona.name} turns the ${catalog.shortLabel} into an unexpected opening. ${persona.quirk}` },
        reroute: { headline: 'rerouted', detail: `${persona.name} takes the strange line around the ${catalog.shortLabel}; ${persona.contestBehavior}` },
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
      encounters[obstacle.id] = {
        result,
        ...encounterCopy[result],
        detail: `${encounterCopy[result].detail} ${reactionCopy[reaction]}`,
      };
      if (obstacleIndex === 0) positions.warmup = progress;
      if (obstacleIndex === 1) positions.matchup = progress;
      if (obstacleIndex >= 2) positions.finale = progress;
    });

    if (obstacles.length < 3) positions.finale = progress;
    const finishScore = progress
      + persona.traits.speed * 0.28
      + persona.traits.balance * 0.1
      + persona.traits.focus * 0.12
      + persona.traits.luck * 0.14
      + (100 - persona.traits.chaos) * 0.06
      + rng() * 8 - 4;
    const finishPosition = clampRacePosition(progress + persona.traits.focus * 0.08 + persona.traits.luck * 0.06 + persona.traits.chaos * 0.03 + rng() * 10 - 5);
    positions.winner = finishPosition;
    return { personaId: persona.id, positions, finishPosition, finishScore, encounters };
  });

  limitRaceLaneDisparity(lanes);
  const winnerLane = [...lanes].sort((a, b) => b.finishScore - a.finishScore)[0] ?? lanes[0];
  return { obstacles, lanes, winnerId: winnerLane?.personaId ?? contestants[0]?.id ?? personas[0].id };
}

function resolveContest(contestants: Persona[], rng: () => number): ContestOutcome {
  const race = buildRaceSimulation(contestants, rng);
  const winner = contestants.find((persona) => persona.id === race.winnerId) ?? contestants[0] ?? animatedContestants[0] ?? personas[0];
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

function CurioBacksplash({ collectibles }: { collectibles: Collectible[] }) {
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
        {!collectibles.length && (
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
        style={{ aspectRatio: '480 / 720' }}
      >
        <video
          className="counter-chef-frame-video"
          src={persona.foodAnimationVideoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
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
        style={{ aspectRatio: `${spriteSheetColumns} / ${spriteSheetRows}` }}
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

function ContestOverlay({ contestants, winner, step, contestName, memorableEvent, race, onAnnouncerBeat, onAudioSequenceComplete, onSkip, onClose }: { contestants: Persona[]; winner: Persona | null; step: ContestStep; contestName: string; memorableEvent: string; race: RaceSimulation; onAnnouncerBeat: (label: string) => void; onAudioSequenceComplete: () => void; onSkip: () => void; onClose: () => void }) {
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
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
  const pendingAudio = useRef<{ audio: HTMLAudioElement; beat: AnnouncerBeat; clipIndex: number } | null>(null);
  const announcerAudioReadyAt = useRef(0);
  const spokenBeatIds = useRef(new Set<string>());
  const announcerSequence = useMemo(() => buildAnnouncerSequence(contestants, race), [contestants, race]);
  const announcerBeatCallback = useRef(onAnnouncerBeat);
  const announcerSequenceCompleteCallback = useRef(onAudioSequenceComplete);
  announcerBeatCallback.current = onAnnouncerBeat;
  announcerSequenceCompleteCallback.current = onAudioSequenceComplete;
  const currentObstacleIndex = step === 'intro' ? -1 : Math.min(race.obstacles.length - 1, raceStepProgress[step] - 1);
  const currentObstacle = currentObstacleIndex >= 0 ? race.obstacles[currentObstacleIndex] : null;
  const currentObstacleCopy = currentObstacle
    ? `${currentObstacle.label}: ${currentObstacle.description}`
    : 'The route is being set. Four trouble spots are waiting beyond the starting lantern.';
  const getReachedObstacleIndex = (lane: RaceLaneSimulation | undefined) => {
    if (!lane || step === 'intro') return -1;
    const progress = lane.positions[step];
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
  const displayedContestants = winner ? [winner] : contestants;
  const toggleVoice = () => {
    if (voiceEnabled && audioNeedsGesture && pendingAudio.current) {
      const pending = pendingAudio.current;
      void pending.audio.play()
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
    const beats = announcerSequence.filter((beat) => beat.step === step);
    const timers: number[] = [];
    const queuedBeats: AnnouncerBeat[] = [];
    const pendingBeatIds = new Set(beats.map((beat) => beat.id));
    let cancelled = false;
    let activeBeat: { beat: AnnouncerBeat; clipIndex: number } | null = null;
    let sequenceCompleteNotified = false;

    const stopAudio = () => {
      if (announcerAudio.current) {
        announcerAudio.current.pause();
        announcerAudio.current.currentTime = 0;
        announcerAudioReadyAt.current = Math.max(announcerAudioReadyAt.current, Date.now() + MIN_ANNOUNCER_GAP_MS);
      }
      announcerAudio.current = null;
      pendingAudio.current = null;
    };

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, Math.max(0, delay));
      timers.push(timer);
    };

    function pumpAnnouncerQueue() {
      if (cancelled || !voiceEnabled || activeBeat || pendingAudio.current) return;
      const nextBeat = queuedBeats.shift();
      if (!nextBeat) return;
      activeBeat = { beat: nextBeat, clipIndex: 0 };
      playClip(nextBeat, 0);
    }

    function notifySequenceComplete() {
      if (cancelled || sequenceCompleteNotified || pendingBeatIds.size > 0 || activeBeat || queuedBeats.length > 0) return;
      sequenceCompleteNotified = true;
      announcerSequenceCompleteCallback.current();
    }

    function finishBeat(beat: AnnouncerBeat) {
      if (cancelled || activeBeat?.beat !== beat) return;
      pendingBeatIds.delete(beat.id);
      activeBeat = null;
      pumpAnnouncerQueue();
      notifySequenceComplete();
    }

    function playClip(beat: AnnouncerBeat, clipIndex: number) {
      if (cancelled || !voiceEnabled || activeBeat?.beat !== beat) return;
      const clip = beat.clips[clipIndex];
      if (!clip) {
        finishBeat(beat);
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
      pendingAudio.current = { audio, beat, clipIndex };
      setSpokenBeatLabel(clip.label);
      announcerBeatCallback.current(clip.label);
      const continueBeat = () => {
        if (cancelled || announcerAudio.current !== audio) return;
        pendingAudio.current = null;
        announcerAudio.current = null;
        announcerAudioReadyAt.current = Date.now() + MIN_ANNOUNCER_GAP_MS;
        schedule(() => {
          if (beat.clips[clipIndex + 1]) {
            activeBeat = { beat, clipIndex: clipIndex + 1 };
            playClip(beat, clipIndex + 1);
          } else {
            finishBeat(beat);
          }
        }, MIN_ANNOUNCER_GAP_MS);
      };
      audio.addEventListener('ended', continueBeat, { once: true });
      audio.addEventListener('error', continueBeat, { once: true });
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

    const queueBeat = (beat: AnnouncerBeat) => {
      if (cancelled) return;
      if (spokenBeatIds.current.has(beat.id) || !beat.clips.length) {
        pendingBeatIds.delete(beat.id);
        notifySequenceComplete();
        return;
      }
      queuedBeats.push(beat);
      pumpAnnouncerQueue();
    };

    if (!voiceEnabled || beats.length === 0) {
      announcerSequenceCompleteCallback.current();
    } else {
      beats.forEach((beat) => {
        schedule(() => queueBeat(beat), beat.offset);
      });
    }
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      stopAudio();
    };
  }, [announcerSequence, step, voiceEnabled]);

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
        <div className={`contest-race contest-race-${step}`} aria-label="Animated contest race">
          <div className="race-track-label font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#bca99b]"><span>start</span><span>finish</span></div>
          <div className="race-course-viewport">
            <div className="race-world-track">
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
                const laneCurrentObstacleIndex = getCurrentLaneObstacleIndex(lane);
                const laneCurrentObstacle = laneCurrentObstacleIndex >= 0 ? race.obstacles[laneCurrentObstacleIndex] : null;
                const encounter = laneCurrentObstacle ? lane?.encounters[laneCurrentObstacle.id] : undefined;
                const runnerReaction = laneCurrentObstacle && encounter ? getRaceRunnerReaction(laneCurrentObstacle.kind, encounter.result) : 'ready';
                const toScreenAnchor = (position: number) => `${Math.min(72, Math.max(14, 10 + position * 0.62))}%`;
                const isWinner = (winner?.id ?? race.winnerId) === persona.id;
                const previousStep = contestPreviousStep[step];
                const startProgress = lane && previousStep ? lane.positions[previousStep] : lane?.positions.intro ?? 0;
                const endProgress = lane?.positions[step] ?? startProgress;
                const reactionProgress = laneCurrentObstacle ? (laneCurrentObstacle.position - startProgress) / Math.max(1, endProgress - startProgress) : 0;
                const reactionDelay = laneCurrentObstacle && step !== 'winner'
                  ? `${Math.max(0, Math.min(0.9, reactionProgress)) * contestDurations[step] / 1000}s`
                  : '0s';
                return (
                  <div className="race-runner-lane" key={persona.id}>
                    <div className="race-lane-number font-mono-ui text-[10px] text-[#bca99b]">{String(index + 1).padStart(2, '0')}</div>
                    <div className="race-lane-name font-mono-ui text-[10px] uppercase tracking-wider text-[#d8c6af]">{persona.name}</div>
                    <div
                      className={`race-runner race-runner-reaction-${runnerReaction} ${winner?.id === persona.id ? 'is-winner' : ''}`}
                      style={{
                        '--race-intro-anchor': toScreenAnchor(lane?.positions.intro ?? 5),
                        '--race-warmup-anchor': toScreenAnchor(lane?.positions.warmup ?? 28),
                        '--race-matchup-anchor': toScreenAnchor(lane?.positions.matchup ?? 52),
                        '--race-finale-anchor': isWinner ? 'var(--race-finish-anchor)' : toScreenAnchor(lane?.positions.finale ?? 78),
                        '--race-winner-anchor': isWinner ? 'var(--race-finish-anchor)' : toScreenAnchor(lane?.positions.finale ?? 78),
                        '--race-runner-tempo': `${Math.max(0.72, 1.28 - persona.traits.speed * 0.0032 + persona.traits.balance * 0.001).toFixed(2)}s`,
                        '--race-reaction-delay': reactionDelay,
                      } as CSSProperties}
                    >
                      <span className="race-runner-sprite">
                        <PersonaPortrait persona={persona} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="race-event-report" role="status" aria-live="polite">
            <div className="race-event-heading">
              <span className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#f5c968]">{step === 'winner' ? 'finish report' : 'course report'}</span>
              <strong>{currentObstacle?.label ?? 'Starting lantern'}</strong>
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
            <p>{spokenBeatLabel} · {step === 'winner' && winner ? `${winner.name} takes the finish after the last hazard.` : currentObstacleCopy}</p>
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
  const [announcerStepAudioReady, setAnnouncerStepAudioReady] = useState(false);
  const [foodSplash, setFoodSplash] = useState<{ item: FoodItem; key: number } | null>(null);
  const [contestants, setContestants] = useState<Persona[]>([]);
  const [winner, setWinner] = useState<Persona | null>(null);
  const [liveStatus, setLiveStatus] = useState(acknowledgement);
  const holdTimer = useRef<number | null>(null);
  const contestTimer = useRef<number | null>(null);
  const contestIntroStartedAt = useRef<number | null>(null);
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
  const activeChef = personas.find((persona) => persona.id === 'pip')
    ?? lastWinner
    ?? animatedContestants[0]
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
    setAnnouncerStepAudioReady(false);
    setWinner(null);
    setContestants([]);
    contestIntroStartedAt.current = null;
    contestOutcome.current = null;
    contestQueued.current = false;
  };
  finishContestRef.current = finishContest;

  const launchContest = () => {
    const rng = createRng(Date.now() ^ Math.floor(Math.random() * 0xffffffff));
    const selected = shuffleWithRng(animatedContestants, rng).slice(0, rng() > 0.62 ? 4 : 3);
    const outcome = resolveContest(selected, rng);
    contestOutcome.current = outcome;
    completionGuard.current = false;
    contestIntroStartedAt.current = Date.now();
    setContestants(selected);
    setWinner(null);
    setContestStep('intro');
    setAnnouncerStepAudioReady(false);
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
    setAnnouncerStepAudioReady(false);
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
    if (!announcerStepAudioReady) return;
    const nextStep = contestNextStep[contestStep];
    if (!nextStep) return;
    const introElapsed = contestIntroStartedAt.current === null ? 0 : Date.now() - contestIntroStartedAt.current;
    const stepDuration = contestStep === 'intro'
      ? Math.max(0, contestDurations.intro - introElapsed)
      : contestDurations[contestStep];
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
        warmup: 'The world rolls. The first hazard is already coming into view.',
        matchup: 'The market slips past. The next hazard is waiting around the bend.',
        finale: 'The finish is near. The stall is preparing the winner’s story.',
      };
      setContestStep(nextStep);
      setAnnouncerStepAudioReady(false);
      setLiveStatus(stageMessages[nextStep]);
    }, stepDuration);
    return () => { if (contestTimer.current) window.clearTimeout(contestTimer.current); };
  }, [announcerStepAudioReady, contestOpen, contestStep, contestants]);
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
          <CurioBacksplash collectibles={collectibles} />
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
                  {activeChef && (
                    <div className={`counter-chef counter-chef-${activeChef.id}`} aria-label={`${activeChef.name}, the active chef, is preparing food at the conveyor bar`}>
                      {activeChef.foodAnimationVideoSrc || activeChef.foodAnimationFrameSrcs || activeChef.foodAnimationSpriteSheetSrc ? (
                        <AnimatedChefSprite persona={activeChef} />
                      ) : (
                        <img className="counter-chef-image" src={activeChef.foodSpriteSrc} alt="" />
                      )}
                    </div>
                  )}
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
      {contestOpen && contestOutcome.current && <ContestOverlay contestants={contestants} winner={winner} step={contestStep} contestName={contestOutcome.current.contestName} memorableEvent={contestOutcome.current.memorableEvent} race={contestOutcome.current.race} onAnnouncerBeat={(label) => setLiveStatus(`Announcer: ${label}.`)} onAudioSequenceComplete={() => setAnnouncerStepAudioReady(true)} onSkip={skipContest} onClose={finishContest} />}
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