"""
yaml_parser.py — Minimal YAML parser/writer for Myna config files.

Handles the subset of YAML used in Myna configs:
  - Key-value pairs (strings, booleans, integers, empty values)
  - Nested objects up to 3 levels deep
  - Inline lists: [a, b, c]
  - Block lists of scalars
  - Block lists of objects
  - Comments (lines starting with #)
  - Quoted strings (double or single quotes)

Does NOT handle: anchors/aliases, multi-doc, multi-line strings, flow mappings,
timestamps, null, nested inline lists/objects.
"""

import re


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _coerce(value: str):
    """Convert a raw scalar string to the appropriate Python type."""
    if value == "true":
        return True
    if value == "false":
        return False
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    return value


def _strip_inline_comment(raw: str) -> str:
    """
    Remove a trailing inline comment from a value string.
    Only removes ' # ...' that appears outside of quotes.
    """
    in_quote = None
    i = 0
    while i < len(raw):
        ch = raw[i]
        if in_quote:
            if ch == in_quote:
                in_quote = None
        else:
            if ch in ('"', "'"):
                in_quote = ch
            elif ch == "#" and i > 0 and raw[i - 1] == " ":
                return raw[:i].rstrip()
        i += 1
    return raw


def _parse_scalar(raw: str):
    """Parse a scalar value string (after stripping inline comments) into a Python value."""
    raw = _strip_inline_comment(raw).strip()

    # Quoted string
    if len(raw) >= 2 and (
        (raw[0] == '"' and raw[-1] == '"') or
        (raw[0] == "'" and raw[-1] == "'")
    ):
        return raw[1:-1]

    if raw == "":
        return ""

    return _coerce(raw)


def _parse_inline_list(raw: str) -> list:
    """
    Parse an inline list like [auth, AM, auth-mig] or [ auth , AM ].
    raw must already have inline comments stripped.
    Handles quoted items. Does not handle nested lists/objects.
    """
    inner = raw.strip()
    if not (inner.startswith("[") and inner.endswith("]")):
        raise ValueError(f"Not a valid inline list: {raw!r}")

    inner = inner[1:-1].strip()
    if not inner:
        return []

    items = []
    current = ""
    in_quote = None
    for ch in inner:
        if in_quote:
            if ch == in_quote:
                in_quote = None
            else:
                current += ch
        else:
            if ch in ('"', "'"):
                in_quote = ch
            elif ch == ",":
                items.append(current.strip())
                current = ""
            else:
                current += ch
    items.append(current.strip())

    result = []
    for item in items:
        item = item.strip()
        if len(item) >= 2 and (
            (item[0] == '"' and item[-1] == '"') or
            (item[0] == "'" and item[-1] == "'")
        ):
            result.append(item[1:-1])
        else:
            result.append(_coerce(item))
    return result


def _find_closing_bracket(s: str) -> int:
    """Return index of the ']' that closes the opening '[' at index 0."""
    depth = 0
    in_quote = None
    for i, ch in enumerate(s):
        if in_quote:
            if ch == in_quote:
                in_quote = None
        else:
            if ch in ('"', "'"):
                in_quote = ch
            elif ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    return i
    return len(s) - 1


def _extract_inline_list_str(val_raw: str) -> str:
    """
    Given a value string that starts with '[', extract just the list part
    (up to and including the matching ']'), ignoring trailing inline comments.
    """
    close = _find_closing_bracket(val_raw)
    return val_raw[:close + 1]


# ---------------------------------------------------------------------------
# Parser core
# ---------------------------------------------------------------------------

