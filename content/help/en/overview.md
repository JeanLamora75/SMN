# Getting started with SMN: set up your first team step by step

You have just signed in to SMN. Before using sprints or Kanban periods for meaningful tracking, you need to prepare some information. This walkthrough explains **what to configure**, **why it matters**, **how SMN uses it**, and **how to check the outcome**.

**Start by checking teams and members already present.** An existing or restored installation may contain data to customize; a fresh native v33 installation on an empty database does not automatically create teams or members. This guide supports both situations. You can revisit any step. Administrator-only actions must be performed by an authorized account. As a standard user, follow the steps available to you and ask your administrator to prepare the others.

The Help center also includes a **first-setup checklist**: use **Read guide** to go deeper into each topic and **Open screen** to perform the task. You manually mark a step **Done**; SMN never interprets reading the article as proof of completion.

## Step 1 — Review general settings

**Why?** Starting with the appropriate language, appearance and reference country helps keep subsequent settings consistent.

**What to do (administrator):**

- Under **Settings > General**, review the displayed Agile mode and product. These fields are read-only in this form.
- Under **General**, choose a reference country if required.
- Under **Language**, select **French** or **English**.
- Under **Appearance**, choose the light or dark theme and a palette.
- Select **Save** if anything changed, and check the confirmation and saved values.

**How SMN uses it:** the application stores general settings, applies display preferences and uses reference settings in the views that support them. You cannot change the Agile mode in this form.

**Check before continuing:** your language, theme and selected country appear correctly after saving.

## Step 2 — Review and customize your team

**Why?** SMN links cycles, members and business data to a team. **Check what is already there first**, then tailor it to your real situation: creating another team when one already exists would duplicate it.

**What to do (administrator):**

- Open **Settings > Teams** and inspect the list. Use filters if necessary to find active or archived teams.
- **If a team already exists**, select it to open the edit dialog. Update its **name**, **product**, **vision** and **goal** to reflect your real team.
- Check its **Scrum or Kanban** mode, which determines available cycles. SMN may prevent a mode change for an existing team; respect that restriction.
- **Only if no usable team exists**, choose **Create team** from the header, then enter the same information and select the appropriate Agile mode.
- Save and confirm the team appears correctly in the list. Select it elsewhere when SMN asks for team context.

**How SMN uses it:** SMN uses the team to associate members, cycles and business information. Agile mode controls Scrum or Kanban functionality, while product details appear in the views and reports that support them.

**Check:** you have the **right team**, customized without duplicates, with the expected Agile mode and product details.

## Step 3 — Review existing members and complete assignments

**Why?** Members, roles and assignment dates determine who belongs to the team at a given time. Review and customize existing profiles instead of recreating them.

**What to do (administrator):**

- Open **Team / Members** for the selected team. **Check existing members first**, including active and inactive groups, in **Cards** or **List** view.
- If your installation contains example people or profiles, open their records and adapt them to your real team. **Do not assume that every installation contains the same number of members.**
- Check each member's name, **function**, **city and country**, **roles** and **assignments**.
- Check assignment start and end dates. An inactive member or former assignment is not the same as a deleted profile.
- Choose **Add member** **only if someone is missing**, then complete the new profile and assignments.
- Return to the list and review active/inactive groups and filters.

**How SMN uses it:** profiles and assignment periods support team information, calendars and capacity interpretation where those features are available.

**Check:** existing profiles have been reviewed or customized, missing members added without duplicates, and assignment periods checked.

## Step 4 — Review working days, calendar and absences

**Why?** Working days, assignments and absences affect how team availability is interpreted. A wrong date or country can make capacity information misleading.

**What to do:**

- If your installation contains a Scrum team and you are an administrator, review **Working days** settings and the available work-slot options.
- Open the [Team calendar](/app/team-calendar) for the relevant team.
- Review displayed days, recorded absences and cycle information where available.
- Compare member assignment dates and location details with the calendar.
- If no cycle exists yet, review the settings you can and return after the next step: some views need a selected period.

