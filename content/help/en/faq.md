# FAQ and troubleshooting

## A screen or action is missing

Some operations require administrator permissions, a specific team or a Scrum/Kanban mode. Review your account and active team. Do not bypass access checks with direct URLs. See the first setup guide in the [Help center](/app/help) or ask an administrator.

## Why does ticket CSV import fail?

Under [Tickets](/app/tickets), the CSV must include **id**, **type**, **resume**, **priority**, **status**, **sp**. Former Jira column names are not supported. Check the date, CSV syntax and ticket identifiers as well. Refer to the Tickets article in Help.

## Why do I need to confirm replacement?

Another snapshot already exists for the selected date. SMN asks for explicit confirmation before replacement. Recheck the file and date. Concurrent changes may require confirmation again.

## Why is ticket comparison unavailable?

At least two compatible snapshots are needed in the selected context.

## Why are sprints unavailable?

Check that the installation/team uses Scrum and that you have permission to access it. Kanban teams use their own periods.

## Why is an indicator value missing?

Review team and cycle context, manually entered values, formulas and source data. A missing value is not automatically zero. Indicator settings can be restricted to administrators.

## Why can't a backup be restored?

Archive inventory and restoration checks are available under [Maintenance](/app/admin/settings/maintenance) according to your permissions. An existing archive does not automatically authorize restoration; mandatory safeguards must pass.

## Why did my help checkmarks disappear on another computer?

Checklist progress is stored locally in the browser; it is not synchronized or included in SMN backups. A new browser profile or origin starts without previous checkmarks.

## What if Help search fails?

Try searching again from the Help center. When an index is unavailable, accessible articles can still be opened from their categories. The bundled documentation does not require an external service.
