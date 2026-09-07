import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { BookOpen, ChevronRight, LockKeyhole, RotateCcw, SkipForward, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import RaceTrackDebugPage from '@/pages/race-track-debug';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { contestantDesigns, contestantFoodAnimationAspectRatios, contestantPortraits } from './contestant-design-config';
import tildaSafetyModule from './assets/derived/curios/tilda-safety-module.png';
import tildaToolbox from './assets/derived/curios/tilda-toolbox.png';
import tildaWrenchSet from './assets/derived/curios/tilda-wrench-set.png';
import senchaLeafBookmark from './assets/derived/curios/sencha-leaf-bookmark.png';
import senchaNightTeapot from './assets/derived/curios/sencha-night-teapot.png';
import senchaTeaLedger from './assets/derived/curios/sencha-tea-ledger.png';
import toroCaptainsCap from './assets/derived/curios/toro-captains-cap.png';
import toroGrillSpatula from './assets/derived/curios/toro-grill-spatula.png';
import toroPocketCompass from './assets/derived/curios/toro-pocket-compass.png';
import noriBrushPen from './assets/derived/curios/nori-brush-pen.png';
import noriPlumNotebook from './assets/derived/curios/nori-plum-notebook.png';
import noriScarfPin from './assets/derived/curios/nori-scarf-pin.png';
import misoBrothJar from './assets/derived/curios/miso-broth-jar.png';
import misoSoupBowl from './assets/derived/curios/miso-soup-bowl.png';
import misoWalnutLadle from './assets/derived/curios/miso-walnut-ladle.png';
import umaFlourSack from './assets/derived/curios/uma-flour-sack.png';
import umaNoodleRibbon from './assets/derived/curios/uma-noodle-ribbon.png';
import umaRollingPin from './assets/derived/curios/uma-rolling-pin.png';
import pankoClueNotebook from './assets/derived/curios/panko-clue-notebook.png';
import pankoDetectiveBeret from './assets/derived/curios/panko-detective-beret.png';
import pankoMagnifyingGlass from './assets/derived/curios/panko-magnifying-glass.png';
import kikuAgedCopperKettle from './assets/derived/curios/kiku-aged-copper-kettle.png';
import kikuJadeBrassGear from './assets/derived/curios/kiku-jade-brass-gear.png';
import kikuSageBlueprint from './assets/derived/curios/kiku-sage-blueprint.png';
import bibiClothWrap from './assets/derived/curios/bibi-cloth-wrap.png';
import bibiFoodTweezers from './assets/derived/curios/bibi-food-tweezers.png';
import bibiStackedBento from './assets/derived/curios/bibi-stacked-bento.png';
import rolloCeramicBowl from './assets/derived/curios/rollo-ceramic-bowl.png';
import rolloRadishMedal from './assets/derived/curios/rollo-radish-medal.png';
import rolloRibbonBell from './assets/derived/curios/rollo-ribbon-bell.png';
import saffyGarnishPlate from './assets/derived/curios/saffy-garnish-plate.png';
import saffyPlatingTweezers from './assets/derived/curios/saffy-plating-tweezers.png';
import saffyPresentationFan from './assets/derived/curios/saffy-presentation-fan.png';
import { getMovementSpriteSheet, type MovementAction } from './movement-sprite-config';
import { MovementSprite } from './movement-sprite';
import { getMatchedEncounterResultAudio } from './announcer-result-audio';
import {
  RACE_BACKGROUND_FINISH_MARKER_ANGLE_DEG,
  RACE_BACKGROUND_FINISH_SCREEN_ANCHOR_PERCENT,
  RACE_BACKGROUND_FINISH_MARKER_ROAD_LENGTH_PX,
  RACE_BACKGROUND_FINISH_MARKER_ROAD_TOP_PX,
  RACE_BACKGROUND_FINISH_MARKER_X_PX,
  RACE_BACKGROUND_SEQUENCE,
  RACE_BACKGROUND_TRACK_WIDTH_PX,
} from './race-backgrounds';
import { CURIO_ART_FIT_SCALE, getCurioArtProfile, type CurioArtProfile } from './curio-art-sizing';
import {
  CURIO_SHELF_GRID,
  curioPlacementsEqual,
  normalizeCurioPlacements,
  reconcileCurioPlacements,
  type CurioShelfPlacementMap,
} from './curio-shelf-placements';
import { getCurioDebugState, selectRestaurantShelfCollectibles } from './curio-debug';
import {
  getRaceObstacleEntryOffset as getTimelineRaceObstacleEntryOffset,
  getRaceFinishVisibleOffset,
   RACE_FINISH_THRESHOLD_POSITION,
   RACE_FINALE_WORLD_END_PERCENT,
  getRaceRunnerFinishAction,
  getRaceAnnouncementRevealOffsets,
  getRaceAnnouncementCompletionDelay,
  getRaceAnnouncerBeatStartOffset,
  getRaceObstacleAnnouncerTiming,
  getRaceRunnerObstacleContactOffset,
  getRaceStartHandoffTiming,
  getRaceStageAnnouncerCue,
  getRaceRunnerScreenAnchors,
   getRaceRunnerFinishScreenAnchorAtRaceTime,
  getRaceWorldScreenAnchor,
  getRaceWorldTravelPercentAtRaceTime,
   RACE_RUNNER_SCREEN_MAX_PERCENT,
   RACE_RUNNER_RENDER_WIDTH_PX,
   RACE_RUNNER_LEADING_EDGE_OFFSET_PERCENT,
  RACE_LAST_CONTESTANT_PAUSE_MS,
  RACE_MATCHUP_WORLD_END_PERCENT,
  RACE_RACE_DURATION_MS,
  RACE_STAGE_OFFSETS,
  RACE_STAGE_DURATIONS,
  RACE_WARMUP_WORLD_END_PERCENT,
  type RaceTimelineCheckpoint,
  type RaceTimelineStage,
} from './race-timeline';
import { ensureRaceEncounterVariety, getRaceLeadChangeKind, resolveRaceEncounterResult } from './race-momentum';
import {
  getRaceObstacleBottomPx,
  getRaceObstacleHorizontalOffsetPx,
  getRaceObstacleLeftCss,
  RACE_OBSTACLE_PLACEMENTS,
} from './race-obstacle-layout';
import { selectContestants } from './contest-roster';
import {
  getContinuousRunnerPosition,
  buildRunnerTrajectory,
  getRunnerBaseSpeedMultiplier,
  getRunnerFinishCrossingTime,
  getRunnerEffectiveSpeed,
  getRunnerMovementState,
  getRunnerSpeedEventDuration,
  getRunnerTrajectoryPositionAtTime,
  resolveRunnerFinishOrder,
  type RunnerTrajectoryPoint,
  type RunnerSpeedEvent,
} from './race-speed-model';

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
  imageSrc?: string;
  artVariant?: 'pip-pocket-watch' | 'pip-rice-bowl' | 'pip-satchel-tag' | 'tilda-toolbox' | 'tilda-wrench-set' | 'tilda-safety-module' | 'sencha-leaf-bookmark' | 'sencha-night-teapot' | 'sencha-tea-ledger' | 'toro-captains-cap' | 'toro-pocket-compass' | 'toro-grill-spatula' | 'nori-plum-notebook' | 'nori-brush-pen' | 'nori-scarf-pin' | 'miso-soup-bowl' | 'miso-walnut-ladle' | 'miso-broth-jar' | 'uma-noodle-ribbon' | 'uma-flour-sack' | 'uma-rolling-pin' | 'panko-magnifying-glass' | 'panko-detective-beret' | 'panko-clue-notebook' | 'kiku-aged-copper-kettle' | 'kiku-jade-brass-gear' | 'kiku-sage-blueprint' | 'bibi-stacked-bento' | 'bibi-food-tweezers' | 'bibi-cloth-wrap' | 'rollo-radish-medal' | 'rollo-ceramic-bowl' | 'rollo-ribbon-bell' | 'saffy-garnish-plate' | 'saffy-plating-tweezers' | 'saffy-presentation-fan';
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
  imageSrc: string;
  position: number;
  sourcePersonaId: string;
};
type RaceEncounter = {
  result: RaceEncounterResult;
  headline: string;
  detail: string;
  reaction: RaceRunnerReaction;
  triggerMs: number | null;
  reactionEndMs: number | null;
};

type RaceReactionWindow = {
  obstacleId: string;
  triggerMs: number;
  endMs: number;
};
type RaceLaneSimulation = {
  personaId: string;
  positions: Record<RacePositionStep, number>;
  finishCrossingMs: number | null;
  encounters: Record<string, RaceEncounter>;
  checkpoints: RaceTimelineCheckpoint[];
  baseSpeedMultiplier: number;
  speedEvents: RunnerSpeedEvent[];
  reactionWindows: RaceReactionWindow[];
  trajectory: RunnerTrajectoryPoint[];
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
  finishCrossingMs: number;
  winnerId: string;
  finishOrder: string[];
  finishCrossings: Record<string, number | null>;
  checkpointLeaders: Record<string, { beforeId: string; afterId: string }>;
  leadChanges: RaceLeadChange[];
};
type ContestOutcome = { winner: Persona; memorableEvent: string; contestName: string; race: RaceSimulation };

type RacePositionStep = 'intro' | 'warmup' | 'matchup' | 'finale' | 'winner';
type ContestStep = 'intro' | 'race' | 'winner';

const queryClient = new QueryClient();
const METER_KEY = 'mystery-bento-meter';
const LEDGER_KEY = 'mystery-bento-ledger';
const CURIO_KEY = 'mystery-bento-curios';
const CURIO_PLACEMENTS_KEY = 'mystery-bento-curio-placements';
const VOICE_ANNOUNCER_KEY = 'mystery-bento-voice-announcer';
const MOTION_SPEEDUP = 1.08;
const speedUpDurationMs = (durationMs: number) => Math.max(1, Math.round(durationMs / MOTION_SPEEDUP));
const ANNOUNCER_AUDIO_BASE = `${import.meta.env.BASE_URL}runtime/audio/announcer`;

const RACE_BACKGROUND_BASE = `${import.meta.env.BASE_URL}runtime/images/race-backgrounds`;
const RACE_OBSTACLE_IMAGE_BASE = `${import.meta.env.BASE_URL}runtime/images/obstacles`;
const PIP_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/pip-making-food-sprite-sheet.png`;

const PIP_POCKET_WATCH_SRC = `${import.meta.env.BASE_URL}runtime/images/keepsakes/pip-pocket-watch.png`;
const PIP_RICE_BOWL_SRC = `${import.meta.env.BASE_URL}runtime/images/keepsakes/pip-rice-bowl.png`;
const PIP_SATCHEL_TAG_SRC = `${import.meta.env.BASE_URL}runtime/images/keepsakes/pip-satchel-tag.png`;
const RESTAURANT_BACKDROP_SRC = `${import.meta.env.BASE_URL}runtime/images/restaurant/background.png`;
const SUSHI_PLATE_WARM_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-warm.png`;
const SUSHI_PLATE_COOL_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-cool.png`;
const SUSHI_PLATE_SHRIMP_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-shrimp.png`;
const SUSHI_PLATE_ROLLS_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-rolls.png`;
const SUSHI_PLATE_SALMON_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-salmon.png`;
const SUSHI_PLATE_NIGIRI_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/sushi-plate-nigiri.png`;
const SAPPORO_BEER_SRC = `${import.meta.env.BASE_URL}runtime/images/plates/beer.png`;
const SENCHA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/sencha-making-tea-sprite-sheet.png`;

