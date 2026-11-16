# Development

- Run `npm ci`, `npm run build`, and `npm test`. Build requires `REPLICATE_API_TOKEN` and fetches public model metadata. No lint or typecheck script is configured.
- `npm pack` exercises the prepack/postpack hooks; the tarball must contain `models.json`, `models-lite.json`, and `stats.json`.
- Keep this file current when build, packaging, or release behavior changes.

# Publishing

- The daily `build_and_publish.yml` workflow publishes to npm, then opens an artifact-update PR. Manual dispatch also publishes.
- Configure an npm trusted publisher for package `all-the-public-replicate-models`: GitHub owner `replicate`, repository `all-the-public-replicate-models`, workflow filename `build_and_publish.yml`, no environment. Allow direct publishing. See https://docs.npmjs.com/trusted-publishers/.
- Publishing uses GitHub OIDC, not `NPM_TOKEN`. Keep `REPLICATE_API_TOKEN` configured for the build.
- After configuring the publisher and merging the workflow change, re-enable the inactive GitHub workflow and verify a manual release before relying on its schedule.
