# Reports: turn SMN data into Word and PowerPoint documents

Preparing a Sprint Review, steering committee or period summary? **Reports** lets you produce documents based on SMN information **without manually copying every number, list and event**.

The idea is simple: **design your layout in Word or PowerPoint, insert tags and let SMN resolve those tags for the selected team and cycle**.

> **Camille's tip:** begin with a small template: a title, sprint dates and a few indicators. Check the result before adding tables and charts.

## 1. Understand templates, tags, sources and generated reports

**An Office template** is a real **Word (.docx)** or **PowerPoint (.pptx)** file. You design its layout, headings, text, tables and chart placeholders. It can be reused across cycles.

**A tag** is a marker inside that template that tells SMN what to insert or repeat. For example, `{{TEAM_NAME}}` asks for the report team's name.

**A data source** is information available in SMN: team, cycle, indicators, members, goals, meetings, registers, links or dated ticket CSV snapshots.

**A generated report** is a new DOCX or PPTX in which supported markers have been replaced. Your original template remains reusable.

### A simple example

Write “Review of `{{SPRINT_NAME}}`” and “Team: `{{TEAM_NAME}}`” in a Word file. Select a sprint when generating. SMN fills those markers using the selected sprint and team.

## 2. Where does the inserted information come from?

1. Choose an **Office template** and an authorized **sprint or cycle**.
2. SMN recognizes supported **tags** in the file.
3. The engine reads the **corresponding business sources** in the selected scope.
4. It replaces a value, repeats rows or inserts a chart.
5. It creates a new **DOCX or PPTX** to download or save.

Available families include:

- **Team and product:** team name, product name, goal and vision.
- **Sprint or period:** name, dates, status and goals.
- **Members:** active/inactive lists, functions, roles and locations.
- **Dynamic indicators:** available values from the team's indicator catalog.
- **Registers:** risks, obstacles, dependencies, decisions, actions and highlights as supported by the projection.
- **Ceremonies and meetings:** names, scheduled times, durations and statuses.
- **Notes and links:** dashboard notes and accessible team or cross-team links.
- **Ticket CSV:** selected snapshots, counts, summaries and changes between dates.

> **Important:** ticket snapshots are selected explicitly when the template needs them. Some closed-sprint information may come from closure snapshots rather than live data. Generating a report does not update indicator values.

## 3. Four kinds of content you can insert

### Scalar values

Insert tags directly in a paragraph or text box:

- `{{TEAM_NAME}}`: team name.
- `{{SPRINT_NAME}}`: selected sprint.
- `{{SPRINT_START}}` and `{{SPRINT_END}}`: sprint dates.
- `{{TODAY}}`: generation date.
- `{{PRODUCT_NAME}}` and `{{PRODUCT_VISION}}`: product context.

These are ideal for cover pages and summaries.

### Dynamic indicators

An indicator tag such as `{{INDICATOR_VELOCITY}}` requests its value **only if the corresponding tag is defined for the team**. This is an illustrative example: always select the actual tag from the catalog.

Missing data should not be interpreted as zero.

### Data tables

Use a **ROW marker** in a sample Word or PowerPoint table row, alongside fields from the same collection.

For example, place `{{ROW:RISKS}}` in the sample row and add `{{RISK_TITLE}}` and `{{RISK_STATUS}}` in its cells. SMN repeats that row for available risks.

Collections include members, indicators, risks, obstacles, dependencies, notes, meetings, goals, actions, decisions, tickets and links.

For links, `{{ROW:LINKS_TEAM}}` returns report team links and `{{ROW:LINKS_TRANSVERSE}}` returns accessible cross-team links.

For sorting, a marker such as `{{ROW:MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION:ASC,MEMBER_NAME:ASC}}` orders active members by function and then name.

> **Layout tip:** tables can grow. PowerPoint content may overflow its slide because the layout is not automatically resized in every case.

### Charts

A marker such as `{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6}}` asks for a six-sprint trend chart using the specified indicator when available.

