# Team calendar: plan events and anticipate availability

The team calendar brings together **sprint ceremonies, other meetings and member availability**. It helps you spot busy days, absences and time-zone differences before they disrupt your plans.

> **Helpful habit:** before scheduling a meeting, check the correct sprint, review absences and select the time zone in which you want to read the calendar.

## 1. Choose the team and period

1. Open the [Team calendar](/app/team-calendar).
2. Check the **team name** and **period** in the header.
3. Select a **sprint or Kanban period** when the selector is available.
4. Use the **arrows** to navigate, or **Today** to return to the current period.
5. Choose **Cards** for a day-by-day overview or **Agenda** for a chronological list.

The calendar can fall back to a month when there is no cycle to select. Always check the displayed dates.

### Control what is visible

The **Meetings** and **Absences** filters hide or show those categories without deleting any data.

## 2. Where do sprint ceremonies come from?

**Scrum ceremonies can be generated when a sprint is created**, using SMN's configured ceremony settings and templates. The calendar then displays the saved occurrences; it does not regenerate the schedule each time you open it.

Depending on configuration, you may see **Sprint Planning**, **Daily Scrums**, **Sprint Review**, **Retrospective** and other template-based meetings.

If a ceremony is missing, review the selected sprint, whether the template was active when the sprint was generated, whether an occurrence exists, and whether **Meetings** is displayed.

> **Tip:** changing a ceremony template does not mean previously generated meetings are automatically rewritten. Check the actual sprint occurrences.

Kanban meetings use their own period context and should not be confused with Scrum ceremonies.

## 3. Add a meeting

Need an extra workshop or an unplanned discussion? You can add a meeting without changing recurring ceremony templates.

1. On an eligible day, select **Add meeting**.
2. Enter a clear **meeting name**.
3. Select its **start date and time**.
4. Set the **duration in minutes** (1 to 480 in the creation form).
5. Check the relevant sprint or period, then select **Create**.
6. Find the event in the calendar and verify the displayed time.

**Example:** create a 45-minute clarification workshop on Wednesday with a meaningful title, a start time and a **45-minute** duration.

> **Note:** Scrum meetings must belong to an eligible, non-closed sprint. Creation requires suitable permissions and actions may be unavailable on certain days, including weekends.

## 4. Click a meeting to view or edit it

A meeting title is **clickable** and opens its details. For Scrum ceremonies and meetings, you can inspect:

- **Name, type, sprint and time zone**.
- **Scheduled start and end**, with the planned duration calculated from them.
- **Actual duration**, once applicable.
- **Attendance status**: held, not held or cancelled, with a reason when relevant.
- **Outcomes**, such as decisions, actions or highlights, when supported.

### To change a Scrum meeting time

1. Select its title in the calendar.
2. Adjust the **start** or **end** fields when editing is allowed.
3. Check the recalculated duration.
4. Use the section's **Save icon**.
5. Close the dialog and verify the calendar.

For some **Daily Scrums**, you can choose to modify **this occurrence** or **this and following occurrences**.

Editing depends on permissions and sprint state. Closed sprints are restricted. Kanban meetings may open a simpler, read-only information dialog.

> **After a meeting:** recording actual duration and outcomes, where supported, makes the calendar more useful than a simple planned timetable.

## 5. Add a member absence

1. On an eligible day, select **Add absence**.
2. Choose the **team member**. Only eligible members assigned on that date are offered.
3. Enter the **start and end dates**.
4. Choose the **starting and ending half-days**: morning or afternoon.
5. Select an **absence category**, enter a **reason** and indicate whether it was **planned** or **unplanned**.
6. Save and verify the day in the calendar.

**Example:** for a Thursday afternoon absence, select Thursday for both dates and **afternoon** for both half-day fields. This avoids recording a full-day absence.

Member absences matter for team availability and capacity. See [Members](/app/admin/members) for working schedules, assignments and country-based holidays.

## 6. See who is absent

A day with reported absences shows an **Absences** label and a **count of absent members**.

Hover over the **Absences** label when a tooltip is available, or **click it** to reveal or keep the names visible depending on the interaction. Names are displayed only when your account has permission to view individual absences.

> **Privacy matters:** the count may still be visible when member names are not available to your role. An empty name list does not mean there are no absences.

Check this information before a Daily Scrum, review or workshop, especially when several important participants may be away.

## 7. Choose a time zone for a distributed team

When members use different time zones, the calendar can show a **display time-zone selector**, based on available team settings.

1. Find **Time zone** in the calendar filters.
2. When the selector appears, choose the zone in which to read meeting times.
3. Review the converted start and end times.
4. Before editing a meeting, check the **time zone in its details**, since the scheduling editor uses that meeting's zone.

**Example:** when coordinating colleagues in Paris and Bangalore, select the most useful display zone for the discussion.

Changing the display zone **does not reschedule the saved meeting**. An event may even appear on a different calendar day because of the time difference.

> **Tip:** configure each member's location and time zone correctly. The available calendar zones depend on team data.

## 8. Understand other calendar markers

The calendar may also show **non-working days**, **public holidays** and **company closures**. Select a closure when available to see its details.

A holiday in one member's country does not necessarily apply to everyone on a distributed team.

## 9. Troubleshooting

- **Missing ceremony:** check the selected sprint, Meetings filter, ceremony generation and templates.
- **Cannot add a meeting:** verify permissions, eligible day, sprint availability and sprint status.
- **Meeting cannot be edited:** review permissions and closed or cancelled meeting restrictions.
- **Cannot add an absence:** verify permissions and that the member is assigned on the selected date.
- **Absence count and names differ:** check authorization and the day's absence details; counts and identities are provided separately.
- **Meeting times look wrong:** check display time zone and the meeting's own time zone.
- **Public holiday missing:** verify the member's country and available national holiday data.

## Your final check

Before your next sprint event, confirm the **team, period, expected ceremonies, additional meetings, member absences and display time zone**.

Your calendar is then a practical way to decide **when to meet, with whom and under what conditions**, rather than just a list of dates.
