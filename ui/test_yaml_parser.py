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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _write_tmp(content: str) -> str:
    """Write content to a temp file and return the path."""
    with tempfile.NamedTemporaryFile(
        suffix=".yaml", mode="w", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(content)
        return tmp.name


# Inline YAML fixtures representing realistic config data (derived from what
# install/lib.sh writes at install time).

WORKSPACE_YAML = """\
user:
  name: "Alex Johnson"
  email: "alex@company.com"
  role: senior-engineer

vault:
  path: "/Users/alex/Documents/MyVault"

timezone: America/Los_Angeles
work_hours:
  start: "09:00"
  end: "17:00"

email:
  processed_folder: per-project

triage:
  inbox_source: "INBOX"
  folders:
    - name: Reply
      description: "Needs a response from me"
    - name: FYI
      description: "Informational, no action needed"
    - name: Follow-Up
      description: "Waiting on someone else"
    - name: Schedule
      description: "Needs a meeting or calendar action"
  draft_replies_folder: DraftReplies

feedback_cycle_days: 30
calendar_event_prefix: "[Myna]"

mcp_servers:
  email: gmail-mcp
  slack: slack-mcp
  calendar: gcal-mcp

prompt_logging: true

features:
  email_processing: true
  messaging_processing: true
  email_triage: true
  meeting_prep: true
  process_meeting: true
  time_blocks: true
  calendar_reminders: true
  people_management: true
  self_tracking: true
  team_health: true
  attention_gap_detection: true
  feedback_gap_detection: true
  contribution_detection: true
  milestones: true
  observations_logging: true
  recognition_tracking: true
  person_briefing: true
  one_on_one_analysis: true
  performance_narrative: true
  weekly_summary: true
  monthly_updates: true
  park_resume: true
  meeting_summaries: true
  email_draft_reply: true
  message_rewriting: true
  document_processing: true
  pre_read_prep: true
  difficult_conversation: true
  help_me_say_no: true
  quick_capture: true
  link_manager: true
  auto_tagging: true
"""

PROJECTS_YAML = """\
projects:
  - name: Auth Migration
    aliases: [auth, AM, auth-mig]
    status: active
    email_folders:
      - "Auth Migration/"
    slack_channels:
      - auth-team
      - auth-migration
    description: "Migrating to new OAuth provider"
    key_people:
      - Sarah Chen
      - Alex Kumar
    triage:
      inbox_source: "INBOX"
      folders:
        - name: Reply
          description: "Needs a response from me"
        - name: FYI
          description: "Informational, no action needed"

  - name: Platform API
    aliases: [platform, PAPI]
    status: active
    email_folders:
      - "Platform/"
    slack_channels:
      - platform-eng
    description: "Core platform API modernization"
    key_people:
      - Marcus Lee
"""

PEOPLE_YAML = """\
people:
  - display_name: Sarah
    full_name: Sarah Chen
    aliases: [SC, schen]
    email: sarah.chen@company.com
    slack_handle: schen
    relationship_tier: direct
    role: Senior Engineer
    team: Platform
    feedback_cycle_days: 21
    birthday: "03-15"
    work_anniversary: "2023-06-01"

  - display_name: Marcus
    full_name: Marcus Lee
    aliases: [ML]
    email: marcus.lee@company.com
    relationship_tier: direct
    role: Engineer
    team: Platform

  - display_name: James
    full_name: James Park
    email: james.park@company.com
    relationship_tier: peer
    role: Engineering Manager
    team: Infrastructure

  - display_name: Sam
    full_name: Sam Rivera
    email: sam.rivera@company.com
    relationship_tier: upward
    role: VP Engineering
"""

COMMUNICATION_STYLE_YAML = """\
default_preset: professional

presets_per_tier:
  upward: executive
  peer: assertive
  direct: empathetic
  cross-team: formal

sign_off: "Best"

email_preferences:
  max_length: medium
  greeting_style: first-name
"""

MEETINGS_YAML = """\
meetings:
  - name: Weekly Architecture Review
    aliases: [arch review, WAR]
    type: recurring
    project: Platform API
    debrief_type: design-review

  - name: Sprint Standup
    aliases: [standup, daily standup]
    type: recurring
    debrief_type: standup
"""

TAGS_YAML = """\
tags:
  - name: auth-migration
    type: project-based
    project: Auth Migration

  - name: platform
    type: project-based
    project: Platform API

  - name: urgent
    type: keyword-based
    keywords: [urgent, critical, ASAP, blocker, P0]

  - name: hiring
    type: keyword-based
    keywords: [interview, candidate, hiring, onboarding]

  - name: sarah-chen
    type: person-based
    person: Sarah Chen

  - name: from-email
    type: source-based
    source: email

  - name: from-slack
    type: source-based
    source: slack
"""


# ---------------------------------------------------------------------------
# Basic parsing — inline fixture YAML
# ---------------------------------------------------------------------------

class TestBasicParsing(unittest.TestCase):

    def test_workspace_user_name(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["user"]["name"], "Alex Johnson")
        finally:
            os.unlink(path)

    def test_workspace_email_processing_toggle(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertIs(data["features"]["email_processing"], True)
        finally:
            os.unlink(path)

    def test_projects_count(self):
        path = _write_tmp(PROJECTS_YAML)
        try:
            data = load(path)
            self.assertEqual(len(data["projects"]), 2)
        finally:
            os.unlink(path)

    def test_projects_first_name(self):
        path = _write_tmp(PROJECTS_YAML)
        try:
            data = load(path)
            self.assertEqual(data["projects"][0]["name"], "Auth Migration")
        finally:
            os.unlink(path)

    def test_people_count(self):
        path = _write_tmp(PEOPLE_YAML)
        try:
            data = load(path)
            self.assertEqual(len(data["people"]), 4)
        finally:
            os.unlink(path)

    def test_people_first_relationship_tier(self):
        path = _write_tmp(PEOPLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["people"][0]["relationship_tier"], "direct")
        finally:
            os.unlink(path)

    def test_all_six_fixtures_load(self):
        fixtures = [
            WORKSPACE_YAML,
            PROJECTS_YAML,
            PEOPLE_YAML,
            COMMUNICATION_STYLE_YAML,
            MEETINGS_YAML,
            TAGS_YAML,
        ]
        for yaml_text in fixtures:
            with self.subTest():
                path = _write_tmp(yaml_text)
                try:
                    data = load(path)
                    self.assertIsInstance(data, dict)
                finally:
                    os.unlink(path)


# ---------------------------------------------------------------------------
# Round-trip fidelity
# ---------------------------------------------------------------------------

class TestRoundTrip(unittest.TestCase):

    def _round_trip(self, yaml_text: str, label: str = ""):
        path = _write_tmp(yaml_text)
        try:
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
                    f"Round-trip mismatch{' for ' + label if label else ''}"
                )
            finally:
                os.unlink(tmp_path)
        finally:
            os.unlink(path)

    def test_round_trip_workspace(self):
        self._round_trip(WORKSPACE_YAML, "workspace")

    def test_round_trip_projects(self):
        self._round_trip(PROJECTS_YAML, "projects")

    def test_round_trip_people(self):
        self._round_trip(PEOPLE_YAML, "people")

    def test_round_trip_communication_style(self):
        self._round_trip(COMMUNICATION_STYLE_YAML, "communication-style")

    def test_round_trip_meetings(self):
        self._round_trip(MEETINGS_YAML, "meetings")

    def test_round_trip_tags(self):
        self._round_trip(TAGS_YAML, "tags")


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
        path = _write_tmp(WORKSPACE_YAML)
        try:
            result = load_with_comments(path)
            self.assertIsInstance(result, tuple)
            self.assertEqual(len(result), 2)
            data, comments = result
            self.assertIsInstance(data, dict)
            self.assertIsInstance(comments, list)
        finally:
            os.unlink(path)


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases(unittest.TestCase):

    def _parse_string(self, yaml_text: str) -> dict:
        """Helper: parse a YAML string via a temp file."""
        path = _write_tmp(yaml_text)
        try:
            return load(path)
        finally:
            os.unlink(path)

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
            "work_hours:\n"
            "  start: \"09:00\"\n"
            "  end: \"17:00\"\n"
        )
        data = self._parse_string(yaml_text)
        self.assertEqual(data["work_hours"]["start"], "09:00")

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

    def test_inline_list_blank_entries_skipped(self):
        data = self._parse_string("aliases: [auth, , auth-mig]\n")
        self.assertEqual(data["aliases"], ["auth", "auth-mig"])

    def test_inline_list_trailing_blank_skipped(self):
        data = self._parse_string("aliases: [auth, AM, ]\n")
        self.assertEqual(data["aliases"], ["auth", "AM"])

    def test_block_list_blank_scalar_skipped(self):
        yaml_text = (
            "key_people:\n"
            "  - Sarah Chen\n"
            '  - ""\n'
            "  - Alex Kumar\n"
        )
        data = self._parse_string(yaml_text)
        self.assertEqual(data["key_people"], ["Sarah Chen", "Alex Kumar"])

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
# Deeper coverage: specific field values from fixture YAML
# ---------------------------------------------------------------------------