Supported chart families include bars, lines, areas, pie, donut and gauge. Gauges require one value between 0 and 100; other charts have their own compatibility rules.

**Placement rule:** put the chart tag **alone in its Word paragraph or PowerPoint text box** so that SMN can replace it with a chart image.

## 4. Create your first Office template

1. Create a real **DOCX or PPTX** document in Office.
2. Plan the cover, content sections, tables and any chart locations.
3. Keep fixed text and branding in the file.
4. Paste SMN tags where dynamic content belongs.
5. Save the file in the **Office templates directory** shown in **Reports → Templates**.
6. Select **Refresh** in SMN to update the detected catalog.
7. Generate a trial report for a cycle with data and review it.

SMN validates supported Office packages; renaming an unrelated file to DOCX or PPTX is not enough.

**Word** is well suited to longer documents, narratives and detailed tables. **PowerPoint** is better for concise reviews and presentations. Both support tags, subject to their layout constraints.

> **Sally's tip:** test two scalar tags first. Then add one table or chart, so errors are easier to diagnose.

## 5. Use the tag configurator step by step

Open [Reports](/app/reports), choose **Tags** and launch the **Tag configurator**.

The configurator helps you construct valid expressions without memorizing their syntax.

### Select a tag family

1. **Scalar:** choose a field such as team or sprint name.
2. **Indicator:** select an active indicator from the team's catalog.
3. **Row:** choose a collection and optionally configure **sort fields**, ascending/descending direction and rule priority.
4. **Chart:** choose chart type, indicator series and available period or style options.

### Copy the result

1. Select the **family**.
2. Use the **search** or selection list.
3. Set any relevant options.
4. Review the **generated expression**.
5. Select **Copy** and paste the tag into your Office template.
6. For tables, also copy the provided **column tags** into the same sample row.
7. Use **Reset** if you want to start again.

Chart configuration reads available indicators and applicable styles. Copy may be disabled if a required catalog or valid selection is missing.

Sorting rules can be reordered; sorting by function then name is different from sorting by name then function.

> **Remember:** the configurator builds and copies text. It does not directly edit your Word or PowerPoint file.

## 6. Generate the report and check the form

Under **Templates**, select your model and complete the options:

- **Sprint or cycle:** controls the business context.
- **Filename:** identifies the output document.
- **Language:** French or English for supported content.
- **Chart style:** optional presentation style.
- **Main ticket snapshot:** tickets and metrics for one reference date.
- **Previous ticket snapshot:** supports comparison tags where required.

**Generate** downloads the resulting document. **Save** writes it to SMN's **Office reports directory**. When a filename already exists, review the overwrite confirmation.

> **Example:** for Sprint Review, select your PPTX template and sprint. If your template includes ticket comparisons, select the relevant beginning and ending snapshots, then generate and review the slides.

## 7. Understand the Report Center tabs

- **Reports:** find saved reports with available search and cycle/status filters.
- **Templates:** detect DOCX/PPTX models and generate Office files.
- **Tags:** browse the reference catalog and use the configurator.
- **Archives:** browse and download available archived items.

Actions vary by account permissions and installation context. **New report**, where offered, is a different workflow from direct Office generation under **Templates**.

## 8. Review before sharing

1. Check the **team**, **cycle** and dates.
2. Confirm indicator **values, units and source periods**.
3. Inspect table rows, sorting and overflow.
4. Review charts, series, legends and spacing.
5. Verify ticket snapshot reference dates if used.
6. Test resource links and the recipients' access rights.

An unresolved tag may indicate invalid syntax, placement or unavailable source data. Missing data is not zero.

If tables or charts overflow, adjust the Office template's available space rather than assuming SMN will resize everything.

## Your final check

You should be able to explain **which template is used, what each tag requests, where the data comes from and how you verified the result**.

Once those answers are clear, Office reports become a repeatable way to communicate your team's work with consistent presentation.
