# FAQ and troubleshooting

Missing screen, rejected import or empty indicator? Start here for practical checks that help you understand what's happening.

## A screen or action is missing

Some operations require administrator permissions, a specific team or a Scrum/Kanban mode. Review your account and active team. Do not bypass access checks with direct URLs. See the [first-time setup guide](/app/help?article=overview) or ask an administrator.

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

If your account has the necessary permissions, you can review archive inventory and restoration checks under Settings > Maintenance. An existing archive does not automatically authorize restoration; mandatory safeguards must pass.

## Why did my help checkmarks disappear on another computer?

Checklist progress is stored locally in the browser; it is not synchronized or included in SMN backups. A new browser profile or origin starts without previous checkmarks.

## What if Help search fails?

Try searching again from the Help center. When an index is unavailable, accessible articles can still be opened from their categories. The bundled documentation does not require an external service.
