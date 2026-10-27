# Dcorhome repository workflow

- Work directly on `main` by default. It is the only working and deployment branch.
- Do not create feature, diagnostic, backup or temporary branches unless the user explicitly requests one.
- Do not automatically switch branches. If the checkout is unexpectedly on another branch, inspect the state and obtain explicit direction before switching.
- Preserve existing commits and completed work. Never reset shared history or force-push.
- Run TypeScript and production build checks before committing release changes. Do not push changes that fail required checks.
- Push only when the user requests it, using a normal `git push origin main`.
- Never commit environment secrets, private exports or customer assets. Only `.env.example` may be tracked as an environment template.
- Authentication uses the existing MongoDB database and Better Auth, with no public signup. Do not restore Clerk or provider switching.
- Preserve public website independence from MongoDB and do not change unrelated UI, branding, catalogue, Studio or SEO.

Normal user workflow:

```sh
git add .
git commit -m "my changes"
git push origin main
```