def _parse_lines(lines: list) -> dict:
    """
    Parse a list of raw YAML lines into a Python dict.

    State machine approach:
      - stack: list of (indent, dict_ref) — current ancestor mapping chain
      - list_stack: list of dicts describing active block-list contexts
    """
    root = {}
    # stack[-1] = (indent, dict) — current dict context
    stack = [(-1, root)]

    # list_stack entries:
    #   {
    #     "key_indent":   indent of the key owning the list,
    #     "dash_indent":  indent of the '-' items,
    #     "parent_dict":  the dict that owns the list key,
    #     "list_key":     the key whose value is the list,
    #     "list_ref":     the actual Python list,
    #     "current_item": current object dict (or None for scalar items),
    #   }
    list_stack = []

    def get_or_make_list(parent_dict, key):
        """Ensure parent_dict[key] is a list; return it."""
        existing = parent_dict.get(key)
        if isinstance(existing, list):
            return existing
        lst = []
        parent_dict[key] = lst
        return lst

    for raw_line in lines:
        stripped = raw_line.rstrip("\n")
        lstripped = stripped.lstrip()

        # Skip blank lines and comment lines
        if not lstripped or lstripped.startswith("#"):
            continue

        indent = len(stripped) - len(lstripped)

        # ----------------------------------------------------------------
        # Block list item: starts with "- "
        # ----------------------------------------------------------------
        if lstripped.startswith("- ") or lstripped == "-":
            dash_indent = indent
            item_content = lstripped[2:].strip() if lstripped.startswith("- ") else ""

            # Pop list_stack entries that are at a deeper level than current
            while list_stack and list_stack[-1]["dash_indent"] > dash_indent:
                list_stack.pop()

            # Pop dict stack entries that are deeper than current indent
            while len(stack) > 1 and stack[-1][0] >= dash_indent:
                stack.pop()

            # Find which list context we're in.
            if list_stack and list_stack[-1]["dash_indent"] == dash_indent:
                # Continuing an existing list at the same indent level.
                ls = list_stack[-1]
                the_list = ls["list_ref"]
            else:
                # New list: find the parent dict and the key whose value should
                # become this list.
                #
                # Case A: stack[-1][1] is an empty-dict placeholder pushed by
                #   "key:" — it IS the value being turned into a list.
                #   The owning dict is stack[-2][1] and the key is the one that
                #   maps to this empty dict.
                #
                # Case B: the list key already has a list value in stack[-1][1]
                #   (shouldn't happen on first encounter, but handle gracefully).
                #
                # Case C: stack[-1][1] has an empty-dict placeholder as one of
                #   its values (the last one added).

                list_key = None
                list_ref = None
                owner_dict = None

                top_dict = stack[-1][1]

                # Case A: top_dict itself is an empty-dict placeholder for a key
                # in the parent dict.
                if len(top_dict) == 0 and len(stack) >= 2:
                    # Find the key in stack[-2][1] that maps to top_dict.
                    parent_of_top = stack[-2][1]
                    for k, v in parent_of_top.items():
                        if v is top_dict:
                            list_key = k
                            list_ref = []
                            parent_of_top[k] = list_ref
                            owner_dict = parent_of_top
                            # Pop the placeholder off the stack — it's now a list.
                            stack.pop()
                            break

                if list_ref is None:
                    # Case B/C: look in top_dict for an existing list or empty-dict value.
                    for k in reversed(list(top_dict.keys())):
                        v = top_dict[k]
                        if isinstance(v, list):
                            list_key = k
                            list_ref = v
                            owner_dict = top_dict
                            break
                        if isinstance(v, dict) and len(v) == 0:
                            list_key = k
                            list_ref = []
                            top_dict[k] = list_ref
                            owner_dict = top_dict
                            break

                if list_ref is None:
                    # No suitable key found — skip this item.
                    continue

                ls = {
                    "dash_indent": dash_indent,
                    "owner_dict": owner_dict,
                    "list_key": list_key,
                    "list_ref": list_ref,
                    "current_item": None,
                }
                list_stack.append(ls)
                the_list = list_ref

            # Parse the item content.
            if not item_content:
                # Bare '-' with no content — skip.
                ls["current_item"] = None
                continue

            if ":" in item_content:
                # Detect whether the colon is a key-value separator or inside a value.
                # We need the first colon that is a field separator (not inside quotes).
                colon_pos = -1
                in_quote = None
                for ci, ch in enumerate(item_content):
                    if in_quote:
                        if ch == in_quote:
                            in_quote = None
                    else:
                        if ch in ('"', "'"):
                            in_quote = ch
                        elif ch == ":":
                            # A key separator: must be followed by space or end-of-string
                            rest = item_content[ci + 1:]
                            if rest == "" or rest.startswith(" "):
                                colon_pos = ci
                                break
                            # else: colon is part of a value (e.g., URL), keep scanning
                if colon_pos != -1:
                    # First field of a block-list object
                    key = item_content[:colon_pos].strip()
                    val_raw = item_content[colon_pos + 1:].strip()
                    new_item = {}
                    the_list.append(new_item)
                    ls["current_item"] = new_item

                    # Push new_item onto the dict stack.
                    # Use dash_indent as the item's stack key: when we see a field
                    # at dash_indent+2 (e.g. indent 4 for a dash at indent 2), the
                    # stack[-1] entry at dash_indent will not be popped (since 4 > 2).
                    # A new dash at the same dash_indent WILL pop it (>= dash_indent).
                    while len(stack) > 1 and stack[-1][0] >= dash_indent:
                        stack.pop()
                    stack.append((dash_indent, new_item))

                    # Parse the first field's value.
                    if val_raw == "":
                        new_item[key] = ""
                    elif val_raw.startswith("["):
                        list_str = _extract_inline_list_str(val_raw)
                        new_item[key] = _parse_inline_list(list_str)
                    else:
                        new_item[key] = _parse_scalar(val_raw)
                else:
                    # Scalar item that contains a colon but no key-value separator.
                    ls["current_item"] = None
                    the_list.append(_parse_scalar(item_content))
            else:
                # Plain scalar list item (e.g., "- Sarah Chen")
                ls["current_item"] = None
                the_list.append(_parse_scalar(item_content))

            continue

        # ----------------------------------------------------------------
        # Key-value line
        # ----------------------------------------------------------------

        # Pop list_stack for any lists whose dash_indent >= current indent.
        while list_stack and list_stack[-1]["dash_indent"] >= indent:
            list_stack.pop()

        # Pop dict stack for any dicts at >= current indent.
        while len(stack) > 1 and stack[-1][0] >= indent:
            stack.pop()

        # Find the colon that separates key from value (outside quotes).
        colon_pos = -1
        in_quote = None
        for i, ch in enumerate(lstripped):
            if in_quote:
                if ch == in_quote:
                    in_quote = None
            else:
                if ch in ('"', "'"):
                    in_quote = ch
                elif ch == ":":
                    rest = lstripped[i + 1:]
                    if rest == "" or rest.startswith(" "):
                        colon_pos = i
                        break

        if colon_pos == -1:
            continue  # No valid key separator found.

        key = lstripped[:colon_pos].strip()
        val_raw = lstripped[colon_pos + 1:].strip()

        # Strip trailing inline comment from val_raw BEFORE checking for '['.
        val_clean = _strip_inline_comment(val_raw).strip()

        # A value that is only a comment (e.g. "key:   # some comment") is empty.
        if val_clean.startswith("#"):
            val_clean = ""

        parent_dict = stack[-1][1]

        if val_clean == "":
            # Empty value or nested mapping.
            # Push an empty dict placeholder; will be converted to "" later if no children.
            # Store indent of this key so that children (at indent+2) are deeper and
            # siblings (at same indent) pop this entry.
            new_dict = {}
            parent_dict[key] = new_dict
            stack.append((indent, new_dict))
            # Clear list context when entering a new dict scope.
            while list_stack and list_stack[-1]["dash_indent"] >= indent:
                list_stack.pop()
        elif val_clean.startswith("["):
            list_str = _extract_inline_list_str(val_clean)
            parent_dict[key] = _parse_inline_list(list_str)
        else:
            parent_dict[key] = _parse_scalar(val_clean)

    # Post-process: convert remaining empty-dict placeholders to empty strings.
    def fix_empty_dicts(obj):
        if isinstance(obj, dict):
            for k in list(obj.keys()):
                v = obj[k]
                if isinstance(v, dict):
                    if len(v) == 0:
                        obj[k] = ""
                    else:
                        fix_empty_dicts(v)
                elif isinstance(v, list):
                    for item in v:
                        if isinstance(item, dict):
                            fix_empty_dicts(item)

    fix_empty_dicts(root)
    return root


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load(file_path: str) -> dict:
    """Read a YAML file and return a Python dict."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        raise FileNotFoundError(f"Config file not found: {file_path}")

    if not lines:
        return {}

    return _parse_lines(lines)


def load_with_comments(file_path: str) -> tuple:
    """
    Read a YAML file and return (data, comments).

    comments is a list of (anchor, comment_text) tuples where:
      - anchor is the stripped text of the next non-comment, non-blank line
        after this comment block (used to re-insert at the right position)
      - anchor is "__END__" if no such line follows (end-of-file comments)
      - comment_text is the full comment line content (with leading '#')

    Comments are returned as groups: consecutive comment lines share the same anchor.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        raise FileNotFoundError(f"Config file not found: {file_path}")

    if not lines:
        return {}, []

    # Build list of (anchor, [comment_lines]) groups
    # Scan forward: when we hit a comment line, collect the block and find anchor
    stripped_lines = [l.rstrip("\n") for l in lines]
    n = len(stripped_lines)
    comments = []
    i = 0
    while i < n:
        line = stripped_lines[i]
        if line.strip().startswith("#"):
            # Start of a comment block
            block = []
            while i < n and stripped_lines[i].strip().startswith("#"):
                block.append(stripped_lines[i])
                i += 1
            # Find anchor: next non-blank, non-comment line
            j = i
            while j < n and stripped_lines[j].strip() == "":
                j += 1
            anchor = stripped_lines[j].strip() if j < n else "__END__"
            for comment_line in block:
                comments.append((anchor, comment_line))
        else:
            i += 1

    data = _parse_lines(lines)
    return data, comments


