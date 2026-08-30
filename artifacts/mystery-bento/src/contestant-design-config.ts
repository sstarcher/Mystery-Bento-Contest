import bibiPortrait from './assets/contestants/bibi.png';
import bibiFood from './assets/contestants/bibi-food.png';
import kikuPortrait from './assets/contestants/kiku.png';
import kikuFood from './assets/contestants/kiku-food.png';
import misoPortrait from './assets/contestants/miso.png';
import misoFood from './assets/contestants/miso-food.png';
import noriPortrait from './assets/contestants/nori.png';
import noriFood from './assets/contestants/nori-food.png';
import noriNibFrame1 from './assets/contestants/nori-nib-frame-1.png';
import noriNibFrame2 from './assets/contestants/nori-nib-frame-2.png';
import noriNibFrame3 from './assets/contestants/nori-nib-frame-3.png';
import noriNibFrame4 from './assets/contestants/nori-nib-frame-4.png';
import noriNibFrame5 from './assets/contestants/nori-nib-frame-5.png';
import noriNibFrame6 from './assets/contestants/nori-nib-frame-6.png';
import pankoPortrait from './assets/contestants/panko.png';
import pankoFood from './assets/contestants/panko-food.png';
import pipPortrait from './assets/contestants/pip.png';
import pipFood from './assets/contestants/pip-food.png';
import pipPorridgeFrame1 from './assets/contestants/pip-porridge-frame-1.png';
import pipPorridgeFrame2 from './assets/contestants/pip-porridge-frame-2.png';
import pipPorridgeFrame3 from './assets/contestants/pip-porridge-frame-3.png';
import pipPorridgeFrame4 from './assets/contestants/pip-porridge-frame-4.png';
import pipPorridgeFrame5 from './assets/contestants/pip-porridge-frame-5.png';
import pipPorridgeFrame6 from './assets/contestants/pip-porridge-frame-6.png';
import rolloPortrait from './assets/contestants/rollo.png';
import rolloFood from './assets/contestants/rollo-food.png';
import rolloRadishFrame1 from './assets/contestants/rollo-radish-frame-1.png';
import rolloRadishFrame2 from './assets/contestants/rollo-radish-frame-2.png';
import rolloRadishFrame3 from './assets/contestants/rollo-radish-frame-3.png';
import rolloRadishFrame4 from './assets/contestants/rollo-radish-frame-4.png';
import rolloRadishFrame5 from './assets/contestants/rollo-radish-frame-5.png';
import rolloRadishFrame6 from './assets/contestants/rollo-radish-frame-6.png';
import saffyPortrait from './assets/contestants/saffy.png';
import saffyFood from './assets/contestants/saffy-food.png';
import senchaPortrait from './assets/contestants/sencha.png';
import senchaFood from './assets/contestants/sencha-food.png';
import senchaTeaFrame1 from './assets/contestants/sencha-tea-frame-1.png';
import senchaTeaFrame2 from './assets/contestants/sencha-tea-frame-2.png';
import senchaTeaFrame3 from './assets/contestants/sencha-tea-frame-3.png';
import senchaTeaFrame4 from './assets/contestants/sencha-tea-frame-4.png';
import senchaTeaFrame5 from './assets/contestants/sencha-tea-frame-5.png';
import senchaTeaFrame6 from './assets/contestants/sencha-tea-frame-6.png';
import tildaPortrait from './assets/contestants/tilda.png';
import tildaFood from './assets/contestants/tilda-food.png';
import tildaTofuFrame1 from './assets/contestants/tilda-tofu-frame-1.png';
import tildaTofuFrame2 from './assets/contestants/tilda-tofu-frame-2.png';
import tildaTofuFrame3 from './assets/contestants/tilda-tofu-frame-3.png';
import tildaTofuFrame4 from './assets/contestants/tilda-tofu-frame-4.png';
import tildaTofuFrame5 from './assets/contestants/tilda-tofu-frame-5.png';
import tildaTofuFrame6 from './assets/contestants/tilda-tofu-frame-6.png';
import toroPortrait from './assets/contestants/toro.png';
import toroFood from './assets/contestants/toro-food.png';
import umaPortrait from './assets/contestants/uma.png';
import umaFood from './assets/contestants/uma-food.png';

