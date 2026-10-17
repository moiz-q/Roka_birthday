# Happy Birthday, Roka

A small birthday page with warm autumn colors. Plain HTML, CSS and JavaScript, no build step, so GitHub Pages can serve it as is.

## What's on the page

- A few leaves drifting gently in the background
- An envelope that opens into a personal letter
- A looping photo carousel of favorite moments, each with a caption (tap a photo to see it full size)
- A cake with candles to blow out

Works on phones and desktops, and respects the "reduce motion" accessibility setting.

## Editing the message

Open `index.html` and look for `EDIT YOUR MESSAGE HERE`.

## Adding photos to the carousel

1. Upload your photos into the `images` folder.
2. Open `memories.js` and add one line per photo with its file name and a short caption, for example:
   `{ photo: "images/beach-day.jpg", caption: "That one beach day" },`

Photos show in the order listed. Until a photo is added, its card shows a placeholder.

## Publishing on GitHub Pages

1. On GitHub, open the repo's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Pick the branch that has these files and the `/ (root)` folder, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Previewing locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.