**How SMN uses it:** calendar and absence information appear in the relevant views and help interpret availability and capacity alongside team assignments and work rules.

**Check:** known working days and absences are consistent. Merely viewing the calendar does not validate capacity automatically.

## Step 5 — Prepare your first Scrum or Kanban cycle

**Why?** A cycle provides the time frame for tracking work and analyzing indicators. Its setup depends on the team's Agile mode.

**What to do:** follow only the branch matching your team's Agile mode.

**For a Scrum team:**

- Open **Sprints** and choose the relevant team.
- Review existing sprints. If you are an administrator, use **Generate** when offered.
- Check cadence, dates and statuses before confirming.
- Open the sprint from the list to review its period.

**For a Kanban team:**

- Open **Kanban periods** in the correct team context.
- Review existing periods. As an administrator, choose a **start date** in the creation form.
- Check the calculated start, end and time zone, and the suggested period name before confirming.
- Review the creation message. If a period overlaps another, correct the dates instead of forcing creation.

**How SMN uses it:** tracking information is associated with Scrum sprints or Kanban periods. The available screens and some checklist steps adapt to the selected Agile mode.

**Check:** an appropriate cycle is available and its dates are correct. Return to the calendar afterward to check period-dependent information.

## Step 6 — Prepare your first ticket data

**Why?** Having a team and cycle is only the foundation. Tickets provide a snapshot of actual work and may be compared over time.

**What to do:**

- Open [Tickets](/app/tickets) for the chosen team and cycle.
- If you have a CSV file and the necessary rights, prepare these required columns: `id,type,resume,priority,status,sp`.
- Select **Import CSV**, choose the file and its reference date, then run validation.
- Correct any errors. If a snapshot already exists on that date, carefully review the replacement prompt.
- Open the imported snapshot. Comparison becomes useful after multiple compatible snapshots have been saved.

**How SMN uses it:** it stores ticket snapshots for browsing and, when sufficient data exists, comparison. Ticket information can feed the views and indicators that use it.

**Check:** the expected snapshot appears on the correct date with the expected tickets. If you have no CSV yet, leave the step **To do** rather than inventing data.

## Step 7 — Explore indicators and initial reports

**Why?** Dashboards and reports become useful when teams, cycles and initial data are available. Check their sources before drawing conclusions.

**What to do:**

- Review indicators available to your team. Confirm the selected cycle and distinguish a missing value from zero.
- Open [Reports](/app/reports) and browse **Reports**, **Templates**, **Tags** and **Archives**.
- If the administrator action **New report** is available, select the cycle, template, title and language.
- For an Office document, select a Word or PowerPoint template, review its data sources and tags, and choose **Generate** to download or **Save** to keep the document.
- Open the result and check what was populated. Missing data must not be assumed to be zero.

**How SMN uses it:** SMN uses available data according to configured indicators and document templates, then generates or stores documents based on the chosen action.

**Check:** you can find an indicator or report and identify any data still required for useful reporting.

## Step 8 — Protect your setup with a backup

**Why?** Once the first data has been entered, a verified backup helps protect your work, including when moving to another computer.

**What to do (authorized administrator):**

- Open **Settings > Maintenance**, then **Backups** when available.
- Review the archive list and verification results.
- If backup creation is authorized in the interface, perform one and check its result.
- Do not confuse **backup available** with **restoration authorized**: restoration remains subject to the installation's safety checks.

**How SMN uses it:** maintenance features manage archives and related verification according to the installation's safety rules. The checklist marks stored in your browser are not included in backups.

**Check:** you know how to verify an archive and have reviewed its status without performing an unnecessary restoration.

## Your first setup is ready when…

Your team exists; members and assignments make sense; a calendar and a cycle have been checked; and you know where to enter ticket information, inspect indicators and prepare reports. Backups protect this foundation.

Return to the **checklist** in the Help center. Mark each applicable step **In progress** or **Done (self-declared)** after checking it yourself. Steps outside your role are filtered and no checkbox performs business configuration. Progress remains in this browser on this installation.