export type ContestantDesign = {
  id: string;
  name: string;
  contestEdge: string;
  palette: { primary: string; accent: string; neutral: string };
  readableSpriteFeature: string;
  background: string;
  look: string;
  spriteSilhouette: string;
  idleAnimation: string;
  quirk: string;
  contestBehavior: string;
  catchphrase: string;
  memorableEvent: string;
  traits: { speed: number; balance: number; focus: number; luck: number; chaos: number };
  silhouetteKey: string;
  idleAnimationKey: string;
};

export const contestantPortraits: Record<string, string> = {
  pip: pipPortrait,
  sencha: senchaPortrait,
  toro: toroPortrait,
  nori: noriPortrait,
  tilda: tildaPortrait,
  rollo: rolloPortrait,
  miso: misoPortrait,
  uma: umaPortrait,
  panko: pankoPortrait,
  saffy: saffyPortrait,
  kiku: kikuPortrait,
  bibi: bibiPortrait,
};

export const contestantFoodSprites: Record<string, string> = {
  pip: pipFood,
  sencha: senchaFood,
  toro: toroFood,
  nori: noriFood,
  tilda: tildaFood,
  rollo: rolloFood,
  miso: misoFood,
  uma: umaFood,
  panko: pankoFood,
  saffy: saffyFood,
  kiku: kikuFood,
  bibi: bibiFood,
};

export const contestantFoodAnimationFrames: Partial<Record<string, string[]>> = {
  pip: [pipPorridgeFrame1, pipPorridgeFrame2, pipPorridgeFrame3, pipPorridgeFrame4, pipPorridgeFrame5, pipPorridgeFrame6],
  sencha: [senchaTeaFrame1, senchaTeaFrame2, senchaTeaFrame3, senchaTeaFrame4, senchaTeaFrame5, senchaTeaFrame6],
  nori: [noriNibFrame1, noriNibFrame2, noriNibFrame3, noriNibFrame4, noriNibFrame5, noriNibFrame6],
  tilda: [tildaTofuFrame1, tildaTofuFrame2, tildaTofuFrame3, tildaTofuFrame4, tildaTofuFrame5, tildaTofuFrame6],
  rollo: [rolloRadishFrame1, rolloRadishFrame2, rolloRadishFrame3, rolloRadishFrame4, rolloRadishFrame5, rolloRadishFrame6],
};

export const contestantFoodAnimationAspectRatios: Partial<Record<string, string>> = {
  pip: '362 / 724',
  sencha: '362 / 724',
  toro: '1 / 1',
  nori: '314 / 836',
  tilda: '284 / 922',
  // Rollo's transparent derivatives share a visible y-range of 231–692.
  // The shorter viewport keeps the full pose readable while the sprite CSS
  // still uses the original canvas to isolate each frame.
  rollo: '320 / 461',
};

export const contestantDesignReference = {
  artDirection: 'Cozy 16-bit village food-fantasy: chunky silhouettes, warm light, hand-painted-looking pixel clusters, gentle exaggeration, and readable seasonal colors. Keep the work original and do not replicate any existing game’s characters, sprites, clothing, tiles, UI, palettes, or scene compositions.',
  characterRelationships: [
    'Pip considers Captain Toro their honorary grandparent; Toro pretends to find Pip’s enthusiasm exhausting but always saves them the best grilled piece.',
    'Lady Sencha and Saffy are friendly rivals: Sencha values restraint, while Saffy believes restraint is only dramatic if it is visibly difficult.',
    'Tilda and Kiku collaborate on kitchen inventions, although Tilda insists on safety labels and Kiku keeps removing them because “the device should speak for itself.”',
    'Rollo regularly persuades Nori to announce events; Nori always claims they were “merely interpreting the winds.”',
    'Miso discreetly packs late-night soup for every contestant after a race, including the person who won.',
    'Uma helps Panko reach high shelves, while Panko repays her by finding every screw Uma has misplaced.',
    'Bibi keeps a friendly but intense scorecard of everyone’s favorite snacks, which Captain Toro considers an invasion of maritime privacy.',
  ],
  statScale: 'Traits are authored from 1–10 and multiplied by ten for the contest engine. Small controlled random variation keeps personalities meaningful without making results predictable.',
} as const;

