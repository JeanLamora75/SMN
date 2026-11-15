# Jira link: open imported tickets from their IDs

After importing tickets from a CSV file, SMN can use an issue ID such as `ABC-123` to build a **clickable link to Jira**. This setting does not enable synchronization.

> **Tip:** check the preview before saving and remember that users still need their own permission to access the issue in Jira.

## 1. What does this setting do?

If your Jira base address is `https://example.atlassian.net`, SMN can construct a ticket URL such as `https://example.atlassian.net/browse/ABC-123` using the imported `id` field.

It does **not** download tickets, verify their existence or automatically refresh previously imported CSV data.

## 2. What should you enter?

The form has one main field: **Jira base URL**. Enter your Jira site's address, not the URL of an individual issue.

SMN validates the URL format and shows a **link preview** using a sample issue ID. **Clear** empties the field; **Reload** reads saved settings; **Save** is enabled for a valid change.

## 3. Configure it step by step

1. Open [Settings → Jira link](/app/admin/settings/jira) as an administrator.
2. Enter the **Jira base URL**.
3. Review the **preview** and confirm the correct domain and ticket path.
4. Select **Save** and verify the confirmation.
5. Open [Tickets](/app/tickets), select an imported CSV snapshot and try opening a ticket link.

> **Good practice:** if your organization changes its Jira site, update the base address before relying on ticket links.

## 4. Troubleshooting

- **Invalid address:** use a complete valid URL.
- **Wrong Jira site:** correct the base address and inspect the preview.
- **Ticket cannot be opened:** verify the CSV `id` and Jira permissions.
- **Save conflict:** select **Reload** and try again after reviewing the stored setting.

## Your final check

The sample preview points to the right Jira site and an imported ticket opens correctly. **This setting only reconstructs ticket URLs**; CSV import and history remain part of Tickets.
