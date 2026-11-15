# Indicators: give your team useful, explainable measurements

Indicators are not about collecting as many numbers as possible. They help the team **understand its situation, see changes and make better decisions**. SMN separates **definitions**, **team selections** and **cycle values and displays**.

> **Camille's tip:** start with a few indicators you can explain to your team. Every useful number needs a clear definition, unit, source and period.

## 1. Why use indicators?

You can use indicators to follow sprint or Kanban period progress, understand available capacity, compare cycles, identify trends and communicate results through dashboards and reports.

**Example:** Story Points completed and development capacity are more meaningful when reviewed over several sprints alongside changes in staffing or scope.

> **Remember:** team indicators should support discussions, not turn into individual performance scores.

## 2. Manual and computed indicators: what is the difference?

**Manual indicators** are defined in the catalog, but their value must be **entered for each cycle** by an authorized user. An empty value is not automatically zero.

Examples include a measure agreed during Sprint Planning or a ticket count copied from the calculated statistics in **Tickets / CSV**.

**Computed indicators** use a **formula defined in Settings**. SMN evaluates available sources: other indicators, historical cycle values or role-based capacity data. You do not type their final result into the manual input field.

**Example:** `(SP_DONE / SP_PLANNED) * 100` can represent a completion percentage **when those tags exist in your catalog**. A zero denominator or missing source makes the result unavailable.

> **Good practice:** use manual indicators for source measurements and computed indicators for ratios, derived figures and comparisons.

## 3. Define the global catalog in Settings

Administrators open **Settings → Indicators** and use the **Catalog** tab.

### What the fields mean

- **Name:** understandable business label displayed in SMN.
- **Tag:** unique technical identifier used in formulas and report templates, for example `SP_DONE`.
- **Type:** Manual or Computed.
- **Formula:** required for computed indicators.
- **Description:** business definition and measurement convention.
- **Unit / short unit:** for example Story Points / SP or Percentage / %.
- **Color and icon:** optional visual identifiers for supported displays.

### Create an indicator

1. Open the catalog and select **Create**.
2. Enter a meaningful name and stable tag.
3. Choose **Manual** or **Computed** and enter a formula for computed indicators.
4. Add a clear description and units.
5. Save and verify the new definition in the catalog.

**Important:** changing an indicator tag can affect external Office templates. SMN may preserve internal formula associations, but does **not automatically rewrite tags already stored in Word or PowerPoint files**.

## 4. Understand how formulas work

A formula can use arithmetic operators, other indicator tags and supported functions. Under **Settings → Indicators → Expression guide**, SMN documents the available syntax.

**Arithmetic:** addition, subtraction, multiplication, division, exponentiation, percentages and `MIN`, `MAX`, `ROUND`.

**History:** `SUM_LAST(TAG, X)`, `AVG_LAST(TAG, X)`, `PREVIOUS(TAG, X)`, `DELTA`, `DELTA_PCT`, `AVG_WEEK_LAST` and other functions. Some include the selected cycle.

**Role capacity:** `ROLE_MAX_JH("DEVELOPER")` before absences; `ROLE_JH_PLANNED("DEVELOPER")` after planned absences; `ROLE_JH("DEVELOPER")` after all recorded absences.

**Example:** `AVG_LAST(SP_DONE, 3)` requests the average of `SP_DONE` over three cycles when that indicator and its required values exist.

The engine resolves dependencies. Missing sources, division by zero and invalid domains can produce **unavailable** results rather than invented zeros.

## 5. Preview before changing a formula

A formula change can affect several cycles and dependent indicators.

1. Open the computed indicator definition.
2. Edit its formula in the formula editor.
3. Select **Preview**.
4. Review **affected indicators**, **cycles**, **results** and **unavailable values**.
5. Confirm **Publish** only when the impact is acceptable.

Unknown functions, references or invalid syntax must be corrected before publishing.

> **Tip:** changing a formula changes the meaning of historical comparisons. Communicate important changes to the team.

## 6. Select indicators for each team

**A global catalog definition is not automatically selected for every team.**

1. Open [Indicators](/app/admin/indicators) in the correct team context.
2. Choose the **Selections** tab.
3. Find each indicator by **tag** and **name**.
4. Check **Selected** to activate it for this team, or uncheck it to remove the selection.
5. Review its cycle values and display preferences.

Archived definitions cannot be selected as active measures. Scrum and Kanban teams may use different subsets of the same global catalog.

> **Keep the selection focused:** choose measures that answer real questions rather than enabling everything available.

## 7. Enter values for a sprint or Kanban period

The **Indicators** screen lists cycles, statuses, dates and configured columns, with an **Edit** action for each row where access allows it.

1. Check the team and selected cycle.
2. Select **Edit** on the relevant cycle.
3. Enter **manual indicator** values.
4. Expand the **Computed indicators** section.
5. Select **Preview** to inspect the calculation results and errors.
6. Select **Save** after reviewing them.

Computed indicators are calculated rather than typed. Changing one manual source may update several computed results.

> **Example:** after importing a ticket CSV, use its statistics as a source for an appropriate manual indicator, then preview any formulas that depend on it.

## 8. Decide what appears in lists and other screens

**Team selection** and **per-screen display preferences** are separate concepts.

Open **Display preferences** to control the selected indicators shown on:

- **Dashboard**
- **Cycle list**
- **Cycle detail**
- **Trends**
- **Reports**

For each screen, supported settings include **visibility**, **order** and **style**, such as number, card, gauge, line or bar.

### What determines the list columns?

The cycle list displays columns according to team selection and display preferences. Headers may show **initials based on the indicator name**, with the full name available through the tooltip or accessible heading.

For example, “Completion Rate” may appear abbreviated. Use the full name and catalog description to understand the definition.

**Manage columns** opens the relevant preference controls. You can reorder entries using move buttons or drag-and-drop when available.

### Dashboard placements

The dashboard slot editor provides **four Story Point positions**, **two Ticket positions** and **two complementary indicator positions**. Assign selected, active indicators as needed; unused positions can remain empty.

> **Sally's tip:** keep cycle lists compact so comparisons remain readable. Show more detail in dedicated views, charts and reports.

## 9. Use indicators in trends and Office reports

Indicators can be included in trends and compatible Word or PowerPoint reports. Office tags refer to real catalog tags, for example `{{INDICATOR_SP_DONE}}` **only when `SP_DONE` exists**.

Before comparing trends, check that units, formulas and cycle scope are consistent.

## 10. Troubleshooting

- **Indicator missing from a list:** check the global definition, team selection and that screen's visibility preference.
- **Manual value absent:** verify the correct cycle and saved entry.
- **Computed result unavailable:** check required sources, dependencies, zero denominators and historical data.
- **Abbreviated heading unclear:** inspect the full title and catalog definition.
- **Formula changed:** preview the impact and use authorized publish/recalculation tools.
- **Report value differs:** compare team, cycle, formula and reporting tag.

## Your final check

For each important indicator, can you explain **what it measures, who provides its value, how it is calculated, which team and cycle it belongs to, and where it appears**?

If so, your indicators can genuinely support transparent and constructive team decisions.
