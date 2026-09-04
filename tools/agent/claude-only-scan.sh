#!/usr/bin/env bash
#
# claude-only-scan.sh — find Claude-only language on this repo's PROSPECTIVE
# instruction surfaces (plan docs/plans/codex-claude-parity.md, A0.4 / A3.6 / A5.6).
#
# "Prospective" = anything a future session reads as instruction (adapters, the shared
# contract, guides, open tickets' AC/DoD/contract bodies, plan docs). "Historical" =
# dated records of what happened; those go in the allow file beside this script with a
# reason, and are reported but do not count toward the verdict.
#
# QUALIFIED. What the campaign forbids is an UNQUALIFIED Claude-only path, setting or
# tool name — a line that hands a future session one host's spelling as if it were the
# only one. A line that scopes the name to its host is documentation of a host
# difference, not drift. So a hit is "qualified" when its own line contains one of a
# CLOSED list of host-scoping phrases, matched as fixed strings, case-sensitive:
#
#     Claude Code        Claude-only        Claude spelling        Claude Code's
#
# Nothing else qualifies. In particular the bare word `Claude` does not: "the Claude
# coordinator and the Codex coordinator both dispatch from `.claude/agents/`" mentions
# the host and still hands Codex a path that is not its own. Naming the host is not the
# same act as scoping the name TO that host, and only the second is documentation. The
# lowercase `claude` inside `~/.claude/skills/` or `.claude/agents` qualifies nothing
# either — a path is not an explanation. Qualified hits are reported in their own
# section and do not count toward the verdict.
#
# To add a phrase, add it to `qualifiers` below AND to this list and the --help text.
# Keep the list short and keep each entry unambiguous about which host it scopes to; a
# phrase that could introduce a rule for both hosts belongs nowhere near it.
#
# Precedence, and the one place the rule is deliberately blunt: allowlisted beats
# qualified (an allowlisted file's hits all stay under `allowlisted:`), and the test is
# per LINE, not per sentence — a long line can carry a scoped mention and an unscoped
# one and still read as qualified. That is the cost of a grep-shaped gate; the
# reviewer's read of the diff is what catches the rest.
#
# SCOPE (tracked files only, from `git ls-files -z`):
#   - every *.md in the repo
#   - backlog/config.yml
#   - backlog/tasks/*.md (a subset of the *.md rule, named because it is the point)
# FILTERED OUT BY THIS SCRIPT (they hold *.md files that would otherwise be scanned):
#   - addons/     vendored upstream
#   - .claude/    the Claude adapter's own host configuration
#   - tools/mcp/  vendored MCP launcher tree
#   - this script and tools/agent/claude-only-scan.allow — a scanner that names its
#     own patterns must not red itself. NOTE: no other path under tools/agent/ is
#     filtered, so a future tools/agent/*.md WOULD be scanned.
# NOT FILTERED, because the scope rule above already excludes them: .godot/ (untracked
# editor cache anyway), .mcp.json, and every other non-.md tracked file.
#
# Modes: default (allow file and qualification applied) | --no-allowlist (known-bad
# control, A5.6: NOTHING is exempt there — every hit in scope counts, allowlisted and
# qualified alike, so the control keeps failing while any pattern exists anywhere) | -h.
# Output ends in exactly one `VERDICT: PASS|FAIL` line. Exit is 0 for BOTH verdicts —
# read the verdict from the output, never from `$?`. Exit 2 means the scan did not
# happen or cannot be trusted: a usage error, an unresolvable repo root, a missing or
# malformed allow file, or an empty scope.

set -u
LC_ALL=C
export LC_ALL

# printf, not a heredoc: a heredoc needs a temp file the sandbox may deny.
usage() {
	printf '%s\n' \
		'usage: claude-only-scan.sh [--no-allowlist] [-h|--help]' \
		'' \
		"Scans this repo's prospective instruction surfaces for Claude-only language." \
		'' \
		'  (no args)        apply tools/agent/claude-only-scan.allow and the qualified' \
		'                   rule; only un-allowlisted, unqualified hits count toward the' \
		'                   verdict' \
		'  --no-allowlist   ignore both exemptions; every hit counts (the known-bad' \
		'                   control: a scan that finds nothing in this mode is broken,' \
		'                   not clean)' \
		'  -h, --help       this text' \
		'' \
		'QUALIFIED: a Claude-only name is unqualified when nothing on its line scopes it to' \
		'that host. A hit is qualified only when its line carries one of these exact' \
		'phrases (fixed strings, case-sensitive):' \
		'' \
		'    Claude Code      Claude-only      Claude spelling      Claude Code'"'"'s' \
		'' \
		'Nothing else qualifies — not the bare word Claude (naming the host is not scoping' \
		'the name to it), and not the lowercase claude inside a path. Qualified hits are' \
		'reported separately and do not count toward the verdict.' \
		'' \
		'Prints one VERDICT: PASS|FAIL line and exits 0 on both verdicts.' \
		'Exit 2: the scan did not happen (usage error, unresolvable repo root, missing or' \
		'malformed allow file, empty scope).'
}

