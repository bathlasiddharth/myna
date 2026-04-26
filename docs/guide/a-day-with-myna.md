# A Day with Myna

A day in the life of Sam, a Platform Engineering Manager, using Myna. Every block is a real moment in a workday — the situation, what Sam is thinking, and the exact prompt to copy-paste. Runs against the [test vault](../tests/fixtures/vault/myna) with "today" anchored to 2026-04-11.

**Cast (from the test vault):**
- **You = Sam**, Platform Engineering Manager.
- **Directs:** Sarah Carter (senior, Atlas lead), Marcus Walker (Phoenix, going on parental leave May 18), Nate Brooks, Rachel Davis, Laura Hayes.
- **Upward:** James Miller (VP).
- **Cross-team:** Sarah Mitchell (Q2 OKR, reply overdue), Emily Parker (Payments PM, Bridge Integration), Chris Wilson.
- **Live storylines:** Phoenix validator blocker (20 days), Marcus's upcoming leave, Atlas caching design review (led by Sarah on Apr 9), Sarah Mitchell OKR reply waiting on you.

---

## 7:45 AM — Coffee, laptop open

You just sat down. You don't remember what's on fire from yesterday and you have a 9am 1:1. You need the day in one glance.

```
sync
```

You read the capacity line, see Phoenix is still blocked, notice Sarah Mitchell's OKR reply is overdue, and Sarah Carter's birthday is Thursday. Good — one picture.

---

## 7:55 AM — "OK but what actually matters today"

Sync gave you facts. You want judgment.

```
what should I focus on today?
```

Myna reads the same state and hands you 5–7 bullets, ranked. Phoenix escalation, Sarah Mitchell reply, Marcus leave coverage.

---

## 8:10 AM — Before the Marcus 1:1

First meeting of the day is with Marcus. He's been stretched, he brought a written fallback design last week, and you have a pending feedback note about him going quiet during the scope cut. You want to walk in ready.

```
prep for my 1:1 with Marcus
```

You skim the prep. It surfaces the Apr 7 scope-cut-discomfort talking point with coaching-tone framing, the fallback-design win to acknowledge, and the parental-leave thread. You know what you want to open with.

---

## 9:00–9:30 AM — 1:1 with Marcus

You take notes in the live session file during the conversation.

---

## 9:35 AM — Back at your desk, while it's fresh

You don't want to retype what you just discussed into five different files.

```
done with 1:1 with Marcus
```

Myna extracts the delegations (fallback doc due Apr 14), the personal note (leave confirmed), the growth-area observation, and tees up a task for you to draft the coverage plan with HR. The Apr 10 session gets marked processed.

---

## 9:50 AM — Slack ping from Sarah

A quick thought you want to remember before your next meeting drags it out of your head.

```
capture: Sarah handled the Payments questions really well this week, atlas is unblocked on the spec side, and I need to review the Sentinel phase 1 audit by next Friday
```

Three things, three destinations, one sentence. Sarah gets a recognition entry, Atlas gets a timeline entry, Sentinel gets a task with a due date.

---

## 10:00 AM — "Wait, what's the state of Bridge?"

Emily emailed earlier asking for a Phase 1 timeline confirmation. You don't remember where that project stands.

```
catch me up on bridge integration
```

Recent timeline, Rachel's ownership, Emily's Apr 7 open ask, the merchant API heads-up. Now you can reply intelligently.

---

## 10:15 AM — 10:30 AM standup prep, 30-sec checklist

You have back-to-back meetings starting at 10:30 and you haven't prepped any of them.

```
prep for my remaining meetings today
```

Myna skips the ones already prepped and fills in prep for the rest. Per-meeting summary, count of items.

---

## 11:30 AM — Between meetings, something surfaced

During the last meeting you noticed Marcus went silent again when the on-call rotation came up. Don't want to lose it.

```
note to self: Marcus went quiet when on-call rotation came up in Platform Weekly — might be related to the scope-cut discomfort pattern, not a new thing
```

It lands as a pending-feedback item with the right coaching framing, not a judgment.

---

## 12:15 PM — Lunch, doing triage

Your inbox has piled up. You want to sort it fast.

```
triage these inbox emails:

{paste all emails with `Folder: INBOX` from tests/fixtures/mock-data/mock-emails.md}
```

Myna rewrites `ReviewQueue/review-triage.md` with a folder recommendation and one-line reasoning per email. You glance through, tick the ones you agree with.

```
process triage
```

(The fixture has everything unchecked, so this reports "0 processed" — but the pattern is: you check in Obsidian, then say this.)

---

## 12:45 PM — VP asked for a Phoenix risk note

James wants it by Friday. You have 15 minutes.

```
draft the Phoenix risk note for the VP portfolio review
```

BLUF, 20-day blocker context, fallback-design mitigation, leave-coverage risk. Grounded in the actual timeline, no hedging language. You edit one paragraph and you're done.

---

## 1:00 PM — "Can I just send this?"

You type a quick one-liner for James.

```
send this to James: Atlas is on track, one cardinality risk, full details in the design doc
```

Myna refuses to send. Reminds you it drafts only. Offers to turn it into a draft if you want. You appreciate the friction — it's saved you from sending raw thoughts to a VP before.

---

## 1:30 PM — Cross-team email to clean up

There's a vendor email in DraftReplies with Sam's instruction note attached.

```
process these draft reply requests (treat them as if they came from the DraftReplies folder):

{paste the VectorVendor Sales email from tests/fixtures/mock-data/mock-emails.md — Folder: DraftReplies, including Sam's bracketed note and the forwarded message below it}
```

Myna separates your instruction ("decline politely, reopen Q4") from the forwarded context, writes a diplomatic decline, and drops a review TODO in today's daily note.