const TORO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/captain-toro-cooking-sprite-sheet.png`;
const NORI_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/nori-nib-cooking-sprite-sheet.png`;
const TILDA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/tilda-tofu-cooking-sprite-sheet.png`;
const ROLLO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/rollo-radish-cooking-sprite-sheet.png`;
const KIKU_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/kiku-kettle-cooking-sprite-sheet.png`;
const SAFFY_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/saffy-sashimi-cooking-sprite-sheet.png`;
const UMA_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/uma-udon-cooking-sprite-sheet.png`;
const MISO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/miso-mallow-cooking-sprite-sheet.png`;
const PANKO_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/panko-puff-cooking-sprite-sheet.png`;
const BIBI_ANIMATION_SPRITE_SHEET_SRC = `${import.meta.env.BASE_URL}runtime/video/cooking/bibi-bento-cooking-sprite-sheet.png`;
const MIN_ANNOUNCER_GAP_MS = 520;
const NAME_ANNOUNCER_GAP_MS = 80;
/**
 * The course report and hazard strip are implemented spectator details.
 * Keep their data, narration, and styling available, but leave the lower race
 * UI disabled while the full-screen course is being simplified.
 */
const SHOW_RACE_COURSE_REPORT = false;

const FINISH_CROSSING_SETTLE_MS = 240;
type AnnouncerClip = { id: string; src: string; label: string; durationMs: number };
type AnnouncerBeat = {
  id: string;
  step: ContestStep;
  timelineStage?: RaceTimelineStage;
  label: string;
  clips: AnnouncerClip[];
  offset: number;
  deadlineOffset: number;
  gapAfterMs?: number;
  clipGapsAfterMs?: number[];
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
  'obstacles/bento-stack-narrowed-final-lane': 2220,
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
  'result-fragments/found-a-break': 1000,
  'result-fragments/rerouted': 1000,
  'result-fragments/slowed-down': 1230,
  'reactions/ducks-beneath-it-and-keeps-moving': 2010,
  'reactions/jumps-over-it-and-keeps-moving': 2060,
  'reactions/slides-around-it-and-recovers': 1830,
  'reactions/stumbles-steadies-and-carries-on': 2490,
  'reactions/surges-through-the-opening': 1570,
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
    announcerClip('obstacles', 'garnish-gate-ahead', 'Garnish gate ahead'),
  ],
  'steam-gadget': [
    announcerClip('obstacles', 'steam-gadget-ahead', 'Steam gadget ahead'),
    announcerClip('obstacles', 'steam-gadget-filled-lane-with-fog', 'Steam gadget filled the lane with fog'),
  ],
  'bento-stack': [
    announcerClip('obstacles', 'bento-stack-narrowed-final-lane', 'Bento stack narrowed the final lane'),
    announcerClip('obstacles', 'bento-stack-narrowed-final-lane', 'Bento stack narrowed the final lane'),
  ],
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
  foodAnimationFrameSrcs: undefined,
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
  foodAnimationSpriteSheetColumns: design.id === 'bibi' || design.id === 'kiku' || design.id === 'miso' || design.id === 'nori' || design.id === 'panko' || design.id === 'rollo' || design.id === 'saffy' || design.id === 'tilda' || design.id === 'uma' || design.id === 'toro' ? 8 : design.id === 'pip' || design.id === 'sencha' ? 5 : undefined,
  foodAnimationSpriteSheetRows: design.id === 'kiku' ? 4 : design.id === 'uma' ? 6 : design.id === 'bibi' || design.id === 'miso' || design.id === 'nori' || design.id === 'rollo' || design.id === 'saffy' || design.id === 'tilda' ? 7 : design.id === 'panko' || design.id === 'pip' || design.id === 'sencha' ? 5 : design.id === 'toro' ? 4 : undefined,
  foodAnimationSpriteSheetFrameCount: cookingSpriteSheetFrameCounts[design.id],
  foodAnimationFrameDurationMs: design.id === 'saffy'
    ? Math.round(1000 / 16)
    : design.id === 'bibi' || design.id === 'kiku' || design.id === 'miso' || design.id === 'nori' || design.id === 'panko' || design.id === 'rollo' || design.id === 'tilda' || design.id === 'uma' || design.id === 'pip' || design.id === 'sencha' || design.id === 'toro'
      ? Math.round(1000 / 12)
      : undefined,
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
  { id: 'sapporo-beer', name: 'Sapporo', note: 'a crisp golden pour for the late shift', imageSrc: SAPPORO_BEER_SRC },
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

const RACE_RUNNER_TRAVEL_END_POSITION = RACE_FINISH_THRESHOLD_POSITION + 40;
const RACE_FINISH_ANNOUNCEMENT_DELAY_MS = 120;

function getRacePlaybackFinishCrossingMs(race: RaceSimulation, prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? RACE_RACE_DURATION_MS
    : Math.max(RACE_RACE_DURATION_MS, race.finishCrossingMs);
}
function getRaceFinishCrossingAt(
  startedAt: number,
  race: RaceSimulation,
  prefersReducedMotion: boolean,
) {
  return startedAt + (
    prefersReducedMotion
      ? RACE_RACE_DURATION_MS
      : getRacePlaybackFinishCrossingMs(race, prefersReducedMotion)
  );
}

function getRaceFinishVisibleAt(
  startedAt: number,
  race: RaceSimulation,
  prefersReducedMotion: boolean,
) {
  const crossingAt = getRaceFinishCrossingAt(startedAt, race, prefersReducedMotion);
  // The marker is in the moving panorama, so do not announce it before the
  // background endpoint has actually brought it into the viewport.
  return crossingAt;
}
const raceObstacleCatalog: Record<RaceObstacleKind, {
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  imageSrc: string;
  primaryTrait: RaceTrait;
  secondaryTrait: RaceTrait;
}> = {
  'napkin-gust': { label: 'Napkin gust', shortLabel: 'napkin gust', description: 'a sideways swirl of loose cream napkins briefly blankets the track', icon: '≈', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/napkin-gust.png`, primaryTrait: 'focus', secondaryTrait: 'chaos' },
  'tea-puddle': { label: 'Tea puddle', shortLabel: 'tea puddle', description: 'a shallow amber spill with a slick edge and rippling tea leaf', icon: '◌', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/tea-puddle.png`, primaryTrait: 'balance', secondaryTrait: 'focus' },
  'wobble-stack': { label: 'Wobble stack', shortLabel: 'wobble stack', description: 'leaning mismatched bowls sway above a narrow safe route', icon: '≋', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/wobble-stack.png`, primaryTrait: 'balance', secondaryTrait: 'focus' },
  'shortcut-reflection': { label: 'Moon reflection', shortLabel: 'moon reflection', description: 'an indigo puddle shows a tempting moonlit shortcut that may be real', icon: '✦', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/moon-reflection.png`, primaryTrait: 'luck', secondaryTrait: 'focus' },
  'broken-cart': { label: 'Broken cart', shortLabel: 'broken cart', description: 'a sideways pantry cart with a loose wheel blocks part of the lane', icon: '□', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/broken-cart.png`, primaryTrait: 'focus', secondaryTrait: 'chaos' },
  'ribbon-tunnel': { label: 'Ribbon tunnel', shortLabel: 'ribbon tunnel', description: 'soft festival ribbons loop and flutter between two low poles', icon: '∿', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/ribbon-tunnel.png`, primaryTrait: 'speed', secondaryTrait: 'chaos' },
  'cushion-pile': { label: 'Cushion pile', shortLabel: 'cushion pile', description: 'a puffy heap of mismatched floor cushions blocks the most direct line', icon: '⌂', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/cushion-pile.png`, primaryTrait: 'balance', secondaryTrait: 'luck' },
  'flour-sacks': { label: 'Flour sacks', shortLabel: 'flour sacks', description: 'small sacks tumble together, kicking up a low dust puff', icon: '▦', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/flour-sacks.png`, primaryTrait: 'balance', secondaryTrait: 'speed' },
  'crumb-trail': { label: 'Crumb trail', shortLabel: 'crumb trail', description: 'sesame, rice grains, and golden crumbs curve toward an uncertain side route', icon: '·', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/crumb-trail.png`, primaryTrait: 'luck', secondaryTrait: 'focus' },
  'garnish-gate': { label: 'Garnish gate', shortLabel: 'garnish gate', description: 'herb sprigs and radish curls leave one narrow elegant passage', icon: '╫', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/garnish-gate.png`, primaryTrait: 'focus', secondaryTrait: 'balance' },
  'steam-gadget': { label: 'Steam gadget', shortLabel: 'steam gadget', description: 'a squat copper kettle releases a harmless cloud of warm steam', icon: '☼', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/steam-gadget.png`, primaryTrait: 'focus', secondaryTrait: 'luck' },
  'bento-stack': { label: 'Bento stack', shortLabel: 'bento stack', description: 'empty patterned bento boxes lean into the narrow finish approach', icon: '▤', imageSrc: `${RACE_OBSTACLE_IMAGE_BASE}/bento-stack.png`, primaryTrait: 'balance', secondaryTrait: 'focus' },
};

const DISABLED_RACE_OBSTACLE_KINDS = new Set<RaceObstacleKind>([
  'ribbon-tunnel',
  'garnish-gate',
  'broken-cart',
  'wobble-stack',
]);

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

function hasNegativeObstacleImpact(result: RaceEncounterResult | undefined) {
  return result === 'slow' || result === 'reroute';
}