# ---------------------------------------------------------------------------
# Dump helpers
# ---------------------------------------------------------------------------

def _format_scalar(value) -> str:
    """Format a Python value as a YAML scalar string."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, str):
        if value == "":
            return '""'
        # Quote if value contains ': ', starts with special chars, or contains '#'
        needs_quote = (
            ": " in value
            or value.startswith("[")
            or value.startswith("#")
            or value.startswith('"')
            or value.startswith("'")
        )
        if needs_quote:
            return f'"{value}"'
        return value
    return str(value)


def _format_inline_list(lst: list) -> str:
    """Format a list as an inline YAML list."""
    return "[" + ", ".join(_format_scalar(item) for item in lst) + "]"


def _is_simple_list(lst: list) -> bool:
    """Return True if list contains only scalars (not dicts)."""
    return all(not isinstance(item, dict) for item in lst)


def _dump_dict(data: dict, indent: int = 0) -> list:
    """
    Recursively serialize a dict to YAML lines.
    Returns a list of strings (without trailing newlines).
    """
    lines = []
    prefix = " " * indent

    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f"{prefix}{key}:")
            lines.extend(_dump_dict(value, indent + 2))
        elif isinstance(value, list):
            if not value:
                lines.append(f"{prefix}{key}: []")
            elif _is_simple_list(value):
                lines.append(f"{prefix}{key}: {_format_inline_list(value)}")
            else:
                # Block list of objects
                lines.append(f"{prefix}{key}:")
                for item in value:
                    if isinstance(item, dict):
                        items_list = list(item.items())
                        if not items_list:
                            continue
                        # First field on the dash line
                        first_key, first_val = items_list[0]
                        if isinstance(first_val, list):
                            first_val_str = _format_inline_list(first_val)
                        elif isinstance(first_val, dict):
                            first_val_str = ""
                        else:
                            first_val_str = _format_scalar(first_val)
                        lines.append(f"{prefix}  - {first_key}: {first_val_str}")
                        # Remaining fields at indent+4
                        for k, v in items_list[1:]:
                            if isinstance(v, dict):
                                lines.append(f"{prefix}    {k}:")
                                lines.extend(_dump_dict(v, indent + 6))
                            elif isinstance(v, list):
                                if not v:
                                    lines.append(f"{prefix}    {k}: []")
                                elif _is_simple_list(v):
                                    lines.append(f"{prefix}    {k}: {_format_inline_list(v)}")
                                else:
                                    lines.append(f"{prefix}    {k}:")
                                    for sub_item in v:
                                        if isinstance(sub_item, dict):
                                            sub_items = list(sub_item.items())
                                            if sub_items:
                                                fk, fv = sub_items[0]
                                                lines.append(
                                                    f"{prefix}      - {fk}: {_format_scalar(fv)}"
                                                )
                                                for sk, sv in sub_items[1:]:
                                                    lines.append(
                                                        f"{prefix}        {sk}: {_format_scalar(sv)}"
                                                    )
                                        else:
                                            lines.append(
                                                f"{prefix}      - {_format_scalar(sub_item)}"
                                            )
                            else:
                                lines.append(f"{prefix}    {k}: {_format_scalar(v)}")
                    else:
                        lines.append(f"{prefix}  - {_format_scalar(item)}")
        else:
            lines.append(f"{prefix}{key}: {_format_scalar(value)}")

    return lines


def dump(data: dict, file_path: str, comments: list = None) -> None:
    """
    Write a Python dict to a YAML file.

    If comments is provided (as returned by load_with_comments), comments are
    re-inserted before their anchor lines in the output. Each comment is a
    (anchor, comment_text) tuple where anchor is the stripped text of the line
    the comment precedes, or "__END__" for end-of-file comments.

    Comments whose anchor is not found in the output are appended at the end.
    """
    yaml_lines = _dump_dict(data)

    if comments:
        # Group comments by anchor to avoid O(n^2) scans
        from collections import defaultdict
        anchor_map = defaultdict(list)
        end_comments = []
        for anchor, comment_text in comments:
            if anchor == "__END__":
                end_comments.append(comment_text)
            else:
                anchor_map[anchor].append(comment_text)

        output_lines = []
        inserted_anchors = set()
        for line in yaml_lines:
            stripped = line.strip()
            if stripped in anchor_map and stripped not in inserted_anchors:
                output_lines.extend(anchor_map[stripped])
                inserted_anchors.add(stripped)
            output_lines.append(line)

        # Append any comments whose anchors weren't found
        for anchor, comment_lines in anchor_map.items():
            if anchor not in inserted_anchors:
                output_lines.extend(comment_lines)
        output_lines.extend(end_comments)

        final_lines = output_lines
    else:
        final_lines = yaml_lines

    with open(file_path, "w", encoding="utf-8") as f:
        for line in final_lines:
            f.write(line + "\n")