---

## 2:00 PM — Feedback gut-check

You know you owe someone feedback but can't remember who.

```
who haven't I given feedback to in a while?
```

Rachel Davis — 50 days. That's the one.

---

## 2:15 PM — Before drafting the Sarah recognition

Sarah ran her first cross-team design review on Apr 9 and you want to recognize it properly, not with a generic thanks.

```
draft recognition for Sarah Carter for the design review this week
```

Evidence-grounded: the Apr 9 review, the token cardinality catch, the Mar 12 incident calm. No BLUF (recognition doesn't do BLUF). Asks before overwriting the existing draft file.

---

## 3:00 PM — Inbound Slack catchup

While you were heads-down, threads happened.

```
process these slack messages:

{paste #atlas-team thread starting Alex Thompson 2026-04-08 09:15 (with 3 replies) + Marcus Walker 2026-04-08 10:05 in #phoenix-eng from tests/fixtures/mock-data/mock-slack.md}
```

LRU cascade finding → Atlas timeline. Marcus escalation question → a reply-needed task. Channel timestamps updated so Myna knows where it left off.

---

## 3:30 PM — "What's blocked, really?"

Your brain is tired. You want one view of everything stuck.

```
what's blocked?
```

Phoenix validator (20 days), the dependency task overdue since Apr 8. Each blocker with age, source, next action.

---

## 3:45 PM — Review queue — the ambiguous pile

Stuff Myna wasn't sure about during the day landed in the review queue. Time to unstick it.

```
review my queue
```

Myna presents items one at a time — source, proposed action, ambiguity, destination. You approve or redirect.

```
approve it, assign to me
```

Item moves to its destination with a `[Verified]` marker; audit trail appended.

---

## 4:30 PM — Pattern check before next week's 1:1

You want to see if the estimation issue with Marcus is a real pattern or a one-off.

```
analyze my 1:1s with Marcus
```

Factual patterns across all 5 sessions — estimation recurrence, follow-through rate, carry-forward rate. No judgment about morale. You can see the arc clearly.

---

## 5:00 PM — Follow-up radar

One last sweep before the day ends.

```
what are my overdue tasks and who should I follow up with this week?
```

Sarah Mitchell reply, Phoenix escalation, Marcus leave-coverage plan. Grouped by person. You pick one to draft now and punt the rest to tomorrow.

---

## 5:15 PM — Log a contribution before you forget

Today's design review alignment is worth banking for your self-track file.

```
log contribution: led the atlas caching design review end-to-end and got cross-team alignment on the LRU cascade fallback plan
```

Categorized as cross-team-leadership, appended to this week's contributions file.

---

## 5:30 PM — Wrap up the day

One prompt. Clean close.

```
wrap up
```

Planned-vs-actual against this morning's sync. Contributions split by source. End-of-day section in today's daily note. Tomorrow's note created with carry-forwards marked "(carried from 2026-04-11)". Summary line tells you: completed N of M, N contributions, N carried.

---

## Friday evening — Weekly summary

End of the week, you want the shape of it.

```
weekly summary
```

Accomplishments, decisions made, blockers, tasks completed vs carried, self-reflection — appended to this week's weekly note. Team-health snapshot appended to the Platform team file.

---

## Anytime — things you'll reach for

A few prompts that aren't tied to a moment but come up often:

```
brief me on Sarah Carter
```

```
brief me on Marcus
```

```
catch me up on atlas migration
```

```
catch me up on phoenix
```

```
what did Sarah say about the deadline?
```
(Watch Myna ask which Sarah — never silent guesses.)

```
what's parked?
```

```
resume phoenix leave
```

```
reserve 2 hours Monday for the Phoenix coverage plan
```

```
break down the "Review updated caching design doc from Sarah" task
```

```
am I underselling myself? use [Self] Q1 brag doc
```

```
fix this: i wanted to loop you in quick on sarahs progress on atlas its going really well she has been leading the design reviews and handling payments questions directly
```

```
brief me on Jamie Holloway
```
(No such person — watch Myna refuse to hallucinate, suggest closest matches.)

```
schedule a meeting with Sarah Carter and Alex Thompson for tomorrow morning
```
(Watch Myna refuse — it only creates solo personal events. Offers to draft an invite instead.)

---

## One-turn process-a-random-doc

Happens maybe weekly — someone pastes you a planning note and you want it decomposed and filed.

```
process this doc:

Q2 Platform team planning notes (draft, 2026-04-11)

- Atlas Migration: Wave 1 migration starts May 1. Target 12 internal services done by May 20.
- Phoenix Platform: v1 launch deferred to Q3 pending validator upgrade resolution.
- Bridge Integration: Phase 1 kickoff April 13. Rachel leading.
- Decision: Nate Brooks will co-own Phoenix during Marcus's parental leave (May 18 – Aug 10).
- Risk: Atlas wave 1 depends on Payments test env access confirmation by April 14.

This is an internal working doc, not published anywhere yet.
```

Per-line routing to the right project, decisions flagged, ambiguous owners sent to review-work.

---

## Ad-hoc meeting debrief

You had an unscheduled hiring sync. No prep file exists; you just want it processed.

```
process this meeting:

# Ad-hoc hiring planning sync (2026-04-11)

Attendees: Sam, Sarah Carter, Alex Thompson

Discussion:
- We discussed the Elena Martinez candidate. Strong system design. Concerns about code quality.
- Someone needs to own the follow-up email to the hiring committee.
- Decided: proceed to offer if references come back clean.

Action items:
- Follow-up with references by Tuesday
- Write the committee memo this week
```

Ambiguous owners routed to the review queue. Decision extracted. No silent guesses.
