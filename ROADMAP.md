# Roadmap

## In progress

_(nothing active right now)_

---

## Planned

### User-provided Anthropic API key

Allow users to supply their own Anthropic API key so they aren't dependent on the app's shared quota. The key would be AES-256-GCM encrypted before storage, decrypted only server-side during API calls, and never returned to the client — users would only see a masked version (e.g. `sk-ant-...XY7Z`). A settings page would let them add, update, or remove it at any time.

### ExerciseDB integration

Research and integrate the [ExerciseDB](https://exercisedb.dev/) API as a complement to the AI analyzer:

- Browse a catalogue of exercises with target muscles and step-by-step execution
- Search by name or muscle group
- Filter and attach exercises to routine days without needing to photograph a machine

### Dashboard

A per-user overview of training activity:

- List of active routines and their days
- Metrics per routine: number of machines used, average sets/reps per day
- Progress snapshots over time

### Calendar view

A weekly/monthly calendar showing scheduled routine days with:

- Links to the day's machines and exercises
- Strike-through or completion markers once a session is logged

---

## Backlog

- FAQ section — common questions about using the analyzer, how routines work, etc.
- Feedback form — in-app form for users to report issues or leave suggestions
