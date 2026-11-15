# Registers: preserve your team's working history

A resolved impediment, an anticipated risk, a decision made in a retrospective: these events tell the story of your team. SMN registers let you **track important topics, preserve changes over time and recover their context** for reviews and reports.

> **Camille's tip:** a register should be more than a list of problems. For important topics, record what happened, what was decided, who will act and what has changed.

## 1. Why use registers?

Registers have three complementary purposes:

- **Manage work:** monitor risks, resolve impediments, coordinate dependencies and follow up on actions.
- **Preserve team history:** retain dates, status changes, comments, decisions and related events.
- **Prepare reports:** provide structured data about risks, impediments, dependencies, decisions, actions and highlights.

**Example:** an external dependency delays a Story. Record the dependency, the associated risk, the decision about a workaround and the follow-up action. Later you can explain **how the team handled the problem**, not just what went wrong.

## 2. Find the right records

1. Open [Registers](/app/admin/registries) and check the selected team.
2. Choose **All**, **Risks**, **Impediments** or **Dependencies**.
3. Use available **search**, **status**, **cycle**, **owner** and **sorting** filters.
4. Select **List** or **Cards** and open a record.
5. Check its business date, status and related items.

The main list of risks, impediments and dependencies focuses on the team's operational topics. **Decisions**, **actions** and **highlights** are also supported, notably in record details and journals; they do not necessarily have separate main-list tabs.

> **Before a review:** check resolved items as well as open ones. An impediment removed during the sprint belongs in the story of the sprint too.

## 3. Understand the six record types

### Risk

Something that **might happen**. Status: **Open** or **Resolved**. Its record can include probability, impact and a ROAM response.

### Impediment

A difficulty that **has already occurred**. Statuses: **Open**, **In progress**, **Resolved** or **Abandoned**.

### Dependency

Coordination between a **requester** and a **contributor**, within or outside the team. Can be marked **at risk**. Statuses: **Open**, **In progress**, **Satisfied**, **Cancelled**.

### Decision

An agreed choice, optionally with a rationale. A decision can **replace** a previous one. Statuses: **Active**, **Replaced**, **Cancelled**.

### Action

Something to do or follow up on. Statuses: **To do**, **In progress**, **Completed**, **Cancelled**.

### Highlight

A notable event or observation worth remembering. Its status is **Recorded**.

## 4. Create a useful record

1. Select **Create** if your permissions allow it.
2. Choose the record **type** from the offered options.
3. Enter a meaningful **title**, **date** and **status**.
4. Add a description, due date or owner where available.
5. Complete type-specific details: risk assessment, dependency parties or decision rationale.
6. Save and open the record to check the result.

Prefer a specific, actionable title. “Test environment unavailable since Tuesday” communicates much more than “Environment problem”.

Available actions and types can depend on where you create the record, especially from a related journal.

## 5. How does SMN calculate risk criticality?

On a **Risk** record, use the assessment matrix:

- **Probability:** Low = 1, Medium = 2, High = 3.
- **Impact:** Low = 1, Medium = 2, High = 3.

**Criticality score = Probability × Impact.**

### Read the result

- **1–2: Low** — Monitor the risk.
- **3–4: Medium** — Track preventive or mitigating measures.
- **6–9: High** — Raise awareness and agree on an appropriate response.

**Example:** High probability (3) and Medium impact (2) produce **6, High criticality**. Low probability (1) and Medium impact (2) produce **2, Low criticality**.

> **Remember:** this score supports prioritization; it is not a prediction. If either dimension is missing, the risk is shown as **Unassessed**.

### Use ROAM to describe your response

- **Resolved:** the risk is resolved.
- **Owned:** someone takes responsibility for following it.
- **Accepted:** the team accepts the exposure.
- **Mitigated:** measures reduce probability or impact.

**Criticality, ROAM and record status are different concepts.** The score evaluates exposure; ROAM describes the chosen response.

## 6. Connect related records

A risk may lead to a decision, a decision to an action, and a dependency to an impediment. **Relations** let you link records instead of repeating the same background everywhere.

1. Open a record and select **Relations**.
2. Choose **Associate record**, where permitted.
3. Search for the target and select it.
4. Check the title and type, then confirm.
5. Follow the resulting link to the associated record.

The interface distinguishes **incoming and outgoing relations**. Linking records does not automatically synchronize their statuses or risk scores.

**Example:** link a delivery risk to a supplier dependency, then document a workaround decision and follow-up action. The connections help you trace the situation.

Depending on the record type, you may also link **cycles** or, for some actions, **goals**.

## 7. Preserve the discussions and changes

The record offers distinct views:

**Journal** — Record comments, contextual information and linked events. Depending on permissions, you can also create or find associated **actions** and **decisions**.

**History** — Review modifications with dates, authors, revisions and **before/after** values. Detailed audit history is restricted to authorized users.

**Relations** — Navigate between business records; this is different from modification history.

> **Team facilitation tip:** after a Daily, Review or Retrospective, update the affected topics. A brief dated note and an explicit decision are far more useful than an out-of-date status.

Existing records may change over time. Reports already generated are not automatically rewritten when a register entry changes.

## 8. Use register data in reports

Compatible **Word and PowerPoint report templates** can consume information about **risks, impediments, dependencies, decisions, actions and highlights**.

1. Review record details and their team or cycle context.
2. Open [Reports](/app/reports) and choose **Templates**.
3. Select a model that uses register data.
4. Check its tags and options under **Tags**.
5. Select the appropriate cycle, generate the document and inspect its contents.

Not every report model includes register data. Available output depends on **template tags**, scope and data availability.

> **Before Sprint Review:** review open risks, resolved impediments, outstanding dependencies and decisions made. Your report will then explain the team's challenges and responses, not just show metrics.

## 9. Troubleshooting

- **Record missing:** verify team, cycle, type and filters, including resolved items.
- **Risk score unexpected:** check both matrix dimensions and their multiplication.
- **Relation missing:** review Relations, the target record and permissions.
- **Cannot edit:** check permissions, context and revision conflicts.
- **Record absent from a report:** check the template, tags and selected cycle.
- **Cannot delete:** review linked information and safeguards. Deletion is not the same as resolving an issue.

## Your final check

Can you explain **what happened, how serious the risk or impediment was, what the team decided, and which linked actions or records show the outcome?**

If you can retrieve those answers from SMN, your registers are becoming a useful operational history for both team discussions and stakeholder reporting.

**Permanent deletion:** only accounts with the appropriate **management permission** can request record deletion. SMN may refuse when related data must be preserved; deleting a record is not the same as resolving it.
