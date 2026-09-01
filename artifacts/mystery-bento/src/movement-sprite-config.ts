import bibiIdle from './assets/contestants/movement/bibi-idle.png';
import bibiJump from './assets/contestants/movement/bibi-jump.png';
import bibiRun from './assets/contestants/movement/bibi-run.png';
import bibiWalk from './assets/contestants/movement/bibi-walk.png';
import toroIdle from './assets/contestants/movement/toro-idle.png';
import toroJump from './assets/contestants/movement/toro-jump.png';
import toroRun from './assets/contestants/movement/toro-run.png';
import toroWalk from './assets/contestants/movement/toro-walk.png';
import kikuIdle from './assets/contestants/movement/kiku-idle.png';
import kikuJump from './assets/contestants/movement/kiku-jump.png';
import kikuRun from './assets/contestants/movement/kiku-run.png';
import kikuWalk from './assets/contestants/movement/kiku-walk.png';
import misoIdle from './assets/contestants/movement/miso-idle.png';
import misoJump from './assets/contestants/movement/miso-jump.png';
import misoRun from './assets/contestants/movement/miso-run.png';
import misoWalk from './assets/contestants/movement/miso-walk.png';
import noriIdle from './assets/contestants/movement/nori-idle.png';
import noriJump from './assets/contestants/movement/nori-jump.png';
import noriRun from './assets/contestants/movement/nori-run.png';
import noriWalk from './assets/contestants/movement/nori-walk.png';
import pankoIdle from './assets/contestants/movement/panko-idle.png';
import pankoJump from './assets/contestants/movement/panko-jump.png';
import pankoRun from './assets/contestants/movement/panko-run.png';
import pankoWalk from './assets/contestants/movement/panko-walk.png';
import rolloIdle from './assets/contestants/movement/rollo-idle.png';
import rolloJump from './assets/contestants/movement/rollo-jump.png';
import rolloRun from './assets/contestants/movement/rollo-run.png';
import rolloWalk from './assets/contestants/movement/rollo-walk.png';
import saffyIdle from './assets/contestants/movement/saffy-idle.png';
import saffyJump from './assets/contestants/movement/saffy-jump.png';
import saffyRun from './assets/contestants/movement/saffy-run.png';
import saffyWalk from './assets/contestants/movement/saffy-walk.png';
import tildaIdle from './assets/contestants/movement/tilda-idle.png';
import tildaJump from './assets/contestants/movement/tilda-jump.png';
import tildaRun from './assets/contestants/movement/tilda-run.png';
import tildaWalk from './assets/contestants/movement/tilda-walk.png';
import umaIdle from './assets/contestants/movement/uma-idle.png';
import umaJump from './assets/contestants/movement/uma-jump.png';
import umaRun from './assets/contestants/movement/uma-run.png';
import umaWalk from './assets/contestants/movement/uma-walk.png';
import senchaIdle from './assets/contestants/movement/sencha-idle.png';
import senchaJump from './assets/contestants/movement/sencha-jump.png';
import senchaRun from './assets/contestants/movement/sencha-run.png';
import senchaWalk from './assets/contestants/movement/sencha-walk.png';

export type MovementAction = 'idle' | 'walk' | 'run' | 'jump';

export type MovementSpriteSheet = {
  src: string;
  columns: number;
  rows: number;
  frameCount: number;
  frameDurationMs: number;
};

const MOVEMENT_FRAME_DURATION_MS = 1000 / 12;

function sheet(
  src: string,
  columns: number,
  rows: number,
  frameCount: number,
): MovementSpriteSheet {
  return {
    src,
    columns,
    rows,
    frameCount,
    frameDurationMs: MOVEMENT_FRAME_DURATION_MS,
  };
}

type MovementSet = Partial<Record<MovementAction, MovementSpriteSheet>>;

// The source sheets retain their transparent pixels. Every entry records the
// square cell grid and occupied frame count for that action so the renderer
// never cycles into a padded transparent cell or exposes a neighbor.
export const movementSpriteSheets: Record<string, MovementSet> = {
  bibi: {
    idle: sheet(bibiIdle, 8, 4, 28),
    walk: sheet(bibiWalk, 8, 6, 42),
    run: sheet(bibiRun, 8, 4, 31),
    jump: sheet(bibiJump, 8, 4, 31),
  },
  toro: {
    idle: sheet(toroIdle, 7, 7, 48),
    walk: sheet(toroWalk, 8, 6, 43),
    run: sheet(toroRun, 7, 7, 48),
    jump: sheet(toroJump, 7, 4, 27),
  },
  kiku: {
    idle: sheet(kikuIdle, 8, 4, 29),
    walk: sheet(kikuWalk, 8, 6, 47),
    run: sheet(kikuRun, 8, 7, 54),
    jump: sheet(kikuJump, 8, 4, 28),
  },
  miso: {
    idle: sheet(misoIdle, 8, 7, 53),
    walk: sheet(misoWalk, 8, 7, 49),
    run: sheet(misoRun, 8, 7, 50),
    jump: sheet(misoJump, 8, 5, 33),
  },
  nori: {
    idle: sheet(noriIdle, 8, 4, 30),
    walk: sheet(noriWalk, 8, 7, 49),
    run: sheet(noriRun, 8, 5, 33),
    jump: sheet(noriJump, 8, 5, 40),
  },
  panko: {
    idle: sheet(pankoIdle, 8, 5, 34),
    walk: sheet(pankoWalk, 8, 7, 49),
    run: sheet(pankoRun, 7, 7, 48),
    jump: sheet(pankoJump, 8, 5, 33),
  },
  rollo: {
    idle: sheet(rolloIdle, 8, 6, 46),
    walk: sheet(rolloWalk, 8, 6, 46),
    run: sheet(rolloRun, 8, 5, 37),
    jump: sheet(rolloJump, 8, 5, 34),
  },
  saffy: {
    idle: sheet(saffyIdle, 8, 5, 33),
    walk: sheet(saffyWalk, 8, 5, 34),
    run: sheet(saffyRun, 8, 6, 47),
    jump: sheet(saffyJump, 8, 4, 32),
  },
  tilda: {
    idle: sheet(tildaIdle, 8, 5, 37),
    walk: sheet(tildaWalk, 8, 6, 42),
    run: sheet(tildaRun, 8, 6, 42),
    jump: sheet(tildaJump, 8, 5, 36),
  },
  uma: {
    idle: sheet(umaIdle, 8, 4, 31),
    walk: sheet(umaWalk, 8, 7, 51),
    run: sheet(umaRun, 8, 4, 32),
    jump: sheet(umaJump, 8, 5, 35),
  },
  sencha: {
    idle: sheet(senchaIdle, 8, 7, 50),
    walk: sheet(senchaWalk, 8, 7, 51),
    run: sheet(senchaRun, 8, 6, 42),
    jump: sheet(senchaJump, 8, 4, 32),
  },
};

export function getMovementSpriteSheet(personaId: string, action: MovementAction) {
  return movementSpriteSheets[personaId]?.[action];
}