# Agent instructions

## Publishing a release

When asked to publish, release or ship the latest version to the stores, follow the **Releasing** section of `README.md`:

1. Check that `package.json`, both manifests and `CHANGELOG.md` have the new version. If they don't, ask which version to release instead of guessing.
2. Make sure the work is committed and pushed to `origin/master`.
3. Run `npm run release:dry-run` and check the notes it prints.
4. Run `npm run release`.
5. Run `npm run release:status`, then add a row for each store to the **Store review times** table in `README.md`. Fill in the approval time once a store approves.

Never sign Firefox versions without `--channel=listed`. Never copy credentials from `~/.config/tab-navigator/` into the repo.
