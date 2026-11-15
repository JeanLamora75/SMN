# Tickets / CSV: turn your exports into metrics and history

A CSV file is more than a list of issues. Imported into SMN at the right moment, it becomes a **dated snapshot of a sprint or Kanban period**. SMN calculates statistics from it, supports comparisons over time and can reuse selected snapshots in reports.

> **Camille's tip:** think of each import as a measurement over time. A snapshot at the start of a sprint and another at the end are much more informative than a single file.

## 1. Understand what this module gives you

**Your workflow:** prepare the CSV, import a snapshot, inspect automatically calculated metrics, then compare and reuse the data.

### Automatically calculated ticket metrics

In **Browse / Consultation**, SMN can calculate:

- **Ticket count** — Number of tickets in the snapshot.
- **Completed tickets** — Tickets recognized as completed based on their status.
- **Story Point sum** — Sum of usable numeric estimates.
- **Estimated and unestimated tickets** — Insight into estimation completeness.
- **Breakdowns** — Ticket counts and Story Points by type, status and ID prefix.

Metrics can refer to **all tickets** or the **currently filtered tickets**. Always check the selected scope before quoting a figure.

### Using the results in SMN indicators

The **Indicators** action opens the configured indicators for the selected cycle, where authorized users can enter **manual indicator values**.

**Important distinction:** ticket statistics are calculated automatically in Browse, but **they are not automatically copied into every manual indicator**. You can use the result as a reference when entering an appropriate manual KPI. Formula-based indicators follow their own definitions.

> **Example:** filter by Bug and obtain 12 tickets. If your indicator catalog includes a manual sprint bug-count KPI, you can use 12 as a reference while noting the snapshot date and filter scope.

## 2. Prepare the expected CSV

The first line must contain these **six required column names**. Older Jira header labels are not used:

`id,type,resume,priority,status,sp`

### What the columns mean

- **id** — Unique issue ID, such as `PROJ-123`. It identifies tickets across snapshots and helps reconstruct Jira links when configured.
- **type** — Ticket type, such as Story, Bug or Task.
- **resume** — Summary or title.
- **priority** — Priority used for filtering.
- **status** — Status at the time of export, needed for completion counts and comparisons.
- **sp** — Story Points used for numeric totals and estimation coverage.

**Minimal example:**

`id,type,resume,priority,status,sp`

`PROJ-101,Story,Build the form,High,Done,5`

`PROJ-102,Bug,Fix validation,Medium,In Progress,3`

This example contains **2 tickets**, **1 completed ticket** and **8 Story Points** in total. That does not automatically constitute sprint velocity.

### Check before importing

- Each required header must occur once. The column order may differ, and extra columns are allowed.
- Ticket IDs cannot be empty or duplicated within one file.
- Supported separators are **commas**, **semicolons** and **tabs**.
- The file must have a `.csv` extension, be at most **8 MiB** and contain no more than **20,000 tickets**.
- Non-numeric Story Points may produce warnings: their original values remain available, but they cannot contribute to numeric totals.

> **Data-quality tip:** use consistent status names in each export. Completed-ticket detection recognizes statuses such as **Done** and **Terminé**; a custom status is not automatically treated as completed.

## 3. Import a dated snapshot

1. Open [Tickets](/app/tickets) and check the selected **team** and **sprint or Kanban period**.
2. Select **Import CSV** when authorized.
3. Verify the cycle shown in the import dialog.
4. Select your **CSV file**.
5. Choose the **reference date**: when the snapshot represents the ticket state, not necessarily today's import date.
6. Expand **Required CSV column headers** if you need to check the format.
7. Validate the data, fix any reported errors and complete the import.

**Why does the reference date matter?** It tells you when the measurement was taken, allowing meaningful comparisons within the same cycle.

> **Example:** a CSV exported on Monday but uploaded on Tuesday can keep Monday as its reference date, if Monday is the business date you want to preserve.

If a snapshot already exists on the selected date, SMN requires **explicit replacement confirmation**. Replacing it changes the current snapshot for that date; it does not create another simultaneously browsable snapshot under the same date.

## 4. Browse tickets and interpret the metrics

In **Files**, select the snapshot you want to review. You can see its reference date, filename, import time and ticket count.

Open **Browse / Consultation** to search, filter by **type**, **status**, **priority** or **ID prefix**, sort the results and inspect the calculated metrics.

Check whether metrics describe **all** records or only **filtered** ones. Missing or invalid Story Points must not be mistaken for zero.

If configured in **Settings → Jira link**, the base Jira address lets SMN reconstruct clickable issue URLs. It does not establish automatic synchronization with Jira.

## 5. Preserve the history of a sprint or period

Snapshots are scoped to **one team**, **one sprint or Kanban period** and **one reference date**. This makes it possible to document the work as it evolves.

A practical approach is to capture:

- **Cycle start** — Initial scope and estimates.
- **Mid-cycle** — Added, changed and completed issues.
- **Cycle end** — The final state for review.

With at least two snapshots on different dates in the same cycle, open **Compare**. SMN can detect **added**, **removed**, **completed** and **reopened** tickets, **Story Point changes** and other recorded changes.

> **Scrum Master tip:** a higher ticket count does not necessarily mean more progress or more problems. Interpret the differences alongside the events that happened during the sprint.

## 6. Use snapshots in your reports

Imported snapshots can also serve as **data sources in compatible report templates**.

1. Open [Reports](/app/reports).
2. Under **Templates**, choose a suitable Word or PowerPoint template.
3. Select the relevant **cycle**.
4. **If the template uses ticket data**, choose the requested snapshots in the available fields.
5. Generate or save the document and check the actual ticket tables or comparisons.

Not every report template consumes ticket snapshots. The result depends on its **tags**, selected sources and available data. Importing a CSV does not make ticket data appear automatically in every report.

## 7. Troubleshooting

- **Import CSV unavailable:** check cycle/team context and administrative permissions.
- **CSV rejected:** verify required headers, IDs, syntax and file limits.
- **Story Point sum missing:** check non-numeric or empty values and any active filters.
- **Ticket not counted as completed:** check the `status` value and recognized conventions.
- **Compare unavailable:** add another dated snapshot to the same cycle.
- **Old snapshot missing:** check whether it was replaced on the same date or deleted.
- **Tickets absent from a report:** verify the template uses ticket data and the correct snapshots were selected.

## Your final check

Can you explain **which cycle you measured, on what date, which metrics SMN calculated and which snapshots support your reports**?

If so, your CSV files have become useful evidence for team tracking rather than isolated exports.
