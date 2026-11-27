# The Museum of Our Love ❤️
A 3D romantic proposal game for Yvone (Three.js r128, bundled in assets/lib – works offline).

## Run it (use a local server, NOT double-click)
    cd museum
    python3 -m http.server 8000
then open http://localhost:8000  (or `npx serve`). To send it to her, upload the folder to Netlify / GitHub Pages / Vercel and share the link.

Quick test of the proposal: http://localhost:8000/#proposal  (skips the gallery).

## Controls
WASD / arrow keys (or on-screen joystick on phones) to walk; drag the mouse / screen to rotate the camera. 🔊 button toggles music.

## Change photos
Put images in assets/photos/ and edit photos.js (file, caption, wall north/south, x position, order). Aspect ratios are kept automatically.
Currently photo1-8 are the 8 pictures you sent (resized). Unused: the video-call screenshots, the uniform photo, etc. – add them as photo9.jpg… and a new line in photos.js.

## Notes
- Characters are procedurally built rigged avatars (no external models → no licence issues). Walking, kneeling, ring offer, lift and spin are custom-coded animations.
- Music is generated live with WebAudio (no mp3 needed).
- Floor reflections are a mirrored copy of the museum under a glossy floor.
