# nikita050900.github.io

Personal site. Plain HTML and CSS, no build step.

## Publish (free, ~5 minutes)

1. On GitHub, create a new public repository named exactly `nikita050900.github.io`.
2. Upload every file in this folder (keep the `work/` subfolder). Drag and drop onto the repo page works, or:
   ```
   git init && git add . && git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/nikita050900/nikita050900.github.io.git
   git push -u origin main
   ```
3. Repo Settings > Pages > Source: Deploy from a branch, Branch: main, folder: / (root). Save.
4. In a minute or two the site is live at https://nikita050900.github.io

## Editing

- `index.html`: home, work cards, publications.
- `work/*.html`: the three writeups.
- `cv.html`: CV page.
- `style.css`: all styling. Georgia headers, system sans body, light and dark mode.

Add a custom domain later (if ever) under Settings > Pages > Custom domain; nothing in the files needs to change.
