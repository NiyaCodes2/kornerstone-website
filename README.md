# Kornerstone Property Solutions — Custom Site

This is a static HTML/CSS/JS website starter for KSPS.

## Files
- `index.html` — homepage structure
- `styles.css` — full visual system
- `main.js` — simple interactive accordion
- `assets/` — generated KSPS service images

## First edits to make
1. Replace every `YOUR_GOOGLE_FORM_URL` in `index.html` with your real Google Form URL.
2. Update contact info in the footer.
3. Replace or refine any text you want.
4. Swap images inside `/assets` whenever you have final brand photography.

## GitHub setup
1. Create a new repository named `kornerstone-website`.
2. Upload everything inside this folder to the repository root.
3. Commit the files.

## Free hosting option A — GitHub Pages
1. Open repository Settings → Pages.
2. Under Build and deployment, choose `Deploy from a branch`.
3. Choose `main` and `/root`.
4. Save.
5. GitHub will provide a temporary `github.io` URL.
6. Later, add `kornerstone-ps.com` under Custom domain.

## Free hosting option B — Cloudflare Pages
1. Create/login to Cloudflare.
2. Go to Workers & Pages → Create → Pages → Connect to Git.
3. Select the GitHub repository.
4. Framework preset: None.
5. Build command: leave blank.
6. Build output directory: `/`
7. Deploy.
8. Add `kornerstone-ps.com` as a custom domain.

## Important domain note
Do not delete your Google Workspace / Gmail MX records from Squarespace DNS.
Only update the website-hosting records requested by GitHub Pages or Cloudflare.

## Design direction
The site deliberately uses a custom “trash-can” motif:
- CSS-built trash can in hero
- industrial ribbing and circular utility motifs
- premium green / cream / acid accent palette
- editorial typography
- operational B2B positioning

This can later evolve into a full web app with a backend/database without rebuilding the marketing site from scratch.


## Back Office Demo
Open `app.html` to view the new KSPS internal lead dashboard.

This version is intentionally backend-free so you can test the experience immediately:
- Add/edit/delete leads
- Lead IDs auto-generate
- Search/filter
- Dashboard counts
- Follow-up dates
- Pipeline statuses
- Browser-local storage

Important: this demo stores data only in your browser via localStorage. It is NOT yet a secure cloud database.

### Next upgrade: Supabase
When the layout/workflow feels right, replace localStorage with Supabase for:
- secure login
- shared cloud database
- multiple users
- file/photo uploads
- audit records
- proposal records
- active property records

Recommended future structure:
- `kornerstone-ps.com` = public marketing site
- `app.kornerstone-ps.com` = internal back office
