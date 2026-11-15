# Tickets: view and import CSV snapshots

Tickets become useful when imported in the right context and format. Follow this guide from preparing your CSV through checking the result in SMN.

## Open the module

- Open [Tickets](/app/tickets) after selecting a team and cycle in SMN.
- The tabs let you view imported files, browse their tickets, and compare snapshots when multiple files exist.
- Import, replacement and deletion require appropriate permissions and may be unavailable for a closed cycle.

## Required CSV format

The first row must include these **six technical column names**, not the former Jira headers:

`id,type,resume,priority,status,sp`

- **id**: ticket identifier.
- **type**: ticket type.
- **resume**: ticket summary.
- **priority**: priority.
- **status**: status.
- **sp**: story points.

The columns may appear in a different order if each required name occurs exactly once. The current validation contract accepts additional columns. Comma, semicolon and tab delimiters are recognized. Files must use the `.csv` extension and must not exceed **8 MiB** or **20,000 tickets**.

## Import a snapshot

- On [Tickets](/app/tickets), choose an available cycle and select **Import CSV** when enabled.
- Choose the CSV file and enter its business date.
- Expand the required-header section in the dialog if needed.
- Run validation. Correct missing or duplicate headers, missing or duplicate ticket IDs, and malformed CSV content.
- If a snapshot already exists for that date, you must explicitly confirm replacement. Review the date and contents before proceeding.
- After import, verify the snapshot in the list and use Browse or Compare.

## Troubleshooting

- **Import disabled**: check the team/cycle selection, cycle status and account permissions.
- **CSV rejected**: check extension, date, the six header names, ticket identifiers and file limits.
- **Replacement requested**: the chosen date already has a snapshot. Overwriting never happens silently.
- **Compare unavailable**: you need at least two snapshots in the selected context.

Reading this guide never imports a file.
