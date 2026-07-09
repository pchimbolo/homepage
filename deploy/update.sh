#!/usr/bin/env bash
#
# update.sh — merge the latest STABLE upstream Homepage release into our fork.
#
# This ONLY merges. It does NOT build or deploy. Review the merge, make sure things
# look sane, then run deploy.sh when you're ready to ship. Merging and deploying are
# deliberately separate so a merge that compiles but regressed can't reach prod
# automatically.
#
# We track upstream `main` (tagged releases), not `dev` (bleeding edge). Change
# UPSTREAM_BRANCH below only if you really want in-development code.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)" # the homepage-src git repo

UPSTREAM_URL="https://github.com/gethomepage/homepage.git"
UPSTREAM_BRANCH="main" # stable releases; use "dev" for bleeding edge
OUR_BRANCH="config-editor"

echo "=== Homepage upstream merge  (upstream/$UPSTREAM_BRANCH -> $OUR_BRANCH) ==="
cd "$REPO"

# A merge on a dirty tree is a mess to reason about — refuse it.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: working tree has uncommitted changes. Commit or stash them first:"
  git status --short
  exit 1
fi

if ! git remote | grep -qx upstream; then
  echo "Adding upstream remote -> $UPSTREAM_URL"
  git remote add upstream "$UPSTREAM_URL"
fi

echo "Switching to $OUR_BRANCH…"
git checkout "$OUR_BRANCH"

echo "Fetching upstream…"
git fetch upstream --tags

echo "Merging upstream/$UPSTREAM_BRANCH…"
if git merge "upstream/$UPSTREAM_BRANCH" -m "Merge upstream Homepage ($UPSTREAM_BRANCH) into $OUR_BRANCH"; then
  echo
  echo "✅ Merge clean. Review the changes, then deploy with:"
  echo "     $SCRIPT_DIR/deploy.sh"
else
  echo
  echo "⚠️  Merge conflicts — resolve them by hand. Our customizations most likely to clash:"
  echo "     src/utils/config/{service-helpers,api-response,widget-helpers}.js   (enable/disable filtering)"
  echo "     src/components/config-editor/  src/utils/config-editor/  src/pages/api/config-editor/  (editor + icon picker)"
  echo
  echo "   After editing the conflicted files:"
  echo "     cd $REPO && git add -A && git merge --continue"
  echo "   Then deploy with: $SCRIPT_DIR/deploy.sh"
  echo "   (To abandon this merge instead: cd $REPO && git merge --abort)"
  exit 1
fi
