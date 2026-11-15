# Maintenance, updates and backups: configure SMN with confidence

Maintenance groups offline updates, backups and audit history according to account permissions.

> **Camille's tip:** check what already exists, then modify only what is necessary.

## 1. Why is this setting important?

Maintenance groups offline updates, backups and audit history according to account permissions. Good configuration makes subsequent data easier to understand and reduces repeated manual work.

## 2. Open the configuration screen

1. Open [Settings](/app/admin/settings).
2. Find **Maintenance, updates and backups** in the corresponding section.
3. Use the available entry to open [the settings screen](/app/admin/settings/maintenance).
4. Check permissions and current records before making changes.

## 3. A step-by-step approach

1. Under Updates, review prerequisites before acting.
2. Under Backups, create or check an archive using the SMN interface.
3. Review validation results before keeping it.
4. If authorized, use the Audit journal to review changes.
5. For restores, use the supported interface and heed replacement warnings.

## 4. Understand the fields and their impact

A created backup does not prove successful recovery. Archive verification and compatibility checks are essential before moving to another PC.

> **What happens when you save?** The relevant configuration becomes available to its business module. Previous records or generated documents may not be changed retrospectively.

## 5. Advice and troubleshooting

Before a major update, create and verify a backup. End users should not need PowerShell commands.

If the action is missing, check your role and whether the catalog marks it as unavailable. Review any validation error before repeating the change.

## Your final check

Can you explain what changed, why it matters, and where to verify the result? If yes, the setup is ready for use.
