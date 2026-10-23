# LightWeave

**Shape the light. Watch your world bloom.**

## One-line description

Turn one mirror, guide a golden beam through space, and bring three luminous flowers to life in an interactive AR puzzle.

## Who it's for

LightWeave is designed for curious learners and first-time spatial puzzle players.

Its invitation is simple: change the mirror angle, see the light move, and discover the connection that makes a target bloom.

## Inspiration

A ray of light can turn a small movement into a beautiful discovery.

LightWeave makes that connection visible: turn the mirror, follow the new path, and watch a flower bloom when the beam reaches it.

One mirror. Three discoveries.

## What it does

LightWeave places a glowing puzzle in the space around you.

Use a single-hand pinch and drag to rotate the mirror and shape the beam's direction.

Fine-tune the angle with four controls that adjust yaw or pitch by two degrees.

Follow the golden path toward coral, teal, and gold targets at three different heights.

Each newly reached target opens into an eight-petal flower, while a bright center and pulsing rim show where the light is landing now.

Earned flowers stay open as you guide the beam toward the next discovery.

Bring all three to life to complete the garden, then choose Replay and create the path again.

## Why AR

The puzzle unfolds across three dimensions.

Change your viewpoint to explore the relationship between the mirror, the beam, and the elevated target.

The space between them becomes part of the challenge.

Your next discovery begins with a new angle.

## How we built it

We began with the Devpost Learn planning skill to define the spatial moment, interaction flow, and concrete success criteria.

We then used CLAD's Lens Studio skills and native Lens Studio MCP tools to build and inspect the scene in Lens Studio 5.23.2.

A TypeScript optical core traces a ray against a finite mirror, reflects it from the mirror's current orientation, and detects receiver intersections.

The returned geometry drives the visible beam, and a geometric target hit earns each bloom.

Spectacles Interaction Kit connects pinch-and-drag input to mirror rotation, while UIKit provides the four fine-angle controls and Replay.

We created original faceted models for the flowers, mirror, source, and beam, with coordinated petal and highlight animations for each bloom.

Six original synthesized audio assets cover interaction, individual blooms, completion, and ambience.

## Design challenge

Our central design challenge was to make every reflection clear and every success delightful.

A golden beam reveals the path, bright targets give it a destination, and blooming petals celebrate each connection.

Mirror highlights respond to hover and selection, while a receiving flower's bright center and pulsing rim make the current hit visible.

Distinct heights make the puzzle's spatial structure visible from multiple viewpoints.

## Accomplishments

We brought direct mirror interaction, a calculated light path, three animated flowers, and Replay together in one Lens.

A continuous native Lens Studio Preview recording captured two complete three-flower runs, with Replay restoring the opening state between them.

The independent optical core passed 40 numerical and state tests covering reflection, intersections, target reachability, progress, and reset.

Five automated LEAF scenarios passed in Lens Studio Preview, covering initial controls, continuous drag and retention, target connections and cue events, Replay across repeated runs, and pending-cue cancellation.

The [validation report](../validation.md) brings these results together with the continuous recording and actual player viewpoints 25 cm to either side.

The result is a complete journey from the first turn of the mirror to a garden in bloom.

## What we learned

Designing around one clear action connected the whole experience.

The same mirror movement shapes the path, advances the challenge, and leads to a visible reward.

## What's next

Our next creative direction is a collection of light gardens, each with its own spatial arrangement, color palette, and path to discover.

LightWeave begins with one golden beam and ends with a world in bloom.