function buildAnnouncerSequence(contestants: Persona[], race: RaceSimulation, prefersReducedMotion = false): AnnouncerBeat[] {
  const raceStart = announcerClip('race-starts', 'race-start-quiet-kitchen', 'The race is underway');
  const rosterOpening = announcerClip('character-intros', 'contestants-are', 'Tonight’s contestants are');
  const nameClips = contestants.map((persona) => announcerClip('character-names', persona.id, persona.name));
  const handoffTiming = getRaceStartHandoffTiming(
    rosterOpening.durationMs,
    nameClips.map((clip) => clip.durationMs),
    NAME_ANNOUNCER_GAP_MS,
    raceStart.durationMs,
    MIN_ANNOUNCER_GAP_MS,
  );
  const beats: AnnouncerBeat[] = [
    {
      id: 'intro-opening',
      step: 'intro',
      label: 'Tonight’s contestants are',
      offset: 0,
      deadlineOffset: contestDurations.intro,
      // Names are individual clips, so a shorter handoff keeps the roster
      // sounding like one introduction instead of a series of pauses.
      gapAfterMs: NAME_ANNOUNCER_GAP_MS,
      // Keep the last name on screen for one second before the race-start call
      // begins.
      clipGapsAfterMs: [
        NAME_ANNOUNCER_GAP_MS,
        ...nameClips.map((_, index) => index === nameClips.length - 1
          ? RACE_LAST_CONTESTANT_PAUSE_MS
          : NAME_ANNOUNCER_GAP_MS),
      ],
      clips: [
        rosterOpening,
        ...nameClips,
      ],
    },
    {
      id: 'race-start',
      step: 'intro',
      label: raceStart.label,
      offset: handoffTiming.raceStartOffset,
      deadlineOffset: contestDurations.intro,
      clips: [raceStart],
    },
  ];
  const stageSteps: Array<'warmup' | 'matchup' | 'finale'> = ['warmup', 'matchup', 'finale'];
  stageSteps.forEach((stage, stageIndex) => {
    const stageDuration = contestDurations[stage];
    const obstacleIndices = stage === 'finale' ? [2, 3] : [stageIndex];
    const obstacleMilestones = obstacleIndices
      .map((obstacleIndex) => race.obstacles[obstacleIndex])
      .filter((obstacle): obstacle is RaceObstacle => Boolean(obstacle))
      .map((obstacle, obstacleOrder) => {
        const obstacleIndex = obstacleIndices[obstacleOrder];
        const hitOffset = prefersReducedMotion
          ? 0
          : Math.min(
            ...race.lanes.map((lane) => (
              (lane.speedEvents.find((event) => event.obstacleId === obstacle.id)?.triggerMs
                ?? (RACE_STAGE_OFFSETS[stage] + stageDuration))
              - RACE_STAGE_OFFSETS[stage]
            )),
            stageDuration,
          );
        const entryOffset = prefersReducedMotion
          ? obstacleOrder * 4_200
          : getTimelineRaceObstacleEntryOffset(
            stage,
            obstacle,
            false,
            getRaceObstacleHorizontalOffsetPx(obstacleIndex),
          );
        const obstacleTiming = getRaceObstacleAnnouncerTiming(
          entryOffset,
          hitOffset,
          stageDuration,
          prefersReducedMotion,
        );
        return {
          obstacle,
          hitOffset: obstacleTiming.reactionOffset,
          offset: obstacleTiming.reactionOffset,
          entryOffset: obstacleTiming.calloutOffset,
          canCallout: obstacleTiming.canCallout,
        };
      });
    const firstObstacleOffset = obstacleMilestones[0]?.offset ?? stageDuration;
    const transitionCue = getRaceStageAnnouncerCue(stage);
    const transition = transitionCue
      ? announcerClip('stage-transitions', transitionCue.id, transitionCue.label)
      : undefined;
    if (transition) {
      const finishCrossingStageOffset = Math.max(
        0,
        getRacePlaybackFinishCrossingMs(race, prefersReducedMotion) - RACE_STAGE_OFFSETS.finale,
      );
      const transitionOffset = stage === 'finale'
        ? Math.min(
          getRaceFinishVisibleOffset(prefersReducedMotion) + RACE_FINISH_ANNOUNCEMENT_DELAY_MS,
          prefersReducedMotion ? 0 : finishCrossingStageOffset,
        )
        : 220;
      beats.push({
        id: `stage-${stage}`,
        step: 'race',
        label: transition.label,
        offset: transitionOffset,
        deadlineOffset: stage === 'finale'
          ? contestDurations.finale + FINISH_CROSSING_SETTLE_MS + 2200
          : firstObstacleOffset,
        clips: [transition],
      });
    }
    obstacleMilestones.forEach(({ obstacle, entryOffset, hitOffset, canCallout }, obstacleOrder) => {
      const leaderId = race.checkpointLeaders[obstacle.id]?.afterId;
      const leadLane = race.lanes.find((lane) => lane.personaId === leaderId)
        ?? [...race.lanes].sort((a, b) => {
          const aCheckpoint = a.checkpoints.find((checkpoint) => checkpoint.obstacleId === obstacle.id);
          const bCheckpoint = b.checkpoints.find((checkpoint) => checkpoint.obstacleId === obstacle.id);
          return (bCheckpoint?.exitPosition ?? b.positions[stage]) - (aCheckpoint?.exitPosition ?? a.positions[stage]);
        })[0]
        ?? race.lanes[0];
      const encounter = leadLane?.encounters[obstacle.id];
      const clips: AnnouncerClip[] = [
        obstacleAnnouncerClips[obstacle.kind]?.[0],
      ].filter((clip): clip is AnnouncerClip => Boolean(clip));
      const resultClips: AnnouncerClip[] = [];
      if (encounter) {
        const matchedResultAudio = getMatchedEncounterResultAudio(encounter.result, encounter.headline);
        if (matchedResultAudio) {
          resultClips.push(announcerClip('result-fragments', matchedResultAudio.file, matchedResultAudio.label));
        }
      }
      if (canCallout) {
        beats.push({
          id: `obstacle-callout-${obstacle.id}`,
      step: 'race',
          label: `${obstacle.label} callout`,
          offset: entryOffset,
          deadlineOffset: obstacleMilestones[obstacleOrder + 1]?.entryOffset ?? stageDuration,
          clips,
        });
      }
      if (resultClips.length) {
        beats.push({
          id: `obstacle-reaction-${obstacle.id}`,
          step: 'race',
          timelineStage: stage,
          label: `${obstacle.label} reaction`,
          offset: hitOffset,
          deadlineOffset: obstacleMilestones[obstacleOrder + 1]?.hitOffset ?? stageDuration,
          clips: resultClips,
        });
      }
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
        step: 'race',
        timelineStage: stage,
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
        step: 'race',
        timelineStage: stage,
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
  { id: 'tilda-toolbox', kind: 'Tilda keepsake', title: 'The Perfectly Packed Toolbox', description: 'A small ivory tool box with a lavender latch. A practical workshop keepsake from a pantry engineer.', earnedBy: 'tilda', imageSrc: tildaToolbox, artVariant: 'tilda-toolbox' as const },
  { id: 'tilda-wrench-set', kind: 'Tilda keepsake', title: 'The Crossed-Tool Set', description: 'A silver wrench crossed with a tiny copper gear. A practical workshop keepsake from a pantry engineer.', earnedBy: 'tilda', imageSrc: tildaWrenchSet, artVariant: 'tilda-wrench-set' as const },
  { id: 'tilda-safety-module', kind: 'Tilda keepsake', title: 'The Safety Module', description: 'A cube-shaped mechanism core with a dim jade indicator light. A practical workshop keepsake from a pantry engineer.', earnedBy: 'tilda', imageSrc: tildaSafetyModule, artVariant: 'tilda-safety-module' as const },
  { id: 'sencha-leaf-bookmark', kind: 'Sencha keepsake', title: 'The Jade-and-Gold Tea Leaf Charm', description: 'A jade-and-gold tea leaf charm. A serene keepsake from a precise tea spirit.', earnedBy: 'sencha', imageSrc: senchaLeafBookmark, artVariant: 'sencha-leaf-bookmark' as const },
  { id: 'sencha-night-teapot', kind: 'Sencha keepsake', title: 'The Night-Steep Teapot', description: 'A tiny charcoal ceramic teapot with a delicate amber steam curl. A serene keepsake from a precise tea spirit.', earnedBy: 'sencha', imageSrc: senchaNightTeapot, artVariant: 'sencha-night-teapot' as const },
  { id: 'sencha-tea-ledger', kind: 'Sencha keepsake', title: 'The Folded Moss-Green Tea Cloth', description: 'A folded moss-green tea cloth tied with a muted-gold cord. A serene keepsake from a precise tea spirit.', earnedBy: 'sencha', imageSrc: senchaTeaLedger, artVariant: 'sencha-tea-ledger' as const },
  { id: 'toro-captains-cap', kind: 'Toro keepsake', title: 'The Captain’s Night Cap', description: 'A miniature navy captain cap with a generic brass emblem. A proud nautical keepsake from a retired sailor-grillmaster.', earnedBy: 'toro', imageSrc: toroCaptainsCap, artVariant: 'toro-captains-cap' as const },
  { id: 'toro-pocket-compass', kind: 'Toro keepsake', title: 'The Steady-Hand Compass', description: 'A weathered copper compass with a coral needle. A proud nautical keepsake from a retired sailor-grillmaster.', earnedBy: 'toro', imageSrc: toroPocketCompass, artVariant: 'toro-pocket-compass' as const },
  { id: 'toro-grill-spatula', kind: 'Toro keepsake', title: 'The Red-Handle Grill Spatula', description: 'A tiny polished grilling spatula wrapped in crimson cloth. A proud nautical keepsake from a retired sailor-grillmaster.', earnedBy: 'toro', imageSrc: toroGrillSpatula, artVariant: 'toro-grill-spatula' as const },
  { id: 'nori-plum-notebook', kind: 'Nori keepsake', title: 'The Plum Notebook', description: 'A tiny plum notebook with a seafoam bookmark ribbon. A dreamy keepsake from a midnight food poet.', earnedBy: 'nori', imageSrc: noriPlumNotebook, artVariant: 'nori-plum-notebook' as const },
  { id: 'nori-brush-pen', kind: 'Nori keepsake', title: 'The Ink-Drop Brush Pen', description: 'A brush pen with a dark ink droplet charm. A dreamy keepsake from a midnight food poet.', earnedBy: 'nori', imageSrc: noriBrushPen, artVariant: 'nori-brush-pen' as const },
  { id: 'nori-scarf-pin', kind: 'Nori keepsake', title: 'The Crescent Wave Scarf Pin', description: 'A folded charcoal scarf pin shaped like an abstract crescent wave. A dreamy keepsake from a midnight food poet.', earnedBy: 'nori', imageSrc: noriScarfPin, artVariant: 'nori-scarf-pin' as const },
  { id: 'miso-soup-bowl', kind: 'Miso keepsake', title: 'The Amber-Steam Soup Bowl', description: 'A round dark earthenware soup bowl with three amber steam pixels. A gentle comfort-food keepsake from a fox soup host.', earnedBy: 'miso', imageSrc: misoSoupBowl, artVariant: 'miso-soup-bowl' as const },
  { id: 'miso-walnut-ladle', kind: 'Miso keepsake', title: 'The Wrapped Walnut Ladle', description: 'A small walnut ladle with a cream handle wrap. A gentle comfort-food keepsake from a fox soup host.', earnedBy: 'miso', imageSrc: misoWalnutLadle, artVariant: 'miso-walnut-ladle' as const },
  { id: 'miso-broth-jar', kind: 'Miso keepsake', title: 'The Emergency Broth Jar', description: 'A moss-green emergency broth jar with a tiny fox-tail charm. A gentle comfort-food keepsake from a fox soup host.', earnedBy: 'miso', imageSrc: misoBrothJar, artVariant: 'miso-broth-jar' as const },
  { id: 'uma-noodle-ribbon', kind: 'Uma keepsake', title: 'The Cobalt Noodle Ribbon', description: 'A coiled cream noodle ribbon tied with a cobalt band. A strong, practical keepsake from a noodle maker.', earnedBy: 'uma', imageSrc: umaNoodleRibbon, artVariant: 'uma-noodle-ribbon' as const },
  { id: 'uma-flour-sack', kind: 'Uma keepsake', title: 'The Stamped Flour Sack', description: 'A small flour sack with a muted red stamp-like mark. A strong, practical keepsake from a noodle maker.', earnedBy: 'uma', imageSrc: umaFlourSack, artVariant: 'uma-flour-sack' as const },
  { id: 'uma-rolling-pin', kind: 'Uma keepsake', title: 'The Red-Sashed Rolling Pin', description: 'A sturdy wooden rolling pin wrapped with a red sash. A strong, practical keepsake from a noodle maker.', earnedBy: 'uma', imageSrc: umaRollingPin, artVariant: 'uma-rolling-pin' as const },
  { id: 'panko-magnifying-glass', kind: 'Panko keepsake', title: 'The Sesame-Sparkle Magnifier', description: 'A small brass magnifying glass with a sesame-seed sparkle inside. A curious keepsake from a crumb detective.', earnedBy: 'panko', imageSrc: pankoMagnifyingGlass, artVariant: 'panko-magnifying-glass' as const },
  { id: 'panko-detective-beret', kind: 'Panko keepsake', title: 'The Crumb Detective Beret', description: 'A crumb-speckled cream detective beret. A curious keepsake from a crumb detective.', earnedBy: 'panko', imageSrc: pankoDetectiveBeret, artVariant: 'panko-detective-beret' as const },
  { id: 'panko-clue-notebook', kind: 'Panko keepsake', title: 'The Wheat-Ribbon Clue Notebook', description: 'A tiny brown clue notebook sealed with a wheat-colored ribbon. A curious keepsake from a crumb detective.', earnedBy: 'panko', imageSrc: pankoClueNotebook, artVariant: 'panko-clue-notebook' as const },
  { id: 'kiku-aged-copper-kettle', kind: 'Kiku keepsake', title: 'The Weather-Reading Kettle', description: 'A small aged-copper kettle with a single steam puff. A charmingly experimental keepsake from a weather-reading inventor.', earnedBy: 'kiku', imageSrc: kikuAgedCopperKettle, artVariant: 'kiku-aged-copper-kettle' as const },
  { id: 'kiku-jade-brass-gear', kind: 'Kiku keepsake', title: 'The Jade-Center Gear', description: 'An unusual brass gear with a jade center. A charmingly experimental keepsake from a weather-reading inventor.', earnedBy: 'kiku', imageSrc: kikuJadeBrassGear, artVariant: 'kiku-jade-brass-gear' as const },
  { id: 'kiku-sage-blueprint', kind: 'Kiku keepsake', title: 'The Sage Blueprint Roll', description: 'A rolled sage-green blueprint tied with charcoal thread. A charmingly experimental keepsake from a weather-reading inventor.', earnedBy: 'kiku', imageSrc: kikuSageBlueprint, artVariant: 'kiku-sage-blueprint' as const },
  { id: 'bibi-stacked-bento', kind: 'Bibi keepsake', title: 'The Patterned Bento Stack', description: 'A tiny stacked bento box with muted blue and ochre patterns. A carefully curated keepsake from a traveling lunch arranger.', earnedBy: 'bibi', imageSrc: bibiStackedBento, artVariant: 'bibi-stacked-bento' as const },
  { id: 'bibi-food-tweezers', kind: 'Bibi keepsake', title: 'The Sheathed Plating Tweezers', description: 'Precise silver food tweezers in a cream sheath. A carefully curated keepsake from a traveling lunch arranger.', earnedBy: 'bibi', imageSrc: bibiFoodTweezers, artVariant: 'bibi-food-tweezers' as const },
  { id: 'bibi-cloth-wrap', kind: 'Bibi keepsake', title: 'The Amber-Charmed Cloth Wrap', description: 'A folded pale-blue cloth wrap tied with a small amber charm. A carefully curated keepsake from a traveling lunch arranger.', earnedBy: 'bibi', imageSrc: bibiClothWrap, artVariant: 'bibi-cloth-wrap' as const },
  { id: 'rollo-radish-medal', kind: 'Rollo keepsake', title: 'The Radish Shortcut Medal', description: 'A radish-shaped medal with trailing ribbons, awarded for taking the most unexpected route home.', earnedBy: 'rollo', imageSrc: rolloRadishMedal, artVariant: 'rollo-radish-medal' as const },
  { id: 'rollo-ceramic-bowl', kind: 'Rollo keepsake', title: 'The Midnight Radish Bowl', description: 'A dark ceramic bowl with a few bright radish flecks, ready for a late-night shortcut snack.', earnedBy: 'rollo', imageSrc: rolloCeramicBowl, artVariant: 'rollo-ceramic-bowl' as const },
  { id: 'rollo-ribbon-bell', kind: 'Rollo keepsake', title: 'The Shortcut Bell', description: 'A warm brass bell tied with a coral ribbon, rung whenever the quick way turns into an adventure.', earnedBy: 'rollo', imageSrc: rolloRibbonBell, artVariant: 'rollo-ribbon-bell' as const },
  { id: 'saffy-garnish-plate', kind: 'Saffy keepsake', title: 'The Garnish Plate', description: 'A pale ceramic plating dish carrying one perfectly placed garnish. A precise keepsake from Saffy’s dramatic finishing station.', earnedBy: 'saffy', imageSrc: saffyGarnishPlate, artVariant: 'saffy-garnish-plate' as const },
  { id: 'saffy-plating-tweezers', kind: 'Saffy keepsake', title: 'The Ribbon Plating Tweezers', description: 'Silver plating tweezers tied with a coral ribbon. A precise keepsake from Saffy’s dramatic finishing station.', earnedBy: 'saffy', imageSrc: saffyPlatingTweezers, artVariant: 'saffy-plating-tweezers' as const },
  { id: 'saffy-presentation-fan', kind: 'Saffy keepsake', title: 'The Presentation Fan', description: 'A navy-and-coral folding fan reserved for the final flourish. A precise keepsake from Saffy’s dramatic finishing station.', earnedBy: 'saffy', imageSrc: saffyPresentationFan, artVariant: 'saffy-presentation-fan' as const },
  { id: 'pip-pocket-watch', kind: 'Pip keepsake', title: 'The Brass Sunrise Pocket Watch', description: 'A tiny brass pocket watch with an apricot face, kept ticking for the first warm light of morning.', earnedBy: 'pip', imageSrc: PIP_POCKET_WATCH_SRC, artVariant: 'pip-pocket-watch' as const },
  { id: 'pip-rice-bowl', kind: 'Pip keepsake', title: 'The Teal-Ribbon Rice Bowl', description: 'A little rice bowl tied with a teal ribbon, saved for meals that deserve a gentle beginning.', earnedBy: 'pip', imageSrc: PIP_RICE_BOWL_SRC, artVariant: 'pip-rice-bowl' as const },
  { id: 'pip-satchel-tag', kind: 'Pip keepsake', title: 'The Apricot Satchel Tag', description: 'An apricot luggage tag with a tiny rice charm, ready for one more shortcut home.', earnedBy: 'pip', imageSrc: PIP_SATCHEL_TAG_SRC, artVariant: 'pip-satchel-tag' as const },
];

const showcaseCollectibles: Collectible[] = collectiblePool.map((item) => ({
  ...item,
  earnedBy: personas.find((persona) => persona.id === item.earnedBy)?.name ?? item.earnedBy,
  earnedAt: new Date().toISOString(),
}));

type CurioDisplayZone = 'house-keeps' | 'tea-tools' | 'spare-plates' | 'little-finds' | 'hanging-tools';

function getCurioDisplayZone(item: Collectible): CurioDisplayZone {
  if (item.id.includes('pip-pocket-watch')) return 'house-keeps';
  if (item.id.includes('pip-rice-bowl')) return 'house-keeps';
  if (item.id.includes('pip-satchel-tag')) return 'little-finds';
  if (item.id.includes('tilda-toolbox')) return 'house-keeps';
  if (item.id.includes('tilda-wrench-set')) return 'hanging-tools';
  if (item.id.includes('tilda-safety-module')) return 'little-finds';
  if (item.id.includes('sencha-leaf-bookmark')) return 'tea-tools';
  if (item.id.includes('sencha-night-teapot')) return 'little-finds';
  if (item.id.includes('sencha-tea-ledger')) return 'house-keeps';
  if (item.id.includes('toro-captains-cap')) return 'house-keeps';
  if (item.id.includes('toro-pocket-compass')) return 'little-finds';
  if (item.id.includes('toro-grill-spatula')) return 'hanging-tools';
  if (item.id.includes('nori-plum-notebook')) return 'house-keeps';
  if (item.id.includes('nori-brush-pen')) return 'little-finds';
  if (item.id.includes('nori-scarf-pin')) return 'hanging-tools';
  if (item.id.includes('miso-soup-bowl')) return 'house-keeps';
  if (item.id.includes('miso-walnut-ladle')) return 'hanging-tools';
  if (item.id.includes('miso-broth-jar')) return 'little-finds';
  if (item.id.includes('uma-noodle-ribbon')) return 'house-keeps';
  if (item.id.includes('uma-flour-sack')) return 'little-finds';
  if (item.id.includes('uma-rolling-pin')) return 'hanging-tools';
  if (item.id.includes('panko-magnifying-glass')) return 'little-finds';
  if (item.id.includes('panko-detective-beret')) return 'house-keeps';
  if (item.id.includes('panko-clue-notebook')) return 'hanging-tools';
  if (item.id.includes('kiku-aged-copper-kettle')) return 'house-keeps';
  if (item.id.includes('kiku-jade-brass-gear')) return 'hanging-tools';
  if (item.id.includes('kiku-sage-blueprint')) return 'little-finds';
  if (item.id.includes('bibi-stacked-bento')) return 'house-keeps';
  if (item.id.includes('bibi-food-tweezers')) return 'hanging-tools';
  if (item.id.includes('bibi-cloth-wrap')) return 'little-finds';
  if (item.id.includes('rollo-radish-medal')) return 'house-keeps';
  if (item.id.includes('rollo-ceramic-bowl')) return 'spare-plates';
  if (item.id.includes('rollo-ribbon-bell')) return 'hanging-tools';
  if (item.id.includes('saffy-garnish-plate')) return 'spare-plates';
  if (item.id.includes('saffy-plating-tweezers')) return 'hanging-tools';
  if (item.id.includes('saffy-presentation-fan')) return 'little-finds';
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
  return Math.min(100, Math.max(4, value));
}

type RaceResolutionOptions = {
  startingOffsets?: number[];
};

function buildRaceSimulation(
  contestants: Persona[],
  rng: () => number,
  { startingOffsets = [] }: RaceResolutionOptions = {},
): RaceSimulation {
  const fallbackKinds = shuffleWithRng(
    (Object.keys(raceObstacleCatalog) as RaceObstacleKind[])
      .filter((kind) => !DISABLED_RACE_OBSTACLE_KINDS.has(kind)),
    rng,
  );
  const selectedKinds = contestants
    .map((persona) => personaObstacleKinds[persona.id])
    .filter((kind): kind is RaceObstacleKind => kind !== undefined && !DISABLED_RACE_OBSTACLE_KINDS.has(kind))
    .slice(0, 4);
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
      imageSrc: catalog.imageSrc,
      position: RACE_OBSTACLE_PLACEMENTS[index]?.position
        ?? RACE_OBSTACLE_PLACEMENTS[RACE_OBSTACLE_PLACEMENTS.length - 1].position,
      sourcePersonaId: sourcePersona.id,
    };
  });

  type WorkingRaceLane = RaceLaneSimulation & { persona: Persona; progress: number };
  const lanes: WorkingRaceLane[] = contestants.map((persona, index) => {
    const startingStagger = (persona.traits.speed - 50) * 0.11
      + (persona.traits.chaos - 50) * 0.07
      + rng() * 8 - 4;
    let progress = 6 + persona.traits.speed * 0.06 + startingStagger + (startingOffsets[index] ?? 0);
    const baseSpeedMultiplier = getRunnerBaseSpeedMultiplier(persona.traits.speed);
    const lane: WorkingRaceLane = {
      persona,
      progress,
      encounters: {},
      checkpoints: [],
      finishCrossingMs: null,
      personaId: persona.id,
      baseSpeedMultiplier,
      speedEvents: [],
      reactionWindows: [],
      trajectory: [],
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

    const encounterResults = ensureRaceEncounterVariety(
      lanes.map((lane) => {
        const rankIndex = rankingBefore.indexOf(lane);
        const catalog = raceObstacleCatalog[obstacle.kind];
        return resolveRaceEncounterResult({
          traits: lane.persona.traits,
          primaryTrait: catalog.primaryTrait,
          secondaryTrait: catalog.secondaryTrait,
          obstacleKind: obstacle.kind,
          rankIndex,
          laneCount: rankingBefore.length,
          spread,
          rng,
        });
      }),
      obstacleIndex,
    );

    lanes.forEach((lane, laneIndex) => {
      const catalog = raceObstacleCatalog[obstacle.kind];
      const result: RaceEncounterResult = encounterResults[laneIndex] ?? 'clear';
      const progressDelta = result === 'surge' ? 18 : result === 'slow' ? -20 : result === 'reroute' ? -10 : 3;
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
        reaction,
        triggerMs: null,
        reactionEndMs: null,
      };
    });

    const rankingAfter = [...lanes].sort((a, b) => b.progress - a.progress);
    const leaderAfter = rankingAfter[0];
    if (!leaderBefore || !leaderAfter) return;
    checkpointLeaders[obstacle.id] = {
      beforeId: leaderBefore.personaId,
      afterId: leaderAfter.personaId,
    };
    const leadChangeKind = getRaceLeadChangeKind(
      leaderBefore.personaId,
      leaderAfter.personaId,
      previouslyLed,
    );
    if (leadChangeKind) {
      leadChanges.push({
        obstacleId: obstacle.id,
        fromPersonaId: leaderBefore.personaId,
        toPersonaId: leaderAfter.personaId,
        kind: leadChangeKind,
      });
    }
    previouslyLed.add(leaderAfter.personaId);
    if (obstacleIndex === 0) lanes.forEach((lane) => { lane.positions.warmup = lane.progress; });
    if (obstacleIndex === 1) lanes.forEach((lane) => { lane.positions.matchup = lane.progress; });
    if (obstacleIndex >= 2) lanes.forEach((lane) => { lane.positions.finale = lane.progress; });
  });

  if (obstacles.length < 3) lanes.forEach((lane) => { lane.positions.finale = lane.progress; });
  lanes.forEach((lane) => {
    const speedEvents: RunnerSpeedEvent[] = [];
    const timelineLane = {
      positions: lane.positions,
      encounters: Object.fromEntries(
        Object.entries(lane.encounters).map(([obstacleId, encounter]) => [obstacleId, { result: encounter.result }]),
      ),
      checkpoints: lane.checkpoints,
    };
    obstacles.forEach((obstacle, obstacleIndex) => {
      const stage = obstacleIndex === 0 ? 'warmup' : obstacleIndex === 1 ? 'matchup' : 'finale';
      const triggerMs = getRaceRunnerObstacleContactOffset(
        stage,
        obstacle,
        timelineLane,
        obstacles,
        (elapsedMs) => getContinuousRunnerPosition(
          {
            startPosition: lane.positions.intro,
            baseSpeedMultiplier: lane.baseSpeedMultiplier,
            events: speedEvents,
          },
          elapsedMs,
          RACE_RUNNER_TRAVEL_END_POSITION,
          RACE_RACE_DURATION_MS,
        ),
        false,
        undefined,
        getRaceObstacleHorizontalOffsetPx(obstacleIndex),
      );
      speedEvents.push({
        obstacleId: obstacle.id,
        result: lane.encounters[obstacle.id]?.result ?? 'clear',
        triggerMs: RACE_STAGE_OFFSETS[stage] + triggerMs,
      });
    });
    lane.speedEvents = speedEvents;
    lane.finishCrossingMs = getRunnerFinishCrossingTime(
      {
        startPosition: lane.positions.intro,
        baseSpeedMultiplier: lane.baseSpeedMultiplier,
        events: lane.speedEvents,
      },
      RACE_FINISH_THRESHOLD_POSITION,
      RACE_RUNNER_TRAVEL_END_POSITION,
      RACE_RACE_DURATION_MS,
    );
    lane.reactionWindows = lane.speedEvents.map((event) => ({
      obstacleId: event.obstacleId,
      triggerMs: event.triggerMs,
      endMs: event.triggerMs + Math.max(
        900,
        getRunnerSpeedEventDuration(event.result),
      ),
    }));
    lane.reactionWindows.forEach((window) => {
      const encounter = lane.encounters[window.obstacleId];
      if (!encounter) return;
      encounter.triggerMs = window.triggerMs;
      encounter.reactionEndMs = window.endMs;
    });
    lane.trajectory = buildRunnerTrajectory(
      {
        startPosition: lane.positions.intro,
        baseSpeedMultiplier: lane.baseSpeedMultiplier,
        events: lane.speedEvents,
      },
      RACE_RUNNER_TRAVEL_END_POSITION,
      RACE_RACE_DURATION_MS,
      100,
      lane.finishCrossingMs,
    );
    // The same resolved trajectory drives both normal interpolation and the
    // reduced-motion stage snapshots. Keep the authored checkpoint data for
    // narration/debugging, but do not let a second stage projection decide
    // where a runner appears.
    lane.positions.warmup = getRunnerTrajectoryPositionAtTime(
      lane.trajectory,
      RACE_STAGE_OFFSETS.warmup + RACE_STAGE_DURATIONS.warmup,
    );
    lane.positions.matchup = getRunnerTrajectoryPositionAtTime(
      lane.trajectory,
      RACE_STAGE_OFFSETS.matchup + RACE_STAGE_DURATIONS.matchup,
    );
    lane.positions.finale = getRunnerTrajectoryPositionAtTime(
      lane.trajectory,
      RACE_STAGE_OFFSETS.finale + RACE_STAGE_DURATIONS.finale,
    );
  });

  // The lane crossings determine the winner order, but the shared visible
  // finish cannot fire until the panorama has completed its final background.
  const firstFinishCrossingMs = Math.min(
    ...lanes
      .map((lane) => lane.finishCrossingMs)
      .filter((crossingMs): crossingMs is number => crossingMs !== null),
  );
  const resolvedFinishCrossingMs = RACE_RACE_DURATION_MS;
  lanes.forEach((lane) => {
    lane.positions.winner = clampRacePosition(getContinuousRunnerPosition(
      {
        startPosition: lane.positions.intro,
        baseSpeedMultiplier: lane.baseSpeedMultiplier,
        events: lane.speedEvents,
      },
      firstFinishCrossingMs,
      RACE_RUNNER_TRAVEL_END_POSITION,
      RACE_RACE_DURATION_MS,
    ));
  });

  // Near-simultaneous crossings use the roster order as an explicit,
  // serializable tie-break instead of relying on engine sort stability.
  const finishOrder = resolveRunnerFinishOrder(lanes);
  const winnerLane = lanes.find((lane) => lane.personaId === finishOrder[0]) ?? lanes[0];
  const winnerId = winnerLane?.personaId ?? contestants[0]?.id ?? spriteSheetContestants[0]?.id;
  if (!winnerId) throw new Error('Cannot build a race without a sprite-sheet contestant.');
  return {
    obstacles,
    lanes: lanes.map(({ persona: _persona, progress: _progress, ...lane }) => lane),
    finishCrossingMs: resolvedFinishCrossingMs,
    winnerId,
    finishOrder,
    finishCrossings: Object.fromEntries(lanes.map((lane) => [lane.personaId, lane.finishCrossingMs])),
    checkpointLeaders,
    leadChanges,
  };
}

function resolveContest(
  contestants: Persona[],
  rng: () => number,
  options: RaceResolutionOptions = {},
): ContestOutcome {
  if (contestants.some((contestant) => !spriteSheetContestants.some((persona) => persona.id === contestant.id))) {
    throw new Error('A contest roster contains a contestant without a cooking sprite sheet.');
  }
  const race = buildRaceSimulation(contestants, rng, options);
  const winner = contestants.find((persona) => persona.id === race.winnerId) ?? contestants[0] ?? spriteSheetContestants[0];
  if (!winner) throw new Error('Cannot resolve a contest without a sprite-sheet contestant.');
  return {
    winner,
    memorableEvent: winner.memorableEvent,
    contestName: contestNames[Math.floor(rng() * contestNames.length)] ?? contestNames[0],
    race,
  };
}

function useStoredState<T>(key: string, fallback: T, normalize: (value: T) => T = (value) => value) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? normalize(JSON.parse(saved) as T) : fallback;
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
  const compact = item.id === 'shrimp-temaki' || item.id === 'garden-maki';
  const beer = item.id === 'sapporo-beer';
  return <img className={`food-plate-image${compact ? ' food-plate-image-compact' : ''}${beer ? ' food-plate-image-sapporo' : ''}${selection ? ' food-plate-image-selection' : ''}`} src={item.imageSrc} alt="" aria-hidden="true" />;
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

function CurioArtFrame({ profile, children }: { profile: CurioArtProfile; children: ReactNode }) {
  return (
    <div className="curio-art-box">
      <div className="curio-art-normalized" style={{ '--curio-art-scale': profile.scale * CURIO_ART_FIT_SCALE } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

function CurioGlyph({ item }: { item: Collectible }) {
  if (!item.imageSrc) return null;
  const artVariant = item.artVariant;
  return (
    <CurioArtFrame profile={getCurioArtProfile({ artVariant })}>
      <div className={`curio-glyph curio-glyph-image${artVariant ? ` curio-glyph-image-${artVariant}` : ''}`} aria-hidden="true">
        <img src={item.imageSrc} alt="" draggable="false" />
      </div>
    </CurioArtFrame>
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

function CurioHotspot({ item, className, style }: { item: Collectible; className: string; style?: CSSProperties }) {
  const isLatest = className.includes('displayed-curio-latest');
  return (
    <button
      type="button"
      className={`curio-hotspot ${className}`}
      style={style}
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
  const frameDurationMs = speedUpDurationMs(persona.foodAnimationFrameDurationMs ?? 300);

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
function getRestaurantShelfItems(collectibles: readonly Collectible[]) {
  const byZone = (zone: CurioDisplayZone) => collectibles.filter((item) => getCurioDisplayZone(item) === zone);
  return (['house-keeps', 'tea-tools', 'spare-plates', 'little-finds', 'hanging-tools'] as CurioDisplayZone[])
    .flatMap((zone) => byZone(zone));
}

function RestaurantCurioDisplays({ collectibles, placements }: { collectibles: readonly Collectible[]; placements: CurioShelfPlacementMap }) {
  const latestCurioId = collectibles[0]?.id;
  const shelfItems = getRestaurantShelfItems(collectibles);
  const displayClass = (baseClass: string, item: Collectible) => `${baseClass} displayed-curio-${getCurioDisplayZone(item)}${item.id === latestCurioId ? ' displayed-curio-latest' : ''}`;
  return (
    <div className="restaurant-curio-displays" aria-label="Curios displayed on the restaurant shelf">
      <div className="restaurant-curio-shelf-stage">
        {shelfItems.map((item) => {
          const placement = placements[item.id];
          if (!placement) return null;
          return (
            <CurioHotspot
              item={item}
              className={displayClass('displayed-curio', item)}
              key={item.id}
              style={{
                gridColumn: placement.cell % CURIO_SHELF_GRID.columns + 1,
                gridRow: Math.floor(placement.cell / CURIO_SHELF_GRID.columns) + 1,
              }}
            />
          );
        })}
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

function RestaurantControls({
  onOpenCurio,
  ledgerCount,
  curioCount,
  isDebugMode,
  isCurioShowcaseEnabled,
  onCurioShowcaseChange,
}: {
  onOpenCurio: (view: 'shelf' | 'ledger') => void;
  ledgerCount: number;
  curioCount: number;
  isDebugMode: boolean;
  isCurioShowcaseEnabled: boolean;
  onCurioShowcaseChange: (enabled: boolean) => void;
}) {
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
        {isDebugMode && (
          <>
            <label className="curio-debug-control" data-testid="debug-curio-showcase-control">
              <input
                type="checkbox"
                checked={isCurioShowcaseEnabled}
                onChange={(event) => onCurioShowcaseChange(event.currentTarget.checked)}
                data-testid="toggle-curio-showcase"
              />
              <span>Full curio showcase</span>
              <span className="curio-debug-control-state">{isCurioShowcaseEnabled ? 'on' : 'off'}</span>
            </label>
            <a className="curio-button track-debug-nav-link" href={`${import.meta.env.BASE_URL}race-track-debug`} data-testid="link-track-debug">Track</a>
          </>
        )}
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

type RaceRunnerPresentation = {
  anchor: number;
  obstacleIndex: number;
  action: MovementAction;
  animationKey: string;
  speedMultiplier: number;
  reaction: RaceRunnerReaction;
  finishCrossed: boolean;
};

type RaceLiveRendererProps = {
  contestants: Persona[];
  winner: Persona | null;
  step: ContestStep;
  race: RaceSimulation;
  finishCrossed: boolean;
  raceStartedAt: number | null;
  prefersReducedMotion: boolean;
  onFrameState: (obstacleIndexes: number[]) => void;
};

const RACE_CANVAS_WIDTH_PX = 1280;
const RaceLiveRenderer = memo(function RaceLiveRenderer({
  contestants,
  winner,
  step,
  race,
  finishCrossed,
  raceStartedAt,
  prefersReducedMotion,
  onFrameState,
}: RaceLiveRendererProps) {
  const worldTrackRef = useRef<HTMLDivElement | null>(null);
  const runnerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previousObstacleIndexes = useRef<number[] | null>(null);
  const onFrameStateRef = useRef(onFrameState);
  onFrameStateRef.current = onFrameState;
  const raceLanes = useMemo(
    () => contestants.map((_, index) => race.lanes.find((lane) => lane.personaId === contestants[index]?.id) ?? race.lanes[index]),
    [contestants, race],
  );
  const introRunnerPositions = useMemo(
    () => raceLanes.map((lane) => lane?.positions.intro ?? 5),
    [raceLanes],
  );
  const stageRunnerAnchors = useMemo(() => ({
    intro: getRaceRunnerScreenAnchors(introRunnerPositions, introRunnerPositions, RACE_FINISH_THRESHOLD_POSITION),
    warmup: getRaceRunnerScreenAnchors(raceLanes.map((lane) => lane?.positions.warmup ?? 28), introRunnerPositions, RACE_FINISH_THRESHOLD_POSITION),
    matchup: getRaceRunnerScreenAnchors(raceLanes.map((lane) => lane?.positions.matchup ?? 52), introRunnerPositions, RACE_FINISH_THRESHOLD_POSITION),
    finale: getRaceRunnerScreenAnchors(raceLanes.map((lane) => lane?.positions.finale ?? 78), introRunnerPositions, RACE_FINISH_THRESHOLD_POSITION),
  }), [introRunnerPositions, raceLanes]);

  const getFramePresentation = (clockMs: number) => {
    const getLaneProgress = (lane: RaceLaneSimulation | undefined) => {
      if (!lane) return 0;
      if (step === 'winner' || finishCrossed) return lane.positions.winner;
      if (step === 'intro') return lane.positions.intro;
      return getRunnerTrajectoryPositionAtTime(
        lane.trajectory,
        prefersReducedMotion ? RACE_RACE_DURATION_MS : clockMs,
      );
    };
    const worldTravelPercent = getRaceWorldTravelPercentAtRaceTime(
      clockMs,
      prefersReducedMotion,
    );
    const laneProgresses = raceLanes.map((lane) => getLaneProgress(lane));
    const runnerFinishScreenAnchor = getRaceRunnerFinishScreenAnchorAtRaceTime(
      clockMs,
      prefersReducedMotion,
    );
    const currentRunnerAnchors = getRaceRunnerScreenAnchors(
      laneProgresses,
      introRunnerPositions,
      RACE_FINISH_THRESHOLD_POSITION,
      runnerFinishScreenAnchor,
    );
    const getCurrentLaneObstacleIndex = (lane: RaceLaneSimulation | undefined, laneIndex: number) => {
      if (!lane || step === 'intro' || step === 'winner') return -1;
      const activeWindow = lane.reactionWindows.find((window) => (
        clockMs >= window.triggerMs && clockMs < window.endMs
      ));
      return activeWindow
        ? race.obstacles.findIndex((obstacle) => obstacle.id === activeWindow.obstacleId)
        : -1;
    };

    const presentations = raceLanes.map((lane, index): RaceRunnerPresentation => {
      const laneCurrentObstacleIndex = getCurrentLaneObstacleIndex(lane, index);
      const laneCurrentObstacle = laneCurrentObstacleIndex >= 0 ? race.obstacles[laneCurrentObstacleIndex] : null;
      const encounter = laneCurrentObstacle ? lane?.encounters[laneCurrentObstacle.id] : undefined;
      const runnerProfile = {
        startPosition: lane?.positions.intro ?? 0,
        baseSpeedMultiplier: lane?.baseSpeedMultiplier ?? 1,
        events: lane?.speedEvents ?? [],
      };
      const runnerSpeedMultiplier = getRunnerEffectiveSpeed(runnerProfile, clockMs);
      const runnerReaction = encounter?.reaction ?? 'ready';
      const isWinner = (winner?.id ?? race.winnerId) === contestants[index]?.id;
      const finishAction = getRaceRunnerFinishAction(finishCrossed, isWinner);
      const hasObstacleReaction = hasNegativeObstacleImpact(encounter?.result);
      const hasJumpReaction = runnerReaction === 'jump' && Boolean(laneCurrentObstacle && encounter);
      const runnerAction: MovementAction = finishAction
        ?? (hasObstacleReaction
          ? 'fall'
          : hasJumpReaction
            ? 'jump'
            : step === 'intro'
              ? 'idle'
              : getRunnerMovementState(runnerProfile, clockMs));
      return {
        anchor: currentRunnerAnchors[index]
          ?? stageRunnerAnchors[step === 'intro' ? 'intro' : 'finale'][index]
          ?? 50,
        obstacleIndex: laneCurrentObstacleIndex,
        action: runnerAction,
        animationKey: finishAction
          ? `${finishAction}-${contestants[index]?.id}`
          : hasObstacleReaction
            ? `${step}-${laneCurrentObstacle?.id ?? 'reaction'}-${runnerReaction}`
            : step,
        speedMultiplier: finishAction ? 1 : runnerSpeedMultiplier,
        reaction: runnerReaction,
        finishCrossed: lane?.finishCrossingMs !== null
          && lane?.finishCrossingMs !== undefined
          && clockMs >= lane.finishCrossingMs,
      };
    });
    return { worldTravelPercent, presentations };
  };

  const [presentations, setPresentations] = useState<RaceRunnerPresentation[]>(() => (
    getFramePresentation(raceStartedAt ? Math.max(0, Date.now() - raceStartedAt) : 0).presentations
  ));

  useEffect(() => {
    previousObstacleIndexes.current = null;
    setPresentations(getFramePresentation(raceStartedAt ? Math.max(0, Date.now() - raceStartedAt) : 0).presentations);
  }, [finishCrossed, prefersReducedMotion, raceStartedAt, step, winner]);

  useEffect(() => {
    const activeMotion = Boolean(
      raceStartedAt
      && !prefersReducedMotion
      && step !== 'intro'
      && step !== 'winner'
      && !finishCrossed,
    );
    let frame = 0;
    const applyFrame = () => {
      const clockMs = raceStartedAt ? Math.max(0, Date.now() - raceStartedAt) : 0;
      const frameState = getFramePresentation(clockMs);
      if (worldTrackRef.current) {
        worldTrackRef.current.style.transform = `translate3d(-${frameState.worldTravelPercent}%, 0, 0)`;
        worldTrackRef.current.dataset.worldTravelPercent = frameState.worldTravelPercent.toFixed(3);
      }
      frameState.presentations.forEach((presentation, index) => {
        const runner = runnerRefs.current[index];
        if (!runner) return;
        runner.style.transform = `translate3d(${presentation.anchor / 100 * RACE_CANVAS_WIDTH_PX - RACE_RUNNER_RENDER_WIDTH_PX / 2}px, 0, 0)`;
        runner.dataset.runnerAnchor = presentation.anchor.toFixed(3);
         runner.dataset.runnerFinishCrossed = String(presentation.finishCrossed);
      });
      const obstacleIndexes = frameState.presentations.map(({ obstacleIndex }) => obstacleIndex);
      const priorObstacleIndexes = previousObstacleIndexes.current;
      if (!priorObstacleIndexes || obstacleIndexes.some((index, position) => index !== priorObstacleIndexes[position])) {
        previousObstacleIndexes.current = obstacleIndexes;
        setPresentations(frameState.presentations);
        onFrameStateRef.current(obstacleIndexes);
      }
      if (activeMotion) frame = window.requestAnimationFrame(applyFrame);
    };
    applyFrame();
    return () => window.cancelAnimationFrame(frame);
  }, [finishCrossed, prefersReducedMotion, raceStartedAt, step, winner]);

  return (
    <div className="race-course-viewport">
      <div
        ref={worldTrackRef}
        className="race-world-track"
        style={{ width: `${RACE_BACKGROUND_TRACK_WIDTH_PX}px` }}
        data-world-travel-percent="0.000"
      >
        <div className="race-scenery-track" aria-hidden="true">
          {RACE_BACKGROUND_SEQUENCE.map((scene, index) => (
            <div
              className={`race-scenery-panel race-scenery-panel-${index}`}
              key={scene.id}
              data-scene-id={scene.id}
              data-destination={scene.isDestination || undefined}
              style={{ '--race-scene-aspect-ratio': scene.aspectRatio } as CSSProperties}
            >
              <img className="race-scenery-image" src={`${RACE_BACKGROUND_BASE}/${scene.file}`} alt="" draggable="false" />
            </div>
          ))}
        </div>
        <div className="race-course-road">
          {race.obstacles.map((obstacle, obstacleIndex) => (
            <span
              className={`race-obstacle race-obstacle-${obstacle.kind}`}
              style={{
                left: getRaceObstacleLeftCss(obstacleIndex),
                ...(getRaceObstacleBottomPx(obstacleIndex) === undefined
                  ? {}
                  : { bottom: `${getRaceObstacleBottomPx(obstacleIndex)}px` }),
              }}
              key={obstacle.id}
              title={obstacle.label}
              aria-hidden="true"
            >
              <span className="race-obstacle-art"><img src={obstacle.imageSrc} alt="" draggable="false" /></span>
            </span>
          ))}
          {contestants.map((persona) => <div className="race-lane" key={persona.id} />)}
        </div>
        <div
          className="race-finish-marker race-finish-marker-main"
          style={{
            '--race-finish-marker-angle': `${RACE_BACKGROUND_FINISH_MARKER_ANGLE_DEG}deg`,
            '--race-finish-marker-road-length': `${RACE_BACKGROUND_FINISH_MARKER_ROAD_LENGTH_PX}px`,
            '--race-finish-marker-road-top': `${RACE_BACKGROUND_FINISH_MARKER_ROAD_TOP_PX}px`,
            left: `${RACE_BACKGROUND_FINISH_MARKER_X_PX}px`,
          } as CSSProperties}
           data-finish-anchor={RACE_BACKGROUND_FINISH_SCREEN_ANCHOR_PERCENT}
          aria-label="Finish line"
        />
      </div>
      <div className="race-runner-overlay">
        {contestants.map((persona, index) => {
          const presentation = presentations[index];
          if (!presentation) return null;
          const stageAnchors = stageRunnerAnchors[step === 'intro' ? 'intro' : 'finale'];
          return (
            <div
              className="race-runner-lane"
              key={persona.id}
              data-persona-id={persona.id}
              data-obstacle-index={presentation.obstacleIndex}
              data-runner-reaction={presentation.reaction}
              data-finish-crossing-ms={raceLanes[index]?.finishCrossingMs ?? undefined}
              data-finish-order-index={race.finishOrder.indexOf(persona.id)}
              data-reaction-windows={JSON.stringify(raceLanes[index]?.reactionWindows ?? [])}
            >
              <div
                className="race-runner"
                ref={(element) => { runnerRefs.current[index] = element; }}
                style={{
                  '--race-intro-anchor': `${stageAnchors?.[index] ?? 50}%`,
                  '--race-warmup-anchor': `${stageRunnerAnchors.warmup[index] ?? 50}%`,
                  '--race-matchup-anchor': `${stageRunnerAnchors.matchup[index] ?? 50}%`,
                  '--race-finale-anchor': `${stageRunnerAnchors.finale[index] ?? 50}%`,
                  transform: `translate3d(${presentation.anchor / 100 * RACE_CANVAS_WIDTH_PX - RACE_RUNNER_RENDER_WIDTH_PX / 2}px, 0, 0)`,
                } as CSSProperties}
              >
                <span className="race-runner-sprite">
                  <MovementSprite
                    persona={persona}
                    action={presentation.action}
                    animationKey={presentation.animationKey}
                    speedMultiplier={presentation.speedMultiplier}
                    scaleMultiplier={persona.id === 'panko' ? 0.8 : undefined}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

function ContestOverlay({ contestants, winner, step, contestName, memorableEvent, race, finishLineVisible, finishCrossed, contestStartedAt, raceStartedAt, announcerResetKey, onAnnouncerBeat, onRaceStart, onSkip, onClose }: { contestants: Persona[]; winner: Persona | null; step: ContestStep; contestName: string; memorableEvent: string; race: RaceSimulation; finishLineVisible: boolean; finishCrossed: boolean; contestStartedAt: number | null; raceStartedAt: number | null; announcerResetKey: number; onAnnouncerBeat: (label: string) => void; onRaceStart: () => void; onSkip: () => void; onClose: () => void }) {
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
  const [announcedContestantCount, setAnnouncedContestantCount] = useState(0);
  const [announcementCardsVisible, setAnnouncementCardsVisible] = useState(false);
  const [raceStartGraphicVisible, setRaceStartGraphicVisible] = useState(false);
  const [announcementStatus, setAnnouncementStatus] = useState('Tonight’s contestants are waiting behind the curtain.');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
    deadlineAt: number;
    resume: () => Promise<void>;
    cancel: () => void;
  } | null>(null);
  const announcerAudioReadyAt = useRef(0);
  const spokenBeatIds = useRef(new Set<string>());
  const announcerSessionStartedAt = useRef<number | null>(null);
  const announcerSessionResetKey = useRef<number | null>(null);
  useEffect(() => {
    const movementActions: MovementAction[] = ['idle', 'walk', 'run', 'jump', 'fall', 'victory'];
    contestants.forEach((persona) => {
      movementActions.forEach((action) => {
        const spriteSheet = getMovementSpriteSheet(persona.id, action);
        if (!spriteSheet) return;
        const image = new Image();
        image.decoding = 'async';
        image.src = spriteSheet.src;
      });
    });
  }, [contestants]);
  const announcerSequence = useMemo(() => buildAnnouncerSequence(contestants, race, prefersReducedMotion), [contestants, race, prefersReducedMotion]);
  const announcerBeatCallback = useRef(onAnnouncerBeat);
  announcerBeatCallback.current = onAnnouncerBeat;
  const raceStartCallback = useRef(onRaceStart);
  raceStartCallback.current = onRaceStart;
  const contestantAnnouncedCallback = useRef<(personaId: string) => void>(() => undefined);
  contestantAnnouncedCallback.current = (personaId) => {
    const index = contestants.findIndex((persona) => persona.id === personaId);
    const persona = contestants[index];
    if (!persona) return;
    setAnnouncedContestantCount((current) => Math.max(current, index + 1));
    setAnnouncementCardsVisible(true);
    setAnnouncementStatus(`${persona.name} is taking a place beneath the lanterns.`);
    setSpokenBeatLabel(persona.name);
    announcerBeatCallback.current(persona.name);
  };
  const announcementCompleteCallback = useRef<() => void>(() => undefined);
  announcementCompleteCallback.current = () => {
    setAnnouncementCardsVisible(false);
    setRaceStartGraphicVisible(false);
    setAnnouncementStatus('The roster is set. The race is about to start.');
    setSpokenBeatLabel('The race is about to start');
    raceStartCallback.current();
  };
  const raceStartGraphicCallback = useRef<() => void>(() => undefined);
  raceStartGraphicCallback.current = () => {
    setAnnouncementCardsVisible(false);
    setRaceStartGraphicVisible(true);
    setAnnouncementStatus('The roster is set. The race is about to start.');
    setSpokenBeatLabel('The race is about to start');
  };
  const announcementTimeline = useMemo(() => {
    const introBeat = announcerSequence.find((beat) => beat.id === 'intro-opening');
    const nameClips = introBeat?.clips.slice(1, contestants.length + 1) ?? [];
    const offsets = getRaceAnnouncementRevealOffsets(
      introBeat?.clips[0]?.durationMs ?? 0,
      nameClips.map((clip) => clip?.durationMs ?? 900),
      introBeat?.gapAfterMs ?? NAME_ANNOUNCER_GAP_MS,
    );
    return contestants.map((persona, index) => ({
      persona,
      offset: (introBeat?.offset ?? 0) + (offsets[index] ?? 0),
    }));
  }, [announcerSequence, contestants]);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);
  useEffect(() => {
    if (finishLineVisible) setSpokenBeatLabel('Finish in sight');
  }, [finishLineVisible]);
  useEffect(() => {
    setAnnouncedContestantCount(0);
    setAnnouncementCardsVisible(false);
    setRaceStartGraphicVisible(false);
    setAnnouncementStatus('Tonight’s contestants are waiting behind the curtain.');
    if (step !== 'intro' || !contestStartedAt || !contestants.length) return;
    const startedAt = contestStartedAt;
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, Math.max(0, delay));
      timers.push(timer);
    };

    schedule(() => {
      setAnnouncementStatus('Tonight’s contestants are');
      setSpokenBeatLabel('Tonight’s contestants are');
    }, 0);

    // With voice enabled, the announcer effect below reveals each card from
    // the name clip's actual playback start. A muted contest has no playback
    // event, so retain a deterministic visual fallback for that mode.
    if (!voiceEnabled) {
      announcementTimeline.forEach(({ persona, offset }) => {
        schedule(() => contestantAnnouncedCallback.current(persona.id), startedAt + offset - Date.now());
      });
      const raceStartBeat = announcerSequence.find((beat) => beat.id === 'race-start');
      if (raceStartBeat) {
        schedule(
          () => raceStartGraphicCallback.current(),
          startedAt + raceStartBeat.offset - Date.now(),
        );
        schedule(
          () => announcementCompleteCallback.current(),
          startedAt + raceStartBeat.offset + raceStartBeat.clips[0].durationMs + MIN_ANNOUNCER_GAP_MS - Date.now(),
        );
      }
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [announcementTimeline, announcerSequence, contestStartedAt, contestants.length, step, voiceEnabled]);
  const [raceContactState, setRaceContactState] = useState<number[]>(() => contestants.map(() => -1));
  const raceFrameStateCallback = useRef<(obstacleIndexes: number[]) => void>(() => undefined);
  raceFrameStateCallback.current = (obstacleIndexes) => {
    setRaceContactState((current) => (
      current.length === obstacleIndexes.length
        && current.every((index, position) => index === obstacleIndexes[position])
        ? current
        : obstacleIndexes
    ));
  };
  const currentObstacleIndex = step === 'intro'
    ? -1
    : Math.max(-1, ...raceContactState);
  const currentObstacle = currentObstacleIndex >= 0 ? race.obstacles[currentObstacleIndex] : null;
  const currentObstacleCopy = currentObstacle
    ? `${currentObstacle.label}: ${currentObstacle.description}`
    : 'The route is being set. Four trouble spots are waiting beyond the starting lantern.';
  const isAnnouncementPhase = step === 'intro' && !finishCrossed;
  const showRaceStartGraphic = isAnnouncementPhase && raceStartGraphicVisible;
  const displayedContestants = isAnnouncementPhase && announcementCardsVisible
    ? contestants.slice(0, announcedContestantCount)
    : [];
  const toggleVoice = () => {
    if (voiceEnabled && audioNeedsGesture && pendingAudio.current) {
      const pending = pendingAudio.current;
      const durationMs = Number.isFinite(pending.audio.duration)
        ? pending.audio.duration * 1000
        : pending.beat.clips[pending.clipIndex]?.durationMs ?? 2000;
      if (Date.now() + durationMs > pending.deadlineAt) {
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
    const timer = window.setTimeout(() => setShowWinnerReveal(true), speedUpDurationMs(2600));
    return () => window.clearTimeout(timer);
  }, [step, winner]);

  useEffect(() => {
    // A reset is used by Skip scene to start the winner call from the
    // interruption point instead of waiting for the original race clock.
    if (announcerSessionResetKey.current !== announcerResetKey || !announcerSessionStartedAt.current) {
      announcerSessionStartedAt.current = announcerResetKey > 0 ? Date.now() : (contestStartedAt ?? Date.now());
      announcerSessionResetKey.current = announcerResetKey;
    }
    const startedAt = announcerSessionStartedAt.current;
    const raceStartAnchor = raceStartedAt;
    const getBeatSchedule = (beat: AnnouncerBeat) => {
      if (announcerResetKey > 0) {
        if (beat.step !== 'winner') return null;
        return {
          startAt: startedAt + beat.offset,
          deadlineAt: startedAt + beat.deadlineOffset,
          offset: beat.offset,
        };
      }

      if (beat.step === 'intro') {
        // The intro is driven by the contest-open clock. Once the starting
        // lantern has handed off to the race, never replay stale intro beats.
        if (!contestStartedAt || raceStartAnchor) return null;
        return {
          startAt: contestStartedAt + beat.offset,
          deadlineAt: contestStartedAt + beat.deadlineOffset,
          offset: beat.offset,
        };
      }

      if (!raceStartAnchor) return null;
      if (beat.step === 'winner') {
        const winnerRelativeStart = getRaceAnnouncerBeatStartOffset(
          'winner',
          beat.offset,
          getRacePlaybackFinishCrossingMs(race, prefersReducedMotion),
          FINISH_CROSSING_SETTLE_MS,
        );
        const winnerRelativeDeadline = getRaceAnnouncerBeatStartOffset(
          'winner',
          beat.deadlineOffset,
          getRacePlaybackFinishCrossingMs(race, prefersReducedMotion),
          FINISH_CROSSING_SETTLE_MS,
        );
        return {
          startAt: raceStartAnchor + winnerRelativeStart,
          deadlineAt: raceStartAnchor + winnerRelativeDeadline,
          offset: winnerRelativeStart,
        };
      }
      const timelineStage = beat.timelineStage ?? 'warmup';
      const raceRelativeBase = getRaceAnnouncerBeatStartOffset(
        timelineStage,
        0,
        getRacePlaybackFinishCrossingMs(race, prefersReducedMotion),
        FINISH_CROSSING_SETTLE_MS,
      );
      const raceRelativeDeadline = getRaceAnnouncerBeatStartOffset(
        timelineStage,
        beat.deadlineOffset,
        getRacePlaybackFinishCrossingMs(race, prefersReducedMotion),
        FINISH_CROSSING_SETTLE_MS,
      );
      return {
        startAt: raceStartAnchor + getRaceAnnouncerBeatStartOffset(
          timelineStage,
          beat.offset,
          getRacePlaybackFinishCrossingMs(race, prefersReducedMotion),
          FINISH_CROSSING_SETTLE_MS,
        ),
        deadlineAt: raceStartAnchor + raceRelativeDeadline,
        offset: raceRelativeBase + beat.offset,
      };
    };
    const beats = announcerSequence
      .map((beat) => {
        const schedule = getBeatSchedule(beat);
        return schedule ? { beat, ...schedule } : null;
      })
      .filter((scheduled): scheduled is {
        beat: AnnouncerBeat;
        startAt: number;
        deadlineAt: number;
        offset: number;
      } => Boolean(scheduled))
      .sort((a, b) => a.offset - b.offset);
    const timers: number[] = [];
    const pendingBeatIds = new Set(beats.map(({ beat }) => beat.id));
    const beatOffsets = new Map(beats.map(({ beat, offset }) => [beat.id, offset]));
    const beatDeadlines = new Map(beats.map(({ beat, deadlineAt }) => [beat.id, deadlineAt]));
    let cancelled = false;
    let activeBeat: { beat: AnnouncerBeat; clipIndex: number } | null = null;
    const metadataAudio = new Map<string, HTMLAudioElement>();
    const metadataDurations = new Map<string, number>();
    const failedSources = new Set<string>();
    const announcedNameClips = new Set<string>();

    const announceNameClip = (clip: AnnouncerClip) => {
      const prefix = 'character-names/';
      if (!clip.id.startsWith(prefix) || announcedNameClips.has(clip.id)) return;
      announcedNameClips.add(clip.id);
      contestantAnnouncedCallback.current(clip.id.slice(prefix.length));
    };
    const announceRaceStartClip = (clip: AnnouncerClip) => {
      if (clip.id === 'race-starts/race-start-quiet-kitchen') {
        raceStartGraphicCallback.current();
      }
    };

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
      return beatDeadlines.get(beat.id) ?? Number.NEGATIVE_INFINITY;
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

    const isObstacleBeat = (beat: AnnouncerBeat) => (
      beat.id.startsWith('obstacle-callout-')
      || beat.id.startsWith('obstacle-reaction-')
    );
    const hasPendingEarlierObstacleCallout = (beat: AnnouncerBeat) => {
      const beatOffset = beatOffsets.get(beat.id) ?? Number.POSITIVE_INFINITY;
      return beats.some(({ beat: candidate, offset }) => (
        candidate.id.startsWith('obstacle-callout-')
        && pendingBeatIds.has(candidate.id)
        && offset <= beatOffset
      ));
    };

    function playClip(beat: AnnouncerBeat, clipIndex: number) {
      if (cancelled || !voiceEnabled || activeBeat?.beat !== beat) return;
      const clip = beat.clips[clipIndex];
      if (!clip) {
        finishBeat(beat);
        return;
      }
      announceRaceStartClip(clip);
      if (failedSources.has(clip.src) || !fitsBeforeDeadline(beat, clip, Date.now())) {
        if (beat.id === 'race-start') {
          schedule(
            () => announcementCompleteCallback.current(),
            getRaceAnnouncementCompletionDelay(clip.durationMs, MIN_ANNOUNCER_GAP_MS),
          );
        }
        announceNameClip(clip);
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
      const continueBeat = (
        gapAfterClip = beat.clipGapsAfterMs?.[clipIndex] ?? beat.gapAfterMs ?? MIN_ANNOUNCER_GAP_MS,
        announcementCompletionDelay = gapAfterClip,
      ) => {
        if (cancelled || announcerAudio.current !== audio) return;
        pendingAudio.current = null;
        announcerAudio.current = null;
        announcerAudioReadyAt.current = Date.now() + gapAfterClip;
        if (beat.id === 'race-start' && clipIndex === beat.clips.length - 1) {
          schedule(() => announcementCompleteCallback.current(), announcementCompletionDelay);
        }
        schedule(() => skipClip(beat, clipIndex), gapAfterClip);
      };
      audio.addEventListener('ended', () => continueBeat(), { once: true });
      audio.addEventListener('error', () => {
        announceNameClip(clip);
        if (beat.id === 'race-start') {
          continueBeat(
            MIN_ANNOUNCER_GAP_MS,
            getRaceAnnouncementCompletionDelay(clip.durationMs, MIN_ANNOUNCER_GAP_MS),
          );
          return;
        }
        continueBeat();
      }, { once: true });
      pendingAudio.current = {
        audio,
        beat,
        clipIndex,
        deadlineAt: deadlineFor(beat),
        resume: () => audio.play(),
        cancel: () => skipClip(beat, clipIndex),
      };
      void audio.play()
        .then(() => {
          if (!cancelled) {
            setAudioNeedsGesture(false);
            spokenBeatIds.current.add(beat.id);
             announceNameClip(clip);
          }
        })
        .catch(() => {
           if (cancelled) return;
           announceNameClip(clip);
           if (!audio.error && audio.readyState > 0) setAudioNeedsGesture(true);
           // A blocked autoplay attempt must not stall the roster. Treat the
           // clip as unavailable and use the same deterministic fallback as
           // muted mode for the race-start handoff.
           if (beat.id === 'race-start') {
             continueBeat(
               MIN_ANNOUNCER_GAP_MS,
               getRaceAnnouncementCompletionDelay(clip.durationMs, MIN_ANNOUNCER_GAP_MS),
             );
           } else {
             continueBeat();
           }
        });
    }

    const startBeat = (beat: AnnouncerBeat) => {
      if (cancelled || !voiceEnabled || spokenBeatIds.current.has(beat.id) || !beat.clips.length) {
        pendingBeatIds.delete(beat.id);
        return;
      }
      // Stage and pace lines are optional context. Do not let them occupy
      // the announcer while an earlier obstacle is waiting for its entry
      // callout; the callout is what establishes the spectator's timeline.
      if (!isObstacleBeat(beat) && hasPendingEarlierObstacleCallout(beat)) {
        pendingBeatIds.delete(beat.id);
        return;
      }
      // Beats never wait in a queue: a busy announcer or a missed deadline
      // means this optional line is skipped so the visual race stays primary.
      if (activeBeat || pendingAudio.current || Date.now() > deadlineFor(beat)) {
        // Hazard callouts and contact reactions are the race's ordered beats.
        // Retry them while the announcer is busy instead of letting a stage
        // transition or a preceding line erase the obstacle story.
        if (isObstacleBeat(beat) && Date.now() <= deadlineFor(beat)) {
          schedule(() => startBeat(beat), 120);
          return;
        }
        if (beat.id === 'race-start' && Date.now() <= deadlineFor(beat)) {
          schedule(() => startBeat(beat), 120);
          return;
        }
        if (beat.id === 'race-start') {
          raceStartGraphicCallback.current();
          schedule(
            () => announcementCompleteCallback.current(),
            getRaceAnnouncementCompletionDelay(
              beat.clips[0]?.durationMs ?? 0,
              MIN_ANNOUNCER_GAP_MS,
            ),
          );
        }
        pendingBeatIds.delete(beat.id);
        return;
      }
      activeBeat = { beat, clipIndex: 0 };
      playClip(beat, 0);
    };

    if (voiceEnabled) {
      beats.forEach(({ beat, startAt }) => {
        schedule(() => startBeat(beat), Math.max(0, startAt - Date.now()));
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
  }, [announcerResetKey, announcerSequence, contestStartedAt, prefersReducedMotion, raceStartedAt, voiceEnabled]);

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
    <div className="contest-backdrop contest-race-backdrop fixed inset-0 z-30 flex items-stretch justify-center" role="dialog" aria-modal="true" aria-labelledby="contest-title">
      <div className="contest-stage w-full p-3 sm:p-5">
        <div className="contest-header">
          <h2 id="contest-title" className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{contestName}</h2>
          <button type="button" className="flex items-center gap-2 border border-[#806a85] px-3 py-2 text-xs font-bold text-[#f8e7c6] hover:bg-[#f5c968] hover:text-[#30223c]" onClick={onSkip} data-testid="button-skip-contest"><SkipForward className="h-4 w-4" aria-hidden="true" />Skip scene</button>
        </div>
        {isAnnouncementPhase && !showRaceStartGraphic ? (
          <section className="contest-announcement" aria-labelledby="contest-announcement-title">
            <div className="contest-announcement-copy" role="status" aria-live="polite">
              <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#f5c968]">line-up call</span>
              <h3 id="contest-announcement-title" className="font-display text-5xl font-bold tracking-tight">Tonight’s contestants are</h3>
              <p>{announcementStatus}</p>
            </div>
            <div className="contest-announcement-cards" aria-label="Announced contestants">
              {displayedContestants.map((persona, index) => (
                <div key={persona.id} className="contest-announcement-card persona-tile rounded-lg p-4 text-center" data-testid={`card-contestant-${persona.id}`}>
                  <PersonaPortrait persona={persona} large />
                  <h4 className="font-display text-lg font-bold">{persona.name}</h4>
                  <p className="mt-1 min-h-10 text-xs leading-4 text-[#765752]">{persona.flavorText}</p>
                  <div className="mt-3 font-mono-ui text-[9px] uppercase tracking-wider text-[#a34d43]">{index === displayedContestants.length - 1 ? 'just announced' : 'on the line'}</div>
                </div>
              ))}
            </div>
          </section>
        ) : (
        <div
          className={`contest-race contest-race-${step}`}
          data-finish-visible={finishLineVisible || undefined}
          data-finish-crossed={finishCrossed || undefined}
          data-race-winner-id={race.winnerId}
          data-race-initial-order={JSON.stringify(race.lanes
            .slice()
            .sort((a, b) => b.positions.intro - a.positions.intro)
            .map((lane) => lane.personaId))}
          data-race-initial-gap={Math.max(...race.lanes.map((lane) => lane.positions.intro)) - Math.min(...race.lanes.map((lane) => lane.positions.intro))}
          data-race-checkpoint-leaders={JSON.stringify(race.checkpointLeaders)}
          data-race-lead-changes={JSON.stringify(race.leadChanges)}
           data-race-plan-ready="true"
           data-race-obstacle-order={JSON.stringify(race.obstacles.map((obstacle) => obstacle.id))}
           data-race-finish-order={JSON.stringify(race.finishOrder)}
           data-race-finish-crossings={JSON.stringify(race.finishCrossings)}
            data-race-duration-ms={RACE_RACE_DURATION_MS}
            data-race-background-end-percent={RACE_FINALE_WORLD_END_PERCENT}
            data-race-playback-finish-crossing-ms={race.finishCrossingMs}
            data-race-runner-finish-anchor={RACE_RUNNER_SCREEN_MAX_PERCENT}
            data-race-runner-leading-edge-offset={RACE_RUNNER_LEADING_EDGE_OFFSET_PERCENT}
           data-race-reaction-plan={JSON.stringify(Object.fromEntries(race.lanes.map((lane) => [
             lane.personaId,
              lane.reactionWindows.map((window) => ({
                ...window,
                result: lane.encounters[window.obstacleId]?.result,
                reaction: lane.encounters[window.obstacleId]?.reaction,
              })),
           ])))}
            data-race-trace={JSON.stringify({
              finishOrder: race.finishOrder,
              finishCrossings: race.finishCrossings,
              obstacles: race.obstacles.map(({ id, kind, position }) => ({ id, kind, position })),
              lanes: race.lanes.map((lane) => ({
                personaId: lane.personaId,
                finishCrossingMs: lane.finishCrossingMs,
                trajectoryPoints: lane.trajectory.length,
                encounters: lane.encounters,
              })),
            })}
          aria-label="Animated contest race"
        >
          {showRaceStartGraphic && (
            <section className="contest-start-graphic" aria-labelledby="contest-start-title">
              <div className="contest-start-graphic-lantern" aria-hidden="true">✦</div>
              <span className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-[#f5c968]">starting lantern</span>
              <h3 id="contest-start-title" className="font-display text-6xl font-bold tracking-tight">Race is about to start</h3>
              <p>{announcementStatus}</p>
              <div className="contest-start-graphic-rule" aria-hidden="true"><span>READY</span><i /><span>SET</span><i /><span>GO</span></div>
            </section>
          )}
          <div className="race-track-label font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#bca99b]"><span>start</span><span>finish</span></div>
           <RaceLiveRenderer
             contestants={contestants}
             winner={winner}
             step={step}
             race={race}
             finishCrossed={finishCrossed}
             raceStartedAt={raceStartedAt}
             prefersReducedMotion={prefersReducedMotion}
             onFrameState={(obstacleIndexes) => raceFrameStateCallback.current(obstacleIndexes)}
           />
          {SHOW_RACE_COURSE_REPORT && (
            <>
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
              {contestants.map((persona, index) => {
                const lane = race.lanes.find((candidate) => candidate.personaId === persona.id);
                 const laneCurrentObstacleIndex = raceContactState[index] ?? -1;
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
            </>
          )}
        </div>
        )}
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
        {winner && <button type="button" onClick={onClose} className="contest-close-button flex items-center gap-2 bg-[#f5c968] px-5 py-3 text-sm font-extrabold text-[#30223c] shadow-[4px_4px_0_#17121e] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none" data-testid="button-close-contest">Return to the stall <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>}
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
  const [collectibles, setCollectibles] = useStoredState<Collectible[]>(CURIO_KEY, [], (saved) => saved.filter((item) => Boolean(item.imageSrc)));
  const [curioPlacements, setCurioPlacements] = useStoredState<CurioShelfPlacementMap>(CURIO_PLACEMENTS_KEY, {}, normalizeCurioPlacements);
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
  const { isDebugMode, initialShowcaseEnabled } = getCurioDebugState(window.location.search);
  const raceCheckMode = useMemo(() => new URLSearchParams(window.location.search).get('raceCheck'), []);
  const [isCurioShowcaseEnabled, setIsCurioShowcaseEnabled] = useState(initialShowcaseEnabled);
  const holdTimer = useRef<number | null>(null);
  const contestTimer = useRef<number | null>(null);
  const finishTransitionTimer = useRef<number | null>(null);
  const contestIntroStartedAt = useRef<number | null>(null);
  const contestRaceStartedAt = useRef<number | null>(null);
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
  const shelfPreviewCollectibles = useMemo(
    () => selectRestaurantShelfCollectibles(collectibles, showcaseCollectibles, {
      isDebugMode,
      showcaseEnabled: isCurioShowcaseEnabled,
      maxItems: CURIO_SHELF_GRID.cellCount,
    }),
    [collectibles, isCurioShowcaseEnabled, isDebugMode],
  );
  const earnedShelfCurioIds = useMemo(
    () => getRestaurantShelfItems(collectibles).map((item) => item.id),
    [collectibles],
  );
  const previewShelfCurioIds = useMemo(
    () => getRestaurantShelfItems(shelfPreviewCollectibles).map((item) => item.id),
    [shelfPreviewCollectibles],
  );
  const previewCurioPlacements = useMemo(
    () => isCurioShowcaseEnabled
      ? reconcileCurioPlacements(previewShelfCurioIds, curioPlacements, () => 0.37)
      : curioPlacements,
    [curioPlacements, isCurioShowcaseEnabled, previewShelfCurioIds],
  );
  const showRestaurantCurios = collectibles.length > 0 || ledger.length > 0 || Boolean(winner) || isCurioShowcaseEnabled;

  useEffect(() => {
    setCurioPlacements((current) => {
      const next = reconcileCurioPlacements(earnedShelfCurioIds, current);
      return curioPlacementsEqual(current, next) ? current : next;
    });
  }, [earnedShelfCurioIds, setCurioPlacements]);

  useEffect(() => {
    setCollectibles((current) => {
      const showcaseById = new Map(showcaseCollectibles.map((item) => [item.id, item]));
      const refreshed = current.map((item) => {
        const template = showcaseById.get(item.id);
        return template ? { ...item, kind: template.kind, title: template.title, description: template.description, earnedBy: template.earnedBy, imageSrc: template.imageSrc, artVariant: template.artVariant } : item;
      });
      const needsRefresh = refreshed.some((item, index) => item !== current[index]);
      return needsRefresh ? refreshed : current;
    });
  }, [setCollectibles]);

  const queueContest = (message: string) => {
    if (contestOpen || contestQueued.current) return;
    contestQueued.current = true;
    setLiveStatus(message);
    // Open the overlay on the same turn as the meter action so the announcer
    // can begin its first clip immediately after the dialog mounts.
    window.setTimeout(launchContest, speedUpDurationMs(0));
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
    contestRaceStartedAt.current = null;
    contestOutcome.current = null;
    contestQueued.current = false;
    finishCrossedRef.current = false;
  };
  finishContestRef.current = finishContest;

  const launchContest = () => {
    const isRaceReversalCheck = raceCheckMode === '109';
    const seed = isRaceReversalCheck ? 1 : Date.now() ^ Math.floor(Math.random() * 0xffffffff);
    const rng = createRng(seed);
    const selected = isRaceReversalCheck
      ? ['pip', 'sencha', 'nori']
        .map((id) => spriteSheetContestants.find((persona) => persona.id === id))
        .filter((persona): persona is Persona => Boolean(persona))
      : selectContestants(spriteSheetContestants, lastWinner?.id, rng, 3);
    const outcome = resolveContest(
      selected,
      rng,
      isRaceReversalCheck ? { startingOffsets: [6, 0, 0] } : undefined,
    );
    contestOutcome.current = outcome;
    completionGuard.current = false;
    contestIntroStartedAt.current = Date.now();
    contestRaceStartedAt.current = null;
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
    window.setTimeout(() => setMeterPulse(false), speedUpDurationMs(420));
    if (foodSplashTimer.current) window.clearTimeout(foodSplashTimer.current);
    setFoodSplash({ item, key: foodSplashSequence.current + 1 });
    foodSplashSequence.current += 1;
    foodSplashTimer.current = window.setTimeout(() => {
      setFoodSplash(null);
      foodSplashTimer.current = null;
    }, speedUpDurationMs(12600));
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
      queueContest('The bento hums warmly. The Mystery Bento Meter is full.');
    }, speedUpDurationMs(1500));
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
    window.setTimeout(() => setMeterPulse(false), speedUpDurationMs(420));
    queueContest('The bento hums warmly. The Mystery Bento Meter is full.');
  };
  const skipContest = () => {
    if (completionGuard.current) return;
    const resolvedOutcome = contestOutcome.current;
    if (!resolvedOutcome) return;
    const winningPersona = resolvedOutcome.winner;
    setFinishLineVisible(true);
    finishCrossedRef.current = true;
    setFinishCrossed(true);
    setWinner(winningPersona);
    setContestStep('winner');
    setAnnouncerResetKey((current) => current + 1);
    setLiveStatus(`${winningPersona.name} crosses the finish line. The stall is revealing the result.`);
  };
  const startRace = () => {
    if (!contestOpen || contestRaceStartedAt.current || completionGuard.current) return;
    contestRaceStartedAt.current = Date.now();
    setContestStep('race');
    setLiveStatus('The race is underway. The first hazard is already coming into view.');
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
    if (contestStep === 'intro' && !contestRaceStartedAt.current) return;
    const race = contestOutcome.current?.race;
    if (!race) return;
    if (contestStep !== 'race') return;
    const startedAt = contestRaceStartedAt.current ?? contestIntroStartedAt.current ?? Date.now();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    contestTimer.current = window.setTimeout(() => {
      if (finishLineVisible || finishCrossedRef.current) return;
      setFinishLineVisible(true);
      setLiveStatus('The finish line is in sight. The last crossing is being settled.');
      const finishCrossingAt = getRaceFinishCrossingAt(startedAt, race, prefersReducedMotion);
      finishTransitionTimer.current = window.setTimeout(() => {
        if (!contestOpen || completionGuard.current || finishCrossedRef.current) return;
        finishCrossedRef.current = true;
        setFinishCrossed(true);
        finishTransitionTimer.current = window.setTimeout(() => {
          if (!contestOpen || completionGuard.current) return;
          const outcome = contestOutcome.current;
          if (!outcome) return;
          setWinner(outcome.winner);
          setContestStep('winner');
          setLiveStatus(`${outcome.memorableEvent} ${outcome.winner.name} wins.`);
        }, FINISH_CROSSING_SETTLE_MS);
      }, Math.max(0, finishCrossingAt - Date.now()) + FINISH_CROSSING_SETTLE_MS);
    }, Math.max(0, getRaceFinishVisibleAt(startedAt, race, prefersReducedMotion) - Date.now()));
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
    setCurioPlacements({});
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
                ) : null}
              </div>
            </div>
          )}
          {showRestaurantCurios && <RestaurantCurioDisplays collectibles={shelfPreviewCollectibles} placements={previewCurioPlacements} />}
          <div className="scene-content">
            <div className="restaurant-top-zone">
              <RestaurantControls
                onOpenCurio={setCurioView}
                ledgerCount={ledger.length}
                curioCount={collectibles.length}
                isDebugMode={isDebugMode}
                isCurioShowcaseEnabled={isCurioShowcaseEnabled}
                onCurioShowcaseChange={setIsCurioShowcaseEnabled}
              />
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
      {contestOpen && contestOutcome.current && <ContestOverlay contestants={contestants} winner={winner} step={contestStep} contestName={contestOutcome.current.contestName} memorableEvent={contestOutcome.current.memorableEvent} race={contestOutcome.current.race} finishLineVisible={finishLineVisible} finishCrossed={finishCrossed} contestStartedAt={contestIntroStartedAt.current} raceStartedAt={contestRaceStartedAt.current} announcerResetKey={announcerResetKey} onAnnouncerBeat={(label) => setLiveStatus(`Announcer: ${label}.`)} onRaceStart={startRace} onSkip={skipContest} onClose={finishContest} />}
      {curioView && <CurioOverlay view={curioView} ledger={ledger} collectibles={collectibles} onClose={() => setCurioView(null)} onReset={resetMemory} />}
      <span className="sr-only">{selectedCount ? `${selectedCount} memories kept nearby` : 'local memory is empty'}</span>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/race-track-debug" component={RaceTrackDebugPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