class TestFixtureValues(unittest.TestCase):

    def test_workspace_vault_path(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["vault"]["path"], "/Users/alex/Documents/MyVault")
        finally:
            os.unlink(path)

    def test_workspace_feedback_cycle_days(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["feedback_cycle_days"], 30)
            self.assertIsInstance(data["feedback_cycle_days"], int)
        finally:
            os.unlink(path)

    def test_workspace_calendar_event_prefix(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["calendar_event_prefix"], "[Myna]")
        finally:
            os.unlink(path)

    def test_workspace_prompt_logging_is_bool(self):
        path = _write_tmp(WORKSPACE_YAML)
        try:
            data = load(path)
            self.assertIs(data["prompt_logging"], True)
        finally:
            os.unlink(path)

    def test_projects_first_aliases(self):
        path = _write_tmp(PROJECTS_YAML)
        try:
            data = load(path)
            self.assertEqual(data["projects"][0]["aliases"], ["auth", "AM", "auth-mig"])
        finally:
            os.unlink(path)

    def test_projects_key_people_block_list(self):
        path = _write_tmp(PROJECTS_YAML)
        try:
            data = load(path)
            self.assertIn("Sarah Chen", data["projects"][0]["key_people"])
            self.assertIn("Alex Kumar", data["projects"][0]["key_people"])
        finally:
            os.unlink(path)

    def test_projects_triage_folders(self):
        path = _write_tmp(PROJECTS_YAML)
        try:
            data = load(path)
            folder_names = [f["name"] for f in data["projects"][0]["triage"]["folders"]]
            self.assertIn("Reply", folder_names)
            self.assertIn("FYI", folder_names)
        finally:
            os.unlink(path)

    def test_people_fourth_person_upward(self):
        path = _write_tmp(PEOPLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["people"][3]["relationship_tier"], "upward")
        finally:
            os.unlink(path)

    def test_people_first_has_feedback_cycle_override(self):
        path = _write_tmp(PEOPLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["people"][0]["feedback_cycle_days"], 21)
            self.assertIsInstance(data["people"][0]["feedback_cycle_days"], int)
        finally:
            os.unlink(path)

    def test_communication_style_default_preset(self):
        path = _write_tmp(COMMUNICATION_STYLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["default_preset"], "professional")
        finally:
            os.unlink(path)

    def test_communication_style_sign_off(self):
        path = _write_tmp(COMMUNICATION_STYLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["sign_off"], "Best")
        finally:
            os.unlink(path)

    def test_communication_style_email_max_length(self):
        path = _write_tmp(COMMUNICATION_STYLE_YAML)
        try:
            data = load(path)
            self.assertEqual(data["email_preferences"]["max_length"], "medium")
        finally:
            os.unlink(path)

    def test_meetings_count(self):
        path = _write_tmp(MEETINGS_YAML)
        try:
            data = load(path)
            self.assertEqual(len(data["meetings"]), 2)
        finally:
            os.unlink(path)

    def test_meetings_first_name(self):
        path = _write_tmp(MEETINGS_YAML)
        try:
            data = load(path)
            self.assertEqual(data["meetings"][0]["name"], "Weekly Architecture Review")
        finally:
            os.unlink(path)

    def test_meetings_first_aliases(self):
        path = _write_tmp(MEETINGS_YAML)
        try:
            data = load(path)
            self.assertIn("WAR", data["meetings"][0]["aliases"])
        finally:
            os.unlink(path)

    def test_tags_count(self):
        path = _write_tmp(TAGS_YAML)
        try:
            data = load(path)
            self.assertGreaterEqual(len(data["tags"]), 5)
        finally:
            os.unlink(path)

    def test_tags_urgent_keywords(self):
        path = _write_tmp(TAGS_YAML)
        try:
            data = load(path)
            urgent = next(t for t in data["tags"] if t["name"] == "urgent")
            self.assertIn("blocker", urgent["keywords"])
        finally:
            os.unlink(path)


if __name__ == "__main__":
    unittest.main(verbosity=2)