use_allowlist=1
while [ $# -gt 0 ]; do
	case "$1" in
	--no-allowlist)
		use_allowlist=0
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		printf 'claude-only-scan.sh: unknown argument: %s\n' "$1" >&2
		usage >&2
		exit 2
		;;
	esac
	shift
done

self_sh="tools/agent/claude-only-scan.sh"
self_allow="tools/agent/claude-only-scan.allow"

# Resolve the repo root from this script's own location, never the caller's cwd: the
# scope, the allow file and the verdict all belong to this checkout. Take
# ${BASH_SOURCE[0]}, follow one level of symlink if readlink resolves one, ask git for
# that directory's toplevel, then assert the scanner really sits at $root/$self_sh —
# so a resolved-but-wrong root is an error, not a silently mistargeted scan.
src=${BASH_SOURCE[0]}
if link=$(readlink "$src" 2>/dev/null) && [ -n "$link" ]; then
	case "$link" in
	/*) src=$link ;;
	*) src=$(dirname "$src")/$link ;;
	esac
fi
script_dir=$(cd "$(dirname "$src")" 2>/dev/null && pwd)
if [ -z "$script_dir" ]; then
	printf 'claude-only-scan.sh: cannot resolve this script directory from %s\n' "$src" >&2
	exit 2
fi
root=$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)
if [ -z "$root" ]; then
	printf 'claude-only-scan.sh: cannot resolve the repo root from %s\n' "$script_dir" >&2
	exit 2
fi
cd "$root" || exit 2
if [ ! -f "$self_sh" ]; then
	printf 'claude-only-scan.sh: resolved repo root %s has no %s\n' "$root" "$self_sh" >&2
	exit 2
fi

# The patterns, as fixed strings. One reported line per (file, line, pattern).
patterns=(
	'.claude/settings.local.json'
	'--permission-mode'
	'AskUserQuestion'
	'~/.claude/skills/'
	'mcp__'
	'.claude/agents'
)
pattern_count=${#patterns[@]}

# --- allow file -------------------------------------------------------------
allow_paths=()
allow_hits=()
if [ "$use_allowlist" -eq 1 ]; then
	if [ ! -f "$self_allow" ]; then
		printf 'claude-only-scan.sh: allow file not found: %s\n' "$self_allow" >&2
		printf 'claude-only-scan.sh: run with --no-allowlist to scan without it\n' >&2
		exit 2
	fi
	while IFS= read -r line || [ -n "$line" ]; do
		case "$line" in
		'' | '#'*) continue ;;
		esac
		# Every entry states WHY the file is historical; a bare path is not an entry.
		entry_path=${line%%$'\t'*}
		entry_reason=""
		case "$line" in
		*$'\t'*) entry_reason=${line#*$'\t'} ;;
		esac
		if [ -z "$entry_path" ] || [ -z "$entry_reason" ]; then
			printf 'claude-only-scan.sh: %s: entry needs <path><TAB><reason>: %s\n' \
				"$self_allow" "$line" >&2
			exit 2
		fi
		allow_paths+=("$entry_path")
		allow_hits+=(0)
	done <"$self_allow"
fi
allow_count=${#allow_paths[@]}

# Index of $1 in allow_paths, or -1. Sets ALLOW_IDX.
allow_index() {
	ALLOW_IDX=-1
	[ "$use_allowlist" -eq 1 ] || return 1
	ai=0
	while [ "$ai" -lt "$allow_count" ]; do
		if [ "${allow_paths[$ai]}" = "$1" ]; then
			ALLOW_IDX=$ai
			return 0
		fi
		ai=$((ai + 1))
	done
	return 1
}

# --- scope ------------------------------------------------------------------
# NUL-delimited, so a name with a quote, a backslash, a newline or a non-ASCII byte is
# scanned rather than skipped as a C-quoted string. The trailing sentinel record
# carries git's own exit status out of the process substitution.
files=()
ls_sentinel='claude-only-scan:ls-files-status='
ls_status=""
while IFS= read -r -d '' f; do
	case "$f" in
	"$ls_sentinel"*)
		ls_status=${f#"$ls_sentinel"}
		continue
		;;
	esac
	case "$f" in
	addons/* | .claude/* | tools/mcp/*) continue ;;
	"$self_sh" | "$self_allow") continue ;;
	esac
	case "$f" in
	*.md | backlog/config.yml) ;;
	*) continue ;;
	esac
	files+=("$f")
done < <(
	git ls-files -z
	printf '%s%s\0' "$ls_sentinel" "$?"
)

if [ "$ls_status" != "0" ]; then
	printf 'claude-only-scan.sh: git ls-files failed (status %s); scope is unusable\n' \
		"${ls_status:-unknown}" >&2
	exit 2
fi

file_count=${#files[@]}
if [ "$file_count" -eq 0 ]; then
	printf 'claude-only-scan.sh: no files in scope under %s; refusing to report a verdict\n' \
		"$root" >&2
	exit 2
fi

# --- scan -------------------------------------------------------------------
hit_lines=""
allow_lines=""
qual_lines=""
hit_n=0
allow_n=0
qual_n=0

# The closed list of host-scoping phrases (see QUALIFIED in the header). Fixed strings,
# case-sensitive, substring — not words: these are phrases, and a phrase's own spacing
# and punctuation are the boundary. `Claude Code's` is listed for the reader even though
# `Claude Code` already covers it as a substring; the list is documentation first.
qualifiers=(
	'Claude Code'
	'Claude-only'
	'Claude spelling'
	"Claude Code's"
)
qualifier_args=()
for q in "${qualifiers[@]}"; do
	qualifier_args+=(-e "$q")
done

# True when $1 (a whole source line) carries one of those phrases.
line_qualified() {
	printf '%s\n' "$1" | grep -qF "${qualifier_args[@]}"
}

for f in "${files[@]}"; do
	if allow_index "$f"; then
		file_allowed=1
		file_aidx=$ALLOW_IDX
	else
		file_allowed=0
		file_aidx=-1
	fi
	for p in "${patterns[@]}"; do
		# `grep -n` keeps the matched line beside its number: the qualified test reads
		# the line, so `cut`ting the text away here would throw away the evidence.
		matches=$(grep -nF -e "$p" -- "$f")
		[ -n "$matches" ] || continue
		while IFS= read -r m; do
			[ -n "$m" ] || continue
			ln=${m%%:*}
			text=${m#*:}
			entry="  $f:$ln: $p"
			if [ "$file_allowed" -eq 1 ]; then
				allow_lines="$allow_lines$entry"$'\n'
				allow_n=$((allow_n + 1))
				allow_hits[$file_aidx]=$((${allow_hits[$file_aidx]} + 1))
			elif [ "$use_allowlist" -eq 1 ] && line_qualified "$text"; then
				qual_lines="$qual_lines$entry"$'\n'
				qual_n=$((qual_n + 1))
			else
				hit_lines="$hit_lines$entry"$'\n'
				hit_n=$((hit_n + 1))
			fi
		done < <(printf '%s\n' "$matches")
	done
done

# An allow-file entry that names a path outside the scan scope, or one that no longer
# matches any hit, is a silently weakened gate. Neither changes the verdict or the
# exit code; both go to stderr. This counter stays truthful under the qualified rule
# only because allowlisted takes precedence: every hit in an allowlisted file is
# counted here, whether or not its line says Claude, so "produced no hits" still means
# the file has stopped matching rather than that its hits went qualified.
if [ "$use_allowlist" -eq 1 ]; then
	ai=0
	while [ "$ai" -lt "$allow_count" ]; do
		ap=${allow_paths[$ai]}
		in_scope=0
		for f in "${files[@]}"; do
			if [ "$f" = "$ap" ]; then
				in_scope=1
				break
			fi
		done
		if [ "$in_scope" -eq 0 ]; then
			printf 'claude-only-scan.sh: warning: allow-file entry is not in scan scope: %s\n' \
				"$ap" >&2
		elif [ "${allow_hits[$ai]}" -eq 0 ]; then
			printf 'claude-only-scan.sh: warning: allow-file entry produced no hits, prune it: %s\n' \
				"$ap" >&2
		fi
		ai=$((ai + 1))
	done
fi

# --- report -----------------------------------------------------------------
if [ "$use_allowlist" -eq 1 ]; then
	mode="allow file and qualified rule applied"
else
	mode="no allowlist, no qualification (known-bad control)"
fi
printf 'claude-only-scan: %s files in scope, %s patterns, mode: %s\n\n' \
	"$file_count" "$pattern_count" "$mode"

printf 'hits:\n'
if [ -n "$hit_lines" ]; then
	printf '%s' "$hit_lines"
else
	printf '  (none)\n'
fi

printf '\nqualified:\n'
if [ -n "$qual_lines" ]; then
	printf '%s' "$qual_lines"
elif [ "$use_allowlist" -eq 1 ]; then
	printf '  (none)\n'
else
	printf '  (not applied in this mode)\n'
fi

printf '\nallowlisted:\n'
if [ -n "$allow_lines" ]; then
	printf '%s' "$allow_lines"
elif [ "$use_allowlist" -eq 1 ]; then
	printf '  (none)\n'
else
	printf '  (not applied in this mode)\n'
fi

printf '\nhits: %s un-allowlisted, %s allowlisted, %s qualified\n' \
	"$hit_n" "$allow_n" "$qual_n"
if [ "$hit_n" -eq 0 ]; then
	printf 'VERDICT: PASS\n'
else
	printf 'VERDICT: FAIL\n'
fi
exit 0
