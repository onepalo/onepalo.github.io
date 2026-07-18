# Publishing Guide

This application is published at `https://onepalo.github.io/` from the `onepalo/onepalo.github.io` repository.

## Deployment Model

- The repository is a GitHub user Pages repository, so the site is served from the domain root.
- `.github/workflows/deploy-pages.yml` runs on every push to `main`.
- The workflow installs dependencies from `package-lock.json`, runs lint and build checks, then deploys only the generated `dist/` artifact.
- The application uses hash navigation, so GitHub Pages does not need server-side route rewrites.

## One-Time GitHub Setup

In the target repository, open **Settings -> Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Do not leave the source set to a branch. A branch deployment would serve Vite source files rather than the compiled application.

## Before Publishing

From the application directory, run:

```powershell
npm ci
npm run lint
npm run build
```

All three commands must complete successfully. Review published content, especially career facts, named references, external links, and images.

## Replacing the Published Repository

The site repository may be completely replaced while keeping its `.git` directory and history. Copy the application project into a clean clone of `onepalo/onepalo.github.io`, excluding dependencies and generated output. The committed `.gitignore` protects local-only material such as personal data, source CVs, cover-letter drafts, and verification notes.

Before committing, verify the replacement:

```powershell
git status
git diff --cached --stat
```

Then publish:

```powershell
git add -A
git commit -m "Describe the site update"
git push origin main
```

## After Publishing

1. Open the **Actions** tab in `onepalo/onepalo.github.io`.
2. Confirm the **Deploy to GitHub Pages** workflow completed successfully.
3. Open `https://onepalo.github.io/` in a private browser window.
4. Check the landing page, each planet route, external media links, and mobile layout.

## Rollback

To restore the preceding published version, revert the deployment commit and push the result:

```powershell
git revert <deployment-commit>
git push origin main
```

GitHub Actions will deploy the reverted version automatically.