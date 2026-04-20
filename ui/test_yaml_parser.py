"""
test_yaml_parser.py — Tests for ui/yaml_parser.py

Run from the repo root:
    python3 ui/test_yaml_parser.py
"""

import os
import sys
import tempfile
import unittest

# Allow running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from ui.yaml_parser import load, dump, load_with_comments

EXAMPLES_DIR = os.path.join(
    os.path.dirname(__file__), "..", "agents", "config-examples"
)


def example(name):
    return os.path.join(EXAMPLES_DIR, name)


# ---------------------------------------------------------------------------
# Basic parsing — real example files
# ---------------------------------------------------------------------------

class TestBasicParsing(unittest.TestCase):

    def test_workspace_user_name(self):
        data = load(example("workspace.yaml.example"))
        self.assertEqual(data["user"]["name"], "Alex Johnson")

    def test_workspace_email_processing_toggle(self):
        data = load(example("workspace.yaml.example"))
        self.assertIs(data["features"]["email_processing"], True)

    def test_projects_count(self):
        data = load(example("projects.yaml.example"))
        self.assertEqual(len(data["projects"]), 2)

    def test_projects_first_name(self):
        data = load(example("projects.yaml.example"))
        self.assertEqual(data["projects"][0]["name"], "Auth Migration")

    def test_people_count(self):
        data = load(example("people.yaml.example"))
        self.assertEqual(len(data["people"]), 4)

    def test_people_first_relationship_tier(self):
        data = load(example("people.yaml.example"))
        self.assertEqual(data["people"][0]["relationship_tier"], "direct")

    def test_all_six_example_files_load(self):
        files = [
            "workspace.yaml.example",
            "projects.yaml.example",
            "people.yaml.example",
            "communication-style.yaml.example",
            "meetings.yaml.example",
            "tags.yaml.example",
        ]
        for fname in files:
            with self.subTest(file=fname):
                data = load(example(fname))
                self.assertIsInstance(data, dict)


# ---------------------------------------------------------------------------
# Round-trip fidelity
# ---------------------------------------------------------------------------

class TestRoundTrip(unittest.TestCase):

    def _round_trip(self, fname):
        path = example(fname)
        original = load(path)
        with tempfile.NamedTemporaryFile(
            suffix=".yaml", mode="w", delete=False
        ) as tmp:
            tmp_path = tmp.name
        try:
            dump(original, tmp_path)
            reloaded = load(tmp_path)
            self.assertEqual(
                original, reloaded,
                f"Round-trip mismatch for {fname}"
            )
        finally:
            os.unlink(tmp_path)

    def test_round_trip_workspace(self):
        self._round_trip("workspace.yaml.example")

    def test_round_trip_projects(self):
        self._round_trip("projects.yaml.example")

    def test_round_trip_people(self):
        self._round_trip("people.yaml.example")

    def test_round_trip_communication_style(self):
        self._round_trip("communication-style.yaml.example")

    def test_round_trip_meetings(self):
        self._round_trip("meetings.yaml.example")

    def test_round_trip_tags(self):
        self._round_trip("tags.yaml.example")


# ---------------------------------------------------------------------------
# Comment preservation
# ---------------------------------------------------------------------------

