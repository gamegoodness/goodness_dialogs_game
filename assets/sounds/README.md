# Sounds (optional)

The game currently synthesises soft UI blips at runtime with the WebAudio API
(see [`src/engine/audio.js`](../../src/engine/audio.js)), so **no audio files are
required** — it's fully playable and demoable without anything in this folder.

## To use real sound files instead

1. Drop audio files here, e.g. `select.mp3`, `advance.mp3`, `positive.mp3`,
   `negative.mp3`, `pop.mp3`, `hover.mp3`.
2. In `src/data/config.js`, add a `sounds` map under `ASSETS`.
3. In `src/engine/audio.js`, replace each `blip(...)` call with
   `new Audio(ASSETS.sounds.xxx).play()`.

Keep files short (< 300 ms) and quiet — this is a calm game for children.
