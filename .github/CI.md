# CI and release boundaries

CI runs for pull requests and pushes to `master`/`codex/**`, with read-only
permissions, no secrets, no publishing and no pull_request_target execution.
Node 22/24 run locked dev dependencies, lint and all unit tests. Node 14.21.3/20
exercise the actual clean-installed production tarball because the declared runtime
engine includes legacy Node; modern Jest itself cannot run on Node 14.

Package smoke packs without lifecycle scripts, audits the actual archive for a
strict member allowlist and private/credential patterns, installs it into an empty
consumer with no source-tree dependency lookup, and runs fake WebSocket recovery,
replay/duplicate/millisecond and shutdown checks against the installed API.

`publish.yml` remains separate and tag-only (`v*`). No CI action creates a tag,
updates a version or publishes a package. Before a future release, review that the
tag matches package.json, pin the intended npm tool version, and run the package
smoke gate before publish. No release is performed by this change.