class TestCommentPreservation(unittest.TestCase):

    def test_comments_round_trip(self):
        yaml_content = (
            "# Top-level comment\n"
            "name: Alex\n"
            "# Another comment\n"
            "age: 30\n"
        )
        with tempfile.NamedTemporaryFile(
            suffix=".yaml", mode="w", delete=False, encoding="utf-8"
        ) as tmp_in:
            tmp_in.write(yaml_content)
            tmp_in_path = tmp_in.name

        with tempfile.NamedTemporaryFile(
            suffix=".yaml", mode="w", delete=False
        ) as tmp_out:
            tmp_out_path = tmp_out.name

        try:
            data, comments = load_with_comments(tmp_in_path)
            self.assertEqual(data["name"], "Alex")
            self.assertEqual(data["age"], 30)
            self.assertTrue(len(comments) >= 2)

            dump(data, tmp_out_path, comments=comments)

            with open(tmp_out_path, "r", encoding="utf-8") as f:
                out_content = f.read()

            self.assertIn("# Top-level comment", out_content)
            self.assertIn("# Another comment", out_content)
        finally:
            os.unlink(tmp_in_path)
            os.unlink(tmp_out_path)

    def test_load_with_comments_returns_tuple(self):
        path = example("workspace.yaml.example")
        result = load_with_comments(path)
        self.assertIsInstance(result, tuple)
        self.assertEqual(len(result), 2)
        data, comments = result
        self.assertIsInstance(data, dict)
        self.assertIsInstance(comments, list)
        self.assertTrue(len(comments) > 0)


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases(unittest.TestCase):

    def _parse_string(self, yaml_text: str) -> dict:
        """Helper: parse a YAML string via a temp file."""
        with tempfile.NamedTemporaryFile(
            suffix=".yaml", mode="w", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(yaml_text)
            tmp_path = tmp.name
        try:
            return load(tmp_path)
        finally:
            os.unlink(tmp_path)

    def test_empty_quoted_string(self):
        data = self._parse_string('email: ""\n')
        self.assertEqual(data["email"], "")
        self.assertIsInstance(data["email"], str)

    def test_empty_bare_value(self):
        data = self._parse_string("email:\n")
        self.assertEqual(data["email"], "")

    def test_colon_in_quoted_value(self):
        data = self._parse_string('description: "Target: Q3 2026"\n')
        self.assertEqual(data["description"], "Target: Q3 2026")

    def test_boolean_true(self):
        data = self._parse_string("enabled: true\n")
        self.assertIs(data["enabled"], True)

    def test_boolean_false(self):
        data = self._parse_string("disabled: false\n")
        self.assertIs(data["disabled"], False)

    def test_inline_list(self):
        data = self._parse_string("aliases: [auth, AM, auth-mig]\n")
        self.assertEqual(data["aliases"], ["auth", "AM", "auth-mig"])

    def test_inline_list_with_spaces(self):
        data = self._parse_string("aliases: [ auth , AM ]\n")
        self.assertEqual(data["aliases"], ["auth", "AM"])

    def test_empty_inline_list(self):
        data = self._parse_string("aliases: []\n")
        self.assertEqual(data["aliases"], [])

    def test_numeric_value(self):
        data = self._parse_string("feedback_cycle_days: 30\n")
        self.assertEqual(data["feedback_cycle_days"], 30)
        self.assertIsInstance(data["feedback_cycle_days"], int)

    def test_quoted_string_with_hash_not_treated_as_comment(self):
        data = self._parse_string('prefix: "[Myna]"\n')
        self.assertEqual(data["prefix"], "[Myna]")

    def test_nested_three_levels(self):
        yaml_text = (
            "calendar_event_types:\n"
            "  focus: Focus\n"
            "  task: Task\n"
            "  reminder: Reminder\n"
        )
        data = self._parse_string(yaml_text)
        self.assertEqual(data["calendar_event_types"]["focus"], "Focus")

    def test_list_of_objects_with_all_fields(self):
        yaml_text = (
            "projects:\n"
            "  - name: Auth Migration\n"
            "    status: active\n"
            "    aliases: [auth]\n"
        )
        data = self._parse_string(yaml_text)
        self.assertEqual(len(data["projects"]), 1)
        proj = data["projects"][0]
        self.assertEqual(proj["name"], "Auth Migration")
        self.assertEqual(proj["status"], "active")
        self.assertEqual(proj["aliases"], ["auth"])

    def test_list_of_objects_missing_optional_fields(self):
        """Missing optional fields must be absent, not None."""
        yaml_text = (
            "people:\n"
            "  - display_name: Marcus\n"
            "    full_name: Marcus Lee\n"
            "    relationship_tier: direct\n"
        )
        data = self._parse_string(yaml_text)
        person = data["people"][0]
        self.assertEqual(person["display_name"], "Marcus")
        self.assertNotIn("email", person)
        self.assertNotIn("slack_handle", person)
        self.assertIsNone(person.get("email"))

    # -----------------------------------------------------------------------
    # Error cases
    # -----------------------------------------------------------------------

    def test_file_not_found(self):
        with self.assertRaises(FileNotFoundError) as ctx:
            load("/tmp/myna_nonexistent_12345.yaml")
        self.assertIn("/tmp/myna_nonexistent_12345.yaml", str(ctx.exception))

    def test_empty_file_returns_empty_dict(self):
        with tempfile.NamedTemporaryFile(
            suffix=".yaml", mode="w", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write("")
            tmp_path = tmp.name
        try:
            data = load(tmp_path)
            self.assertEqual(data, {})
        finally:
            os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Deeper coverage: specific field values from example files
# ---------------------------------------------------------------------------

class TestExampleFileValues(unittest.TestCase):

    def test_workspace_vault_path(self):
        data = load(example("workspace.yaml.example"))
        self.assertEqual(data["vault"]["path"], "/Users/alex/Documents/MyVault")

    def test_workspace_feedback_cycle_days(self):
        data = load(example("workspace.yaml.example"))
        self.assertEqual(data["feedback_cycle_days"], 30)
        self.assertIsInstance(data["feedback_cycle_days"], int)

    def test_workspace_calendar_event_prefix(self):
        data = load(example("workspace.yaml.example"))
        self.assertEqual(data["calendar_event_prefix"], "[Myna]")

    def test_workspace_calendar_event_types_focus(self):
        data = load(example("workspace.yaml.example"))
        self.assertEqual(data["calendar_event_types"]["focus"], "Focus")

    def test_workspace_prompt_logging_is_bool(self):
        data = load(example("workspace.yaml.example"))
        self.assertIs(data["prompt_logging"], True)

    def test_projects_first_aliases(self):
        data = load(example("projects.yaml.example"))
        self.assertEqual(data["projects"][0]["aliases"], ["auth", "AM", "auth-mig"])

    def test_projects_key_people_block_list(self):
        data = load(example("projects.yaml.example"))
        self.assertIn("Sarah Chen", data["projects"][0]["key_people"])
        self.assertIn("Alex Kumar", data["projects"][0]["key_people"])

    def test_projects_triage_folders(self):
        data = load(example("projects.yaml.example"))
        folder_names = [f["name"] for f in data["triage"]["folders"]]
        self.assertIn("Reply", folder_names)
        self.assertIn("FYI", folder_names)

    def test_people_fourth_person_upward(self):
        data = load(example("people.yaml.example"))
        self.assertEqual(data["people"][3]["relationship_tier"], "upward")

    def test_people_first_has_feedback_cycle_override(self):
        data = load(example("people.yaml.example"))
        self.assertEqual(data["people"][0]["feedback_cycle_days"], 21)
        self.assertIsInstance(data["people"][0]["feedback_cycle_days"], int)

    def test_communication_style_default_preset(self):
        data = load(example("communication-style.yaml.example"))
        self.assertEqual(data["default_preset"], "professional")

    def test_communication_style_sign_off(self):
        data = load(example("communication-style.yaml.example"))
        self.assertEqual(data["sign_off"], "Best")

    def test_communication_style_email_max_length(self):
        data = load(example("communication-style.yaml.example"))
        self.assertEqual(data["email_preferences"]["max_length"], "medium")

    def test_meetings_count(self):
        data = load(example("meetings.yaml.example"))
        self.assertEqual(len(data["meetings"]), 2)

    def test_meetings_first_name(self):
        data = load(example("meetings.yaml.example"))
        self.assertEqual(data["meetings"][0]["name"], "Weekly Architecture Review")

    def test_meetings_first_aliases(self):
        data = load(example("meetings.yaml.example"))
        self.assertIn("WAR", data["meetings"][0]["aliases"])

    def test_tags_count(self):
        data = load(example("tags.yaml.example"))
        self.assertGreaterEqual(len(data["tags"]), 5)

    def test_tags_urgent_keywords(self):
        data = load(example("tags.yaml.example"))
        urgent = next(t for t in data["tags"] if t["name"] == "urgent")
        self.assertIn("blocker", urgent["keywords"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
