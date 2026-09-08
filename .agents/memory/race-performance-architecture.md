---
name: Race performance architecture
description: Durable guidance for keeping the Mystery Bento race smooth without changing authored simulation behavior.
---

Keep continuous race motion outside React reconciliation: the live renderer
should apply panorama and runner transforms imperatively, while React updates
only for discrete stage, contact, reaction, finish, or winner changes. Sprite
cadence should read changing speed from a ref rather than restarting its timer.

**Why:** The race combines a fixed pixel canvas, large sprite sheets, authored
timing, audio handoff, and several overlay controls; reconciling that full tree
on every clock tick creates avoidable tablet frame and input pressure.

**How to apply:** Preserve the pure timeline/speed/contact helpers and preload
contract, then add regression coverage for deterministic calculations and
stable cadence whenever the live renderer changes.

The runner simulation uses a presentation-space travel endpoint that is
separate from the panorama’s world-travel endpoint. Both still share the
resolved finish threshold and screen anchor; obstacle reactions must be
resolved against the runner endpoint so slow lanes receive finite crossing
times rather than silently falling back to roster order.

**Why:** The panorama’s authored finish world position can be shorter than
the distance needed after several slowdown reactions, while the visible
finish marker still needs to remain fixed.

**How to apply:** Keep the runner endpoint in the authoritative race plan and
use its serialized trajectories for normal and reduced playback; never
reintroduce a second live projection for finish ordering.

The race presentation should use one continuous race clock from the starting
lantern to the finish; warm-up, matchup, and finale are narration labels only,
not separate movement or finish states.

**Why:** Separate presentation stages allowed the finish timer and visible
course to disagree, producing abrupt endings when a simulated runner crossed
before the authored presentation had finished.

**How to apply:** Keep stage labels only where announcer copy needs them, while
deriving runner transforms, finish visibility, crossing, reduced-motion playback,
skip, and winner reveal from the serialized race timeline.

The visible finish is gated by the panorama endpoint, not the earliest lane
threshold crossing; runner screen travel must approach the finish marker over
the same full-background interval.

**Why:** A runner sprite can reach the right side before the last background
scene completes, which otherwise looks like an early finish even when the
winner plan is correct.

**How to apply:** Keep individual lane crossings for winner ordering, but use
the full race duration for the shared finish handoff and project the sprite's
leading edge onto the marker only at that endpoint.

Winner announcer audio must be scheduled from the shared finish handoff, never
from a generic race-stage clock.

**Why:** The winner phrase is only meaningful after the finish; scheduling it
as a normal race beat makes the narration announce an outcome before it has
happened.

**How to apply:** Route winner beats through the resolved finish crossing and
finish-settle interval; keep obstacle and lead-change clips on the race clock.

The final background boundary is the authored world-travel endpoint, not
necessarily 100% of the track percentage.

**Why:** The panorama can complete at a normalized travel value below 100%;
using a generic 100% assertion falsely reports a correctly completed finish as
early.

**How to apply:** Expose the authored endpoint in race diagnostics and assert
that the finish marker is inside the viewport when the shared crossing fires.

Camera correction must be bounded by the panorama travel remaining before its
authored endpoint, and the finish-crossed frame must reuse the terminal
trajectory rather than a shared early-crossing snapshot.

**Why:** An accumulated correction can saturate the scenery at the finish while
continuing to subtract from runner anchors, making racers appear to slow or
stop short; switching to a different finish position can then visibly move
them after crossing.

**How to apply:** Clamp effective correction by remaining world travel and
derive the post-finish frame from the same terminal trajectory used at the end
of the live race.

Finish marker coordinates are authored in panorama/world pixels but runner
transforms are viewport pixels; convert the marker through the completed track
translation before deriving the runner leading-edge anchor.

**Why:** Treating the world-space marker offset as a viewport coordinate sends
the runner offscreen and hides the real alignment error.

**How to apply:** Compare final DOM right-edge and marker-left geometry in the
browser check, allowing no positive overshoot for the winning sprite.

Race resource preparation should be shared by source URL and staged during the
announcement, while constrained-device sampling may lower transform writes but
must not alter simulation clocks or authored sprite cadence.

**Why:** Repeated overlay mounts otherwise recreate large image/audio decode
bursts, and a slower device needs a steadier presentation budget without
changing the race story or its timing contract.

**How to apply:** Keep image readiness/failure entries reusable across contests,
use transient audio elements only for playback, and gate per-frame diagnostics
behind an explicit race debug path.