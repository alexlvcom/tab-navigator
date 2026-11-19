# Agent instructions

## Start From The Latest Code

- Before any change, run `git fetch --tags` and `git pull --ff-only` on the working branch and build on top of the result. Other machines and agent sessions push commits, tags, and releases, so never edit, build, version, install, or deploy a stale checkout.
- Choose a new version only after comparing it with the latest remote tags and releases; never reuse a released version or build one older than the published release.
- Fetch again before building, installing, committing, or pushing. If the remote moved, pull and rebuild first.
- If the pull cannot fast-forward, stop and report it. Do not continue on old code, and do not force-push.
- Shared standard: "Start From The Latest Code" in the AlexLV app standards (`docs/windows-apps-common-standards.md` and `docs/mobile-apps-common-standards.md` in alexlv.com).

## Publishing a release

When asked to publish, release or ship the latest version to the stores, follow the **Releasing** section of `README.md`:

1. Check that `package.json`, both manifests and `CHANGELOG.md` have the new version. If they don't, ask which version to release instead of guessing.
2. Make sure the work is committed and pushed to `origin/master`.
3. Run `npm run release:dry-run` and check the notes it prints.
4. Run `npm run release`.
5. Run `npm run release:status`, then add a row for each store to the **Store review times** table in `README.md`. Fill in the approval time once a store approves.

Never sign Firefox versions without `--channel=listed`. Never copy credentials from `~/.config/tab-navigator/` into the repo.

## Third-Party Accounts And Setups

When adding, changing, or removing a third-party service, integration, account, project, billing arrangement, or provider setup for this project, update the private AlexLV app directory in the same task. Update the relevant app entry's `details.third_party` in `public/apps.json` and the matching section in `public/docs/third-party-accounts.md`. For a project without an app card, update the inventory document without adding a card unless requested. Include the provider, purpose, environment, project or account identity, and relevant billing details when known. Remove or correct obsolete details and distinguish confirmed facts from information that could not be verified. Never put passwords, API keys, tokens, private keys, or other secrets in the directory, Git, or logs.

The directory checkout is `~/sites/alexlv.com` on the home PC or `~/source/alexlvcom` on the work laptop. Follow its `AGENTS.md`, deploy changes to the configured DEV site, and verify the updated protected page and document before reporting the task complete. Include the directory repository in the session's final Git sweep.
