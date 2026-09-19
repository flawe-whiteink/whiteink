# WhiteInk

**Where stories take shape.** WhiteInk is a private, local-first writing studio for novels,
screenplays, songs and films — for Windows and Android.

- **Website:** https://flawe-whiteink.github.io/whiteink/
- **Download the beta:** https://github.com/flawe-whiteink/whiteink/releases
- **Report a bug / suggest a feature:** https://github.com/flawe-whiteink/whiteink/issues/new

This repository holds the WhiteInk website (a static site: `index.html`, `styles.css`, `script.js`)
and hosts the app installers as GitHub Releases.

## Publishing a new version

1. Create a release (e.g. `v0.1.1`) and attach the Windows installer and the Android APK.
2. Update the two URLs and the version/date in `downloads.json`.
3. Push to `main` — GitHub Pages redeploys the site automatically.

## Preview locally

```
python -m http.server 8080
```
