# Dashboard: your team's Agile cockpit

The **dashboard** is more than a page of numbers. It helps Scrum Masters and RTEs **understand progress, spot issues worth discussing and reach the right tools quickly**. Depending on the view, it combines sprint or Kanban period context, indicators and business lists.

> **Camille's tip:** before a Daily, spend two minutes asking: where are we, what needs attention and where should we go to act?

## 1. What is the dashboard for?

- **Follow the cycle:** team, product, sprint or period, dates and status.
- **Highlight indicators:** capacity, Story Points, ticket measures and other team choices.
- **Spot issues:** risks, impediments, ceremonies, notes and other available sources.
- **Show business lists:** place useful tables and lists beside KPI blocks.
- **Take shortcuts:** open cycle details, registers, calendars or relevant actions where offered.

For example, before Sprint Review, examine progress, remaining risks and significant events, then open detailed records when needed.

## 2. Verify the context first

1. Open the [Dashboard](/app).
2. Check the selected **team** and **product** where shown.
3. Review the **sprint or Kanban period**, dates and status.
4. Navigate to the intended team or cycle before discussing results.
5. Examine the available cards, lists and actions.

A correct number from the wrong cycle can be misleading. Historical cycles may have different data sources and states.

## 3. Highlight the right indicators

Indicator definitions belong to **Settings → Indicators**. Team selections and display settings are managed through [Indicators](/app/admin/indicators).

1. **Define** a manual or computed indicator in the global catalog, with its name, tag, unit and formula if applicable.
2. **Select it for your team** in the Indicators selections tab.
3. **Configure dashboard visibility and order** in its display preferences.
4. **Assign available KPI positions** where relevant.
5. Return to the dashboard and check the value for the current cycle.

The classic dashboard slot editor offers **four Story Point**, **two Ticket** and **two complementary indicator** positions. Empty positions are allowed.

> **Sally's tip:** choose indicators you can explain clearly. A useful measure has a defined source, unit, period and business meaning.

A missing value may mean an unsaved manual measure or unavailable computed inputs. It does not automatically mean zero.

## 4. Explore lists and shortcuts

### Classic dashboard

Operational panels can display **risks, impediments, events, notes and alerts**. Available actions may include **Add**, **See all**, opening a record and **View sprint details**.

### Dashboard Builder view

Configured slots can display indicators or available business lists. The Builder source catalog currently supports lists for **registers**, **ceremonies** and **sprint notes**. Some sources, including **Links**, **Team** and **Objectives**, may appear as **unavailable** until their data adapters are connected.

A visible source name is not a guarantee that the source can be used.

### Useful shortcuts

- **View sprint details:** open the sprint record in the classic view.
- **Previous / next arrows:** navigate cycles in the Builder.
- **Refresh:** reload displayed Builder data.
- **Add / See all / open record:** act on business sources when permission and context allow.
- **Customize:** edit the Builder layout when authorized.

> **Tip:** use the dashboard to identify the next action, then open the relevant business record for complete details and history.

## 5. What can Dashboard Builder do?

**Dashboard Builder** is a visual tool for composing a dashboard. Open it through **Open my Dashboard Builder** on the classic dashboard, or use **Customize** when the customized view is active.

SMN can keep the classic dashboard as the home screen while providing Builder separately. Automatic cutover to Builder depends on the installation configuration.

You can customize:

- **Header blocks:** titles, icons, colors and dynamic slots.
- **Rows:** add, remove and reorder them.
- **Blocks:** add, move, duplicate, resize or remove.
- **Layout templates:** **M01 Simple**, **M02 Duo**, **M03 Trio**, **M04 Quatuor**, **M05 Asymmetric**, **M06 Composed**.
- **Slots:** select an available source, compatible visualization and filters.
- **Appearance:** edit titles, icons and colors.
- **Reuse:** copy the saved layout to another team.

The Builder arranges information; it does not create the underlying indicators, meetings or registry records.

## 6. Customize step by step

### A. Decide what should be visible

Choose a few questions to answer: the goal, available capacity, delivery results and obstacles. Start with a simple layout.

### B. Start editing

1. Open Dashboard Builder (when authorized for your account) for the correct team.
2. Select **Customize** in the Actions menu, if authorized.
3. Review the header and existing rows.
4. Work on the **draft**; changes are not published until you save.

### C. Add rows and blocks

1. Select **Add row**.
2. Choose **Add block** in the relevant row.
3. Pick one of the six geometry templates.
4. Enter a meaningful block title.
5. Adjust its size or position if needed.

Use **Simple** for one important measure, **Duo** for a pair and **Composed** when one element needs more space.

### D. Configure slots

1. Select an empty **+** slot or an existing configured slot.
2. Choose its **source**.
3. Verify that it is marked **available**.
4. Choose a compatible visualization, such as number, KPI card, gauge, tachometer, trend, bar chart or list.
5. Set any applicable options and confirm.
6. Edit the slot title, icon and color if useful.

For example, place a selected KPI in a card and a risk list in a larger block.

> **Troubleshooting tip:** if an indicator is missing, check its team selection and dashboard visibility in Indicators.

### E. Arrange and save

1. Use drag-and-drop or **Move up / Move down** to order rows and blocks.
2. **Duplicate** a useful block structure.
3. Review confirmations before destructive layout changes.
4. Select **Save** in the fixed bottom bar.
5. Exit editing and verify the consultation view.

**Cancel** discards unsaved changes. **Reset** restores the initial draft layout without deleting business data. Unsaved changes trigger a warning.

## 7. Copy the layout to another team

**Copy to another team** can reuse a saved composition. Check that the target team has the appropriate indicators and available sources; sharing a layout does not ensure identical data.

> **Consistency tip:** use a small shared structure—goal, capacity, results and points of attention—while allowing teams to choose relevant details.

## 8. Interpret the data carefully

- **Unexpected capacity:** inspect member working patterns, assignments and absences.
- **Unexpected Story Points or ticket counts:** inspect indicator definitions, manual values and CSV records.
- **Missing risk:** check team, cycle, list filters and registry records.
- **Unavailable source:** its adapter may not yet be connected; it is different from an empty list.
- **Classic and Builder views differ:** check which dashboard presentation you are using.

## Your final check

Can you quickly explain **which cycle is shown, what each KPI measures, what needs action and which shortcut opens the detail**?

If so, your dashboard is supporting meaningful team discussions, not simply displaying charts.
