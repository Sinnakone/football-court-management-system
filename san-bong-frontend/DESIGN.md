# SânBóngPro Design Notes

## Theme
Light operational interface for customers and admins using the app in normal office, school, and mobile contexts. The UI should stay readable in daytime environments and keep color meaning consistent.

## Color Strategy
Restrained product palette: tinted neutral surfaces, forest green as the primary action and selected state, amber for payment/revenue emphasis, blue for confirmed/info states, red for destructive/error states.

## Typography
Use a single clean sans workflow feel. Sora and DM Sans are already present in the codebase; keep heading/body contrast modest and avoid oversized type inside dense product panels.

## Layout
Use predictable grids and tables. Keep customer pages roomy enough for decision-making, but keep admin screens dense and scannable. Cards should frame repeated items and functional panels only.

## Components
- Primary actions: green filled buttons.
- Secondary actions: neutral or outlined buttons.
- Status: compact badges with consistent semantic color.
- Loading: skeleton rows/cards where content shape is known, spinner only for compact async controls.
- Empty states: explain the next action.

## Motion
Short 150-220ms state transitions. Motion should indicate hover, focus, reveal, and async feedback only.
