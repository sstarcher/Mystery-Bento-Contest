export type AnnouncerObstacleKind =
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

export type AnnouncerClip = {
  id: string;
  src: string;
  label: string;
};

const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/announcer`;

const clip = (id: string, path: string, label: string): AnnouncerClip => ({
  id,
  src: `${AUDIO_BASE}/${path}`,
  label,
});

export const announcerAudio = {
  raceStarts: [
    clip('race-start-primary', 'race-starts/race-start-primary.mp3', 'the Mystery Bento Match is underway'),
    clip('race-start-quiet-kitchen', 'race-starts/race-start-quiet-kitchen.mp3', 'the quiet kitchen opens the course'),
    clip('race-start-welcome-back', 'race-starts/race-start-welcome-back.mp3', 'the after-hours kitchen welcomes everyone back'),
  ],
  contestantsAre: clip('contestants-are', 'character-intros/contestants-are.mp3', 'tonight’s contestants'),
  characterName: (personaId: string, name: string) => (
    clip(`character-name-${personaId}`, `character-names/${personaId}.mp3`, name)
  ),
  characterBlurb: (personaId: string, name: string) => (
    clip(`character-blurb-${personaId}`, `character-blurbs/${personaId}.mp3`, `${name} profile`)
  ),
  contestName: (contestId: string, name: string) => (
    clip(`contest-name-${contestId}`, `contest-names/${contestId}.mp3`, name)
  ),
  obstacles: {
    'napkin-gust': {
      short: clip('obstacle-napkin-gust', 'obstacles/napkin-gust-ahead.mp3', 'napkin gust ahead'),
      long: clip('obstacle-napkin-gust-long', 'obstacles/napkin-gust-sweeping-straightaway.mp3', 'the napkin gust sweeps across the straightaway'),
    },
    'tea-puddle': {
      short: clip('obstacle-tea-puddle', 'obstacles/tea-puddle-ahead.mp3', 'tea puddle ahead'),
      long: clip('obstacle-tea-puddle-long', 'obstacles/tea-puddle-careful-step.mp3', 'the tea puddle demands a careful step'),
    },
    'wobble-stack': {
      short: clip('obstacle-wobble-stack', 'obstacles/wobble-stack-ahead.mp3', 'wobble stack ahead'),
      long: clip('obstacle-wobble-stack-long', 'obstacles/wobble-stack-swaying-across-lane.mp3', 'the wobble stack sways across the lane'),
    },
    'shortcut-reflection': {
      short: clip('obstacle-moon-reflection', 'obstacles/moon-reflection-ahead.mp3', 'moon reflection ahead'),
      long: clip('obstacle-moon-reflection-long', 'obstacles/moon-reflection-hiding-shortcut.mp3', 'the moon reflection may hide a shortcut'),
    },
    'broken-cart': {
      short: clip('obstacle-broken-cart', 'obstacles/broken-cart-across-the-course.mp3', 'broken cart across the course'),
      long: clip('obstacle-broken-cart-long', 'obstacles/broken-cart-blocking-course.mp3', 'the broken cart blocks the course'),
    },
    'ribbon-tunnel': {
      short: clip('obstacle-ribbon-tunnel', 'obstacles/ribbon-tunnel-ahead.mp3', 'ribbon tunnel ahead'),
      long: clip('obstacle-ribbon-tunnel-long', 'obstacles/ribbon-tunnel-moving-faster.mp3', 'the ribbon tunnel moves faster than expected'),
    },
    'cushion-pile': {
      short: clip('obstacle-cushion-pile', 'obstacles/cushion-pile-ahead.mp3', 'cushion pile ahead'),
      long: clip('obstacle-cushion-pile-long', 'obstacles/cushion-pile-blocking-safest-route.mp3', 'the cushion pile blocks the safest route'),
    },
    'flour-sacks': {
      short: clip('obstacle-flour-sacks', 'obstacles/flour-sacks-coming-into-the-lane.mp3', 'flour sacks coming into the lane'),
      long: clip('obstacle-flour-sacks-long', 'obstacles/flour-sacks-tumbling-side-door.mp3', 'flour sacks tumble in from the side door'),
    },
    'crumb-trail': {
      short: clip('obstacle-crumb-trail', 'obstacles/crumb-trail-ahead.mp3', 'crumb trail ahead'),
      long: clip('obstacle-crumb-trail-long', 'obstacles/crumb-trail-behind-crates.mp3', 'a tempting crumb trail winds behind the crates'),
    },
    'garnish-gate': {
      short: clip('obstacle-garnish-gate', 'obstacles/garnish-gate-ahead.mp3', 'garnish gate ahead'),
      long: clip('obstacle-garnish-gate-long', 'obstacles/garnish-gate-one-elegant-line.mp3', 'the garnish gate leaves one elegant line through'),
    },
    'steam-gadget': {
      short: clip('obstacle-steam-gadget', 'obstacles/steam-gadget-ahead.mp3', 'steam gadget ahead'),
      long: clip('obstacle-steam-gadget-long', 'obstacles/steam-gadget-filled-lane-with-fog.mp3', 'the steam gadget fills the lane with fog'),
    },
    'bento-stack': {
      short: clip('obstacle-bento-stack', 'obstacles/bento-stack-at-the-finish.mp3', 'bento stack at the finish'),
      long: clip('obstacle-bento-stack-long', 'obstacles/bento-stack-narrowed-final-lane.mp3', 'the bento stack narrows the final lane'),
    },
  } satisfies Record<AnnouncerObstacleKind, { short: AnnouncerClip; long: AnnouncerClip }>,
  resultFragments: {
    short: {
      clear: clip('result-clean-line', 'result-fragments/clean-line.mp3', 'clean line'),
      slow: clip('result-slowed-down', 'result-fragments/slowed-down.mp3', 'slowed down'),
      surge: clip('result-found-a-break', 'result-fragments/found-a-break.mp3', 'found a break'),
      reroute: clip('result-rerouted', 'result-fragments/rerouted.mp3', 'rerouted'),
    },
    named: {
      clear: clip('result-finds-a-clean-line', 'result-fragments/finds-a-clean-line.mp3', 'finds a clean line'),
      slow: clip('result-loses-a-few-steps', 'result-fragments/loses-a-few-steps.mp3', 'loses a few steps'),
      surge: clip('result-finds-an-unexpected-opening', 'result-fragments/finds-an-unexpected-opening.mp3', 'finds an unexpected opening'),
      reroute: clip('result-takes-the-strange-line-around-it', 'result-fragments/takes-the-strange-line-around-it.mp3', 'takes the strange line around it'),
    },
  },
  reactions: {
    jump: clip('reaction-jump', 'reactions/jumps-over-it-and-keeps-moving.mp3', 'jumps over it and keeps moving'),
    dodge: clip('reaction-dodge', 'reactions/sidesteps-it-and-holds-the-line.mp3', 'sidesteps it and holds the line'),
    slide: clip('reaction-slide', 'reactions/slides-around-it-and-recovers.mp3', 'slides around it and recovers'),
    duck: clip('reaction-duck', 'reactions/ducks-beneath-it-and-keeps-moving.mp3', 'ducks beneath it and keeps moving'),
    stumble: clip('reaction-stumble', 'reactions/stumbles-steadies-and-carries-on.mp3', 'stumbles, steadies, and carries on'),
    weave: clip('reaction-weave', 'reactions/weaves-through-and-finds-a-stranger-line.mp3', 'weaves through and finds a stranger line'),
    surge: clip('reaction-surge', 'reactions/surges-through-the-opening.mp3', 'surges through the opening'),
  },
  paceLeadChanges: {
    pack: clip('pace-pack-together', 'pace-lead-changes/pack-still-together.mp3', 'the pack is still together'),
    stretch: clip('pace-field-stretch', 'pace-lead-changes/field-beginning-to-stretch.mp3', 'the field begins to stretch'),
    newLeader: clip('pace-new-leader', 'pace-lead-changes/new-leader-lantern-route.mp3', 'there’s a new leader on the lantern route'),
    changedHands: clip('pace-lead-changed', 'pace-lead-changes/lead-changed-hands.mp3', 'the lead changes hands'),
    gapClosing: clip('pace-gap-closing', 'pace-lead-changes/gap-closing-quickly.mp3', 'the gap is closing quickly'),
    anotherGear: clip('pace-another-gear', 'pace-lead-changes/one-contender-finding-another-gear.mp3', 'one contender finds another gear'),
    backMarker: clip('pace-back-marker', 'pace-lead-changes/back-marker-not-giving-up.mp3', 'the back marker is not giving up'),
  },
  stageTransitions: {
    warmup: clip('stage-warmup', 'stage-transitions/warm-up-underway.mp3', 'the warm-up is underway'),
    firstHazard: clip('stage-first-hazard', 'stage-transitions/first-hazard-coming-into-view.mp3', 'the first hazard comes into view'),
    matchup: clip('stage-matchup', 'stage-transitions/around-bend-into-matchup.mp3', 'around the bend and into the matchup'),
    finale: clip('stage-finale', 'stage-transitions/final-lane-approaching.mp3', 'the final lane is approaching'),
    finish: clip('stage-finish', 'stage-transitions/finish-in-sight.mp3', 'the finish is in sight'),
  },
  finishResult: clip('finish-takes-the-win', 'finish-results/takes-the-win.mp3', 'takes the win'),
} as const;