# Pharmacy Checklist Workspace — Product Architecture

## Product intent

The workspace is a calm operational tool for organizing medicines, doses, schedules, refills, and completion states. It is intentionally not a diagnostic product. The primary user journey is: review the day, mark doses taken or missed, inspect refill risk, and maintain a small source of truth for medicine instructions.

## Core vocabulary

| Concept | Meaning | Persistence shape |
|---|---|---|
| Medicine | A user-owned medication record | `medicine` document / relational row |
| Dose schedule | A repeatable time and cadence for a medicine | embedded `schedule` object or normalized schedule row |
| Dose event | One scheduled occurrence with a status | checklist event document / relational row |
| Refill signal | A derived state based on remaining quantity and refill date | computed from medicine fields |
| Reminder | A user-facing in-app event, with an optional email delivery path | reminder document / notification row |

## Medicine record

A medicine record contains `id`, `ownerId`, `name`, `dose`, `form`, `instructions`, `scheduleLabel`, `scheduleTimes`, `refillDate`, `remainingDoses`, `status`, `notes`, `createdAt`, and `updatedAt`. Dates are persisted as UTC timestamps. A MongoDB document can store the schedule as an embedded array; the relational backend can normalize it without changing the product vocabulary.

## Dose status rules

The dashboard derives `due`, `taken`, `missed`, and `upcoming` from a dose event's status and scheduled time. A medicine is `refill-soon` when its refill date is within seven days or when remaining doses are at or below five. The UI shows these states as concise chips and counts, never as medical judgments.

## Reminder behavior

Reminder configuration is user-owned and deterministic. A dose reminder is eligible when its scheduled time is approaching and it has not been completed. A refill reminder is eligible when the refill date is within seven days. The product includes an in-app notification presentation and a backend-ready scheduled callback path. Email delivery is intentionally provider-agnostic until an email provider credential is connected.

## Supabase and MongoDB seam

The frontend speaks to the existing typed backend contract rather than calling databases directly. The backend's canonical relational storage remains available for this project, while the schema and service boundaries use document-friendly names and embedded schedule semantics so a Supabase Postgres adapter or MongoDB repository can be introduced without changing the UI. Optional Supabase and MongoDB environment variables are documented as integration seams; secrets are not hardcoded.

## Visual system

The visual language is an architectural blueprint: deep royal blue canvas, a barely visible precise grid, white CAD-like linework, thin rectangular frames, dimension ticks, and bold white sans-serif headings. Content surfaces use pale neutral-blue layers to create antigravity lift. Teal is reserved for active or safe states; amber is reserved for due/refill attention; red is reserved for missed states. No purple tones, gradients, or decorative clutter.

## Safety copy

The workspace always includes: “For organization only — not medical advice. Follow your prescription label and ask a licensed clinician or pharmacist about changes, interactions, or missed doses.”
