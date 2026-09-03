import bibiIdle from './assets/derived/contestants/movement/bibi-idle.png';
import bibiJump from './assets/derived/contestants/movement/bibi-jump.png';
import bibiRun from './assets/derived/contestants/movement/bibi-run.png';
import bibiWalk from './assets/derived/contestants/movement/bibi-walk.png';
import toroIdle from './assets/derived/contestants/movement/toro-idle.png';
import toroJump from './assets/derived/contestants/movement/toro-jump.png';
import toroRun from './assets/derived/contestants/movement/toro-run.png';
import toroWalk from './assets/derived/contestants/movement/toro-walk.png';
import kikuIdle from './assets/derived/contestants/movement/kiku-idle.png';
import kikuJump from './assets/derived/contestants/movement/kiku-jump.png';
import kikuRun from './assets/derived/contestants/movement/kiku-run.png';
import kikuWalk from './assets/derived/contestants/movement/kiku-walk.png';
import misoIdle from './assets/derived/contestants/movement/miso-idle.png';
import misoJump from './assets/derived/contestants/movement/miso-jump.png';
import misoRun from './assets/derived/contestants/movement/miso-run.png';
import misoWalk from './assets/derived/contestants/movement/miso-walk.png';
import noriIdle from './assets/derived/contestants/movement/nori-idle.png';
import noriJump from './assets/derived/contestants/movement/nori-jump.png';
import noriRun from './assets/derived/contestants/movement/nori-run.png';
import noriWalk from './assets/derived/contestants/movement/nori-walk.png';
import pankoIdle from './assets/derived/contestants/movement/panko-idle.png';
import pankoJump from './assets/derived/contestants/movement/panko-jump.png';
import pankoRun from './assets/derived/contestants/movement/panko-run.png';
import pankoWalk from './assets/derived/contestants/movement/panko-walk.png';
import pipIdle from './assets/derived/contestants/movement/pip-idle.png';
import pipJump from './assets/derived/contestants/movement/pip-jump.png';
import pipRun from './assets/derived/contestants/movement/pip-run.png';
import pipWalk from './assets/derived/contestants/movement/pip-walk.png';
import rolloIdle from './assets/derived/contestants/movement/rollo-idle.png';
import rolloJump from './assets/derived/contestants/movement/rollo-jump.png';
import rolloRun from './assets/derived/contestants/movement/rollo-run.png';
import rolloWalk from './assets/derived/contestants/movement/rollo-walk.png';
import saffyIdle from './assets/derived/contestants/movement/saffy-idle.png';
import saffyJump from './assets/derived/contestants/movement/saffy-jump.png';
import saffyRun from './assets/derived/contestants/movement/saffy-run.png';
import saffyWalk from './assets/derived/contestants/movement/saffy-walk.png';
import tildaIdle from './assets/derived/contestants/movement/tilda-idle.png';
import tildaJump from './assets/derived/contestants/movement/tilda-jump.png';
import tildaRun from './assets/derived/contestants/movement/tilda-run.png';
import tildaWalk from './assets/derived/contestants/movement/tilda-walk.png';
import umaIdle from './assets/derived/contestants/movement/uma-idle.png';
import umaJump from './assets/derived/contestants/movement/uma-jump.png';
import umaRun from './assets/derived/contestants/movement/uma-run.png';
import umaWalk from './assets/derived/contestants/movement/uma-walk.png';
import senchaIdle from './assets/derived/contestants/movement/sencha-idle.png';
import senchaJump from './assets/derived/contestants/movement/sencha-jump.png';
import senchaRun from './assets/derived/contestants/movement/sencha-run.png';
import senchaWalk from './assets/derived/contestants/movement/sencha-walk.png';
import { movementSpriteNormalization, type MovementSpriteNormalization } from './movement-sprite-normalization';
import type { MovementAction } from './movement-sprite-actions';

export type { MovementAction } from './movement-sprite-actions';

export type MovementSpriteSheet = {
  src: string;
  columns: number;
  rows: number;
  frameCount: number;
  frameDurationMs: number;
  normalization: MovementSpriteNormalization;
};

const MOVEMENT_FRAME_DURATION_MS = 1000 / 12;

function sheet(
  personaId: string,
  action: MovementAction,
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
    normalization: movementSpriteNormalization[personaId][action],
  };
}

type MovementSet = Partial<Record<MovementAction, MovementSpriteSheet>>;

// The source sheets retain their transparent pixels. Every entry records the
// square cell grid and occupied frame count for that action so the renderer
// never cycles into a padded transparent cell or exposes a neighbor.
export const movementSpriteSheets: Record<string, MovementSet> = {
  bibi: {
    idle: sheet('bibi', 'idle', bibiIdle, 8, 4, 28),
    walk: sheet('bibi', 'walk', bibiWalk, 8, 6, 42),
    run: sheet('bibi', 'run', bibiRun, 8, 4, 31),
    jump: sheet('bibi', 'jump', bibiJump, 8, 4, 31),
  },
  toro: {
    idle: sheet('toro', 'idle', toroIdle, 7, 7, 48),
    walk: sheet('toro', 'walk', toroWalk, 8, 6, 43),
    run: sheet('toro', 'run', toroRun, 7, 7, 48),
    jump: sheet('toro', 'jump', toroJump, 7, 4, 27),
  },
  kiku: {
    idle: sheet('kiku', 'idle', kikuIdle, 8, 4, 29),
    walk: sheet('kiku', 'walk', kikuWalk, 8, 6, 47),
    run: sheet('kiku', 'run', kikuRun, 8, 7, 54),
    jump: sheet('kiku', 'jump', kikuJump, 8, 4, 28),
  },
  miso: {
    idle: sheet('miso', 'idle', misoIdle, 8, 7, 53),
    walk: sheet('miso', 'walk', misoWalk, 8, 7, 49),
    run: sheet('miso', 'run', misoRun, 8, 7, 50),
    jump: sheet('miso', 'jump', misoJump, 8, 5, 33),
  },
  nori: {
    idle: sheet('nori', 'idle', noriIdle, 8, 4, 30),
    walk: sheet('nori', 'walk', noriWalk, 8, 7, 49),
    run: sheet('nori', 'run', noriRun, 8, 5, 33),
    jump: sheet('nori', 'jump', noriJump, 8, 5, 40),
  },
  panko: {
    idle: sheet('panko', 'idle', pankoIdle, 8, 5, 34),
    walk: sheet('panko', 'walk', pankoWalk, 8, 7, 49),
    run: sheet('panko', 'run', pankoRun, 7, 7, 48),
    jump: sheet('panko', 'jump', pankoJump, 8, 5, 33),
  },
  pip: {
    idle: sheet('pip', 'idle', pipIdle, 8, 7, 52),
    walk: sheet('pip', 'walk', pipWalk, 8, 6, 48),
    run: sheet('pip', 'run', pipRun, 8, 7, 50),
    jump: sheet('pip', 'jump', pipJump, 8, 4, 32),
  },
  rollo: {
    idle: sheet('rollo', 'idle', rolloIdle, 8, 6, 46),
    walk: sheet('rollo', 'walk', rolloWalk, 8, 6, 46),
    run: sheet('rollo', 'run', rolloRun, 8, 5, 37),
    jump: sheet('rollo', 'jump', rolloJump, 8, 5, 34),
  },
  saffy: {
    idle: sheet('saffy', 'idle', saffyIdle, 8, 5, 33),
    walk: sheet('saffy', 'walk', saffyWalk, 8, 5, 34),
    run: sheet('saffy', 'run', saffyRun, 8, 6, 47),
    jump: sheet('saffy', 'jump', saffyJump, 8, 4, 32),
  },
  tilda: {
    idle: sheet('tilda', 'idle', tildaIdle, 8, 5, 37),
    walk: sheet('tilda', 'walk', tildaWalk, 8, 6, 42),
    run: sheet('tilda', 'run', tildaRun, 8, 6, 42),
    jump: sheet('tilda', 'jump', tildaJump, 8, 5, 36),
  },
  uma: {
    idle: sheet('uma', 'idle', umaIdle, 8, 4, 31),
    walk: sheet('uma', 'walk', umaWalk, 8, 7, 51),
    run: sheet('uma', 'run', umaRun, 8, 4, 32),
    jump: sheet('uma', 'jump', umaJump, 8, 5, 35),
  },
  sencha: {
    idle: sheet('sencha', 'idle', senchaIdle, 8, 7, 50),
    walk: sheet('sencha', 'walk', senchaWalk, 8, 7, 51),
    run: sheet('sencha', 'run', senchaRun, 8, 6, 42),
    jump: sheet('sencha', 'jump', senchaJump, 8, 4, 32),
  },
};

export function getMovementSpriteSheet(personaId: string, action: MovementAction) {
  return movementSpriteSheets[personaId]?.[action];
}