export const contestantDesigns: ContestantDesign[] = [
  {
    id: 'pip',
    name: 'Pip Porridge',
    contestEdge: 'Speed',
    palette: { primary: '#e8945e', accent: '#4f9b94', neutral: '#f3dfb4' },
    readableSpriteFeature: 'Oversized bowl-shaped cap',
    background: 'Pip is the unofficial first employee of the morning shift, sprinting through the village with breakfast bowls and cheerful gossip.',
    look: 'A small, round-shouldered figure with caramel-brown skin, messy dark-teal hair, an oversized cream-and-apricot bowl cap, a warm orange jacket, and mismatched shoes.',
    spriteSilhouette: 'Bowl hat, short legs, tray held forward; a fast-moving little mushroom with a tray.',
    idleAnimation: 'Bounces on their heels, then checks a tiny brass pocket watch.',
    quirk: 'Names every rice grain that falls from a plate.',
    contestBehavior: 'Starts exceptionally fast, then gets distracted helping another contestant retrieve a dropped item.',
    catchphrase: 'Breakfast waits for no one—except maybe five minutes!',
    memorableEvent: 'Pip rockets into the lead, doubles back to rescue a fallen napkin, and still crosses the finish smiling.',
    traits: { speed: 9, balance: 5, focus: 5, luck: 6, chaos: 6 },
    silhouetteKey: 'pip',
    idleAnimationKey: 'bounce-watch',
  },
  {
    id: 'sencha',
    name: 'Lady Sencha',
    contestEdge: 'Focus',
    palette: { primary: '#668b68', accent: '#d6b85f', neutral: '#b8c99a' },
    readableSpriteFeature: 'Teapot-shaped hair bun',
    background: 'Lady Sencha is a refined tea spirit who treats every ordinary activity as an opportunity for perfect form.',
    look: 'A tall, slender figure with warm olive skin, glossy black hair coiled into a tiny teapot bun, a moss robe, jade trim, and a gold sash clasp.',
    spriteSilhouette: 'Vertical and poised, with wide sleeve shapes and a distinct rounded tea-bun.',
    idleAnimation: 'Raises a tiny cup, inhales the steam, and nods once with total seriousness.',
    quirk: 'Ranks every puddle in town according to its reflective tranquility.',
    contestBehavior: 'Consistent and controlled, excellent at clean turns and timed obstacles, but rarely benefits from strange events.',
    catchphrase: 'There is no rush. There is only the correct pace.',
    memorableEvent: 'Lady Sencha takes the perfect line through every obstacle while quietly judging the steam.',
    traits: { speed: 5, balance: 8, focus: 10, luck: 3, chaos: 1 },
    silhouetteKey: 'sencha',
    idleAnimationKey: 'tea-steep',
  },
  {
    id: 'toro',
    name: 'Captain Toro',
    contestEdge: 'Balance',
    palette: { primary: '#334b78', accent: '#c65d58', neutral: '#d7d8d1' },
    readableSpriteFeature: 'Enormous curled mustache',
    background: 'Captain Toro is a retired tuna voyager who runs a dockside grill and teaches advanced maritime manners.',
    look: 'A broad, older man with deep brown skin, silver sideburns, an enormous navy captain’s cap, a curled silver mustache, and a crimson pea coat.',
    spriteSilhouette: 'Wide shoulders, captain’s cap, and a pale mustache that sticks out beyond his shoulders.',
    idleAnimation: 'Straightens his mustache, then salutes an imaginary vessel.',
    quirk: 'Refuses to call any hallway a hallway; they are all narrow inland passages.',
    contestBehavior: 'Moves slowly but almost never drops anything, unless he pauses for an unnecessary formal bow.',
    catchphrase: 'Steady hands, steady heart, steady garnish!',
    memorableEvent: 'Captain Toro holds the wobbling stack steady through a full imaginary storm, then salutes the finish line.',
    traits: { speed: 4, balance: 10, focus: 7, luck: 4, chaos: 2 },
    silhouetteKey: 'toro',
    idleAnimationKey: 'mustache-salute',
  },
  {
    id: 'nori',
    name: 'Nori Nib',
    contestEdge: 'Luck',
    palette: { primary: '#4a294b', accent: '#8ac5ad', neutral: '#14141c' },
    readableSpriteFeature: 'Floating seaweed scarf',
    background: 'Nori Nib is the pantry’s midnight menu poet, writing tiny poems on order tickets and emotionally complex cucumber rolls.',
    look: 'A small, slender figure with deep brown skin, shaggy plum hair, seafoam eyes, a dramatic black-and-green scarf, and an oversized charcoal sweater.',
    spriteSilhouette: 'Compact, slightly hunched figure with a long scarf floating behind.',
    idleAnimation: 'The scarf ripples indoors; Nori scribbles in a notebook and hides it if noticed.',
    quirk: 'Cannot answer a direct question without listening to an invisible narrator first.',
    contestBehavior: 'Lucky but unpredictable, stumbling into shortcuts and beneficial events while stopping to admire reflections.',
    catchphrase: 'Ah. The turn ahead has the shape of destiny.',
    memorableEvent: 'Nori pauses to write a poem about a puddle, then discovers the puddle is a shortcut.',
    traits: { speed: 5, balance: 4, focus: 5, luck: 10, chaos: 7 },
    silhouetteKey: 'nori',
    idleAnimationKey: 'scarf-drift',
  },
  {
    id: 'tilda',
    name: 'Tilda Tofu',
    contestEdge: 'Consistency',
    palette: { primary: '#bfa8d2', accent: '#e9dec6', neutral: '#8b644f' },
    readableSpriteFeature: 'Square apron and cube backpack',
    background: 'Tilda maintains the conveyor, pantry shelves, vents, and every fascinating machine with an unnecessary number of moving parts.',
    look: 'A square-built, light-brown-skinned inventor with a short dark bob, round safety goggles, an ivory apron over lavender, and a cube tool backpack.',
    spriteSilhouette: 'Squared apron, broad goggles, and box backpack; short but determined steps.',
    idleAnimation: 'Adjusts goggles, produces a tiny wrench, tightens something off-screen, and looks satisfied.',
    quirk: 'Labels everything, including other people’s chairs.',
    contestBehavior: 'Stable and reliable; may pause to fix a broken obstacle and accidentally help everyone else.',
    catchphrase: 'That is not a disaster. It is an unplanned maintenance opportunity.',
    memorableEvent: 'Tilda repairs the final obstacle mid-race, labels it “working,” and walks through with perfect timing.',
    traits: { speed: 6, balance: 8, focus: 9, luck: 4, chaos: 2 },
    silhouetteKey: 'tilda',
    idleAnimationKey: 'goggle-wrench',
  },
  {
    id: 'rollo',
    name: 'Rollo Radish',
    contestEdge: 'Chaos',
    palette: { primary: '#d65f60', accent: '#83a66f', neutral: '#f0c7b0' },
    readableSpriteFeature: 'Huge radish topknot',
    background: 'Rollo arrives through open doors like a stadium entrance and considers any amount of confetti insufficient.',
    look: 'A compact, rosy-cheeked person with bright pink-red hair flaring like radish leaves, a scarlet vest, green shorts, striped socks, and yellow shoes.',
    spriteSilhouette: 'Wide leaf-top hairstyle, compact body, bright socks, always mid-jump.',
    idleAnimation: 'Throws a fist into the air, then realizes no one joined and awkwardly coughs.',
    quirk: 'Gives every kitchen tool a nickname, including Sir Scoopington the ladle.',
    contestBehavior: 'May take an accidental shortcut, ricochet off scenery, or get tangled in a banner and still finish first.',
    catchphrase: 'If the plan works, it was intentional!',
    memorableEvent: 'Rollo ricochets off a cushion pile, lands in a ribbon tunnel, and declares the shortcut intentional.',
    traits: { speed: 7, balance: 4, focus: 3, luck: 8, chaos: 10 },
    silhouetteKey: 'rollo',
    idleAnimationKey: 'confetti-fist',
  },
  {
    id: 'miso',
    name: 'Miso Mallow',
    contestEdge: 'Calm',
    palette: { primary: '#d58b55', accent: '#668b68', neutral: '#f3dfb4' },
    readableSpriteFeature: 'Fox ears and soup ladle',
    background: 'Miso Mallow is a soft-spoken fox-like kitchen spirit who appears whenever someone needs comfort food or a blanket.',
    look: 'A short, soft-bodied fox with cinnamon-orange fur, cream cheeks, triangular ears, a fluffy tail, a moss apron, and a wooden ladle.',
    spriteSilhouette: 'Big ears, tail, and round ladle; warm and gentle even at tiny sprite scale.',
    idleAnimation: 'Stirs an invisible pot, tastes the ladle, and gives an approving nod.',
    quirk: 'Leaves labeled jars of emergency broth outside people’s doors.',
    contestBehavior: 'Not especially fast, but recovers remarkably well from slips, bumps, and chaotic events.',
    catchphrase: 'No hurry. The broth will wait for us.',
    memorableEvent: 'Miso stumbles into a cushion, steadies the tray with a ladle, and calmly returns to the race.',
    traits: { speed: 5, balance: 7, focus: 8, luck: 6, chaos: 3 },
    silhouetteKey: 'miso',
    idleAnimationKey: 'soup-stir',
  },
  {
    id: 'uma',
    name: 'Uma Udon',
    contestEdge: 'Strength',
    palette: { primary: '#d6af68', accent: '#416d9e', neutral: '#c65d58' },
    readableSpriteFeature: 'Noodle-loop braid',
    background: 'Uma is the town’s noodle strongwoman, carrying problems somewhere else while insisting on proper lifting form.',
    look: 'A tall, athletic woman with rich brown skin, a looping noodle-coil braid, cobalt headband, wheat shirt, red sash, and sturdy sandals.',
    spriteSilhouette: 'Strong shoulders, noodle-loop braid, and red sash with a grounded rhythmic bounce.',
    idleAnimation: 'Rolls her shoulders, stretches one arm, and effortlessly lifts a flour sack.',
    quirk: 'Compliments people by estimating how many bags of flour they could lift.',
    contestBehavior: 'Bulldozes through obstacles but may stop to move them somewhere sensible.',
    catchphrase: 'Lift with your legs. Also, have you eaten enough?',
    memorableEvent: 'Uma carries an entire obstacle aside, waves everyone through, and powers down the final lane.',
    traits: { speed: 7, balance: 9, focus: 6, luck: 3, chaos: 4 },
    silhouetteKey: 'uma',
    idleAnimationKey: 'flour-lift',
  },
  {
    id: 'panko',
    name: 'Panko Puff',
    contestEdge: 'Recovery',
    palette: { primary: '#e0ad58', accent: '#f3dfb4', neutral: '#8b644f' },
    readableSpriteFeature: 'Crumb-dusted beret and magnifier',
    background: 'Panko Puff is the town’s crumb archivist, solving culinary mysteries by tracing sesame trails across rooftops.',
    look: 'A round, soft-looking person with pale golden skin, chestnut curls, a cream crumb-dusted beret, warm-brown vest, and magnifying glass.',
    spriteSilhouette: 'Rounded beret, round torso, and magnifying glass; a cheerful little breadcrumb.',
    idleAnimation: 'Kneels down, examines the ground, writes a note, and brushes crumbs from a sleeve.',
    quirk: 'Cannot pass a crumb without documenting it.',
    contestBehavior: 'Starts slowly, then strong recovery and luck create an improbable clue-based shortcut.',
    catchphrase: 'Interesting. Very interesting. This sesame seed knows more than it is saying.',
    memorableEvent: 'Panko follows one suspicious crumb beneath the finish banner and emerges with the winning shortcut.',
    traits: { speed: 4, balance: 6, focus: 7, luck: 9, chaos: 5 },
    silhouetteKey: 'panko',
    idleAnimationKey: 'crumb-search',
  },
  {
    id: 'saffy',
    name: 'Saffy Sashimi',
    contestEdge: 'Precision',
    palette: { primary: '#df7b78', accent: '#4d477d', neutral: '#f4eee0' },
    readableSpriteFeature: 'Fish-tail coat panel',
    background: 'Saffy is a meticulous fish-slicer and self-appointed director of every dramatic entrance.',
    look: 'An elegant person with pale freckled skin, coral hair in a side ponytail, indigo eyes, a pearl wrap jacket, and a trailing coral coat panel.',
    spriteSilhouette: 'Long side ponytail and swooping coat panel; smooth, precise gliding.',
    idleAnimation: 'Flicks a tiny cloth, adjusts a garnish pin, and poses for half a second.',
    quirk: 'Names every plating arrangement like an opera.',
    contestBehavior: 'Excels at narrow turns and timing challenges, but a dramatic pose can cost a close finish.',
    catchphrase: 'A clean turn deserves applause.',
    memorableEvent: 'Saffy threads the last corner with surgical precision, then spends one beat taking a bow.',
    traits: { speed: 8, balance: 7, focus: 9, luck: 5, chaos: 4 },
    silhouetteKey: 'saffy',
    idleAnimationKey: 'garnish-pose',
  },
  {
    id: 'kiku',
    name: 'Kiku Kettle',
    contestEdge: 'Strategy',
    palette: { primary: '#b86f4b', accent: '#83a66f', neutral: '#3e3b44' },
    readableSpriteFeature: 'Steam-cloud hair',
    background: 'Kiku is a weather-reading inventor who listens to kettles and builds cooking lights, clockwork fans, and self-warming cups.',
    look: 'An older nonbinary inventor with copper-brown skin, silver-gray steam-cloud hair, charcoal glasses, a patched sage coat, and tiny kettles.',
    spriteSilhouette: 'Steam-cloud hair and kettle-shaped backpack, with small puffs establishing their presence.',
    idleAnimation: 'Taps a pocket kettle, which makes a tiny surprised puff of steam.',
    quirk: 'Calls every malfunction a personality disclosure.',
    contestBehavior: 'Gains advantages from hazards and contraptions, but may disappear briefly into steam.',
    catchphrase: 'Ah. The mechanism is feeling expressive today.',
    memorableEvent: 'Kiku vanishes into a harmless steam cloud and reappears beside the finish with a perfectly timed gadget.',
    traits: { speed: 5, balance: 5, focus: 8, luck: 8, chaos: 7 },
    silhouetteKey: 'kiku',
    idleAnimationKey: 'kettle-puff',
  },
  {
    id: 'bibi',
    name: 'Bibi Bento',
    contestEdge: 'Versatility',
    palette: { primary: '#739fc0', accent: '#c28d4e', neutral: '#f4eee0' },
    readableSpriteFeature: 'Stacked bento-box backpack',
    background: 'Bibi is a traveling lunch curator who believes every person has a perfect lunch arrangement.',
    look: 'A youthful, warm-brown-skinned traveler with wavy midnight-blue hair, a pale blue jacket with ochre patches, white trousers, and a stacked bento backpack.',
    spriteSilhouette: 'Tall stack of bento boxes and short blue hair; the backpack bobs distinctly.',
    idleAnimation: 'Opens one box, rearranges a tiny food item with tweezers, and snaps it shut.',
    quirk: 'Carries spare napkins organized by emotional occasion.',
    contestBehavior: 'Adapts to most challenges and thrives when events reward preparation, sorting, or item collection.',
    catchphrase: 'Every snack deserves a proper little stage.',
    memorableEvent: 'Bibi sorts a scattered tray into a perfect stack and turns the cleanup into a graceful sprint.',
    traits: { speed: 7, balance: 7, focus: 7, luck: 6, chaos: 5 },
    silhouetteKey: 'bibi',
    idleAnimationKey: 'box-sort',
  },
];