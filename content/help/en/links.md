# Links: build your team's shared resource library

The **Links** module is more than a bookmark list. It gathers the tools, documents and workspaces a team needs so they are **easy to find**, can be **displayed on the dashboard** and, when a template supports them, **included in reports**.

> **Camille's tip:** imagine someone joining your team tomorrow. Could they easily find the backlog, Jira board and essential documentation? If so, your shared link library is doing its job.

## 1. Why keep links in SMN?

Team resources often end up scattered across personal bookmarks and old chat messages. SMN gives them a shared home and supports three uses:

- **Everyday access:** browse, search and open resources related to team activities.
- **Dashboard:** show frequently used resources alongside other sprint or period information through supported link-list blocks.
- **Reports:** include accessible links in compatible Word or PowerPoint templates using link tags.

**Example:** keep the backlog, product Wiki and delivery documentation in SMN. Show key resources on the dashboard and include relevant references in a sprint report.

## 2. Understand Team and Cross-team scope

Each link has a **scope**:

- **Team:** intended for one team, such as its backlog or sprint documentation.
- **Cross-team:** shared resources used in more than one team.

You can filter the accessible link list by scope.

> **Tip:** ask who needs the resource. Choose **Team** for team-specific work and **Cross-team** for genuinely shared references.

Scope does not grant access to the external destination. Users still need permission on the target service.

## 3. Find resources quickly

1. Open [Links](/app/admin/links) when your account has permission.
2. Check the **team name** in the header.
3. Choose **Cards** or **List**.
4. Search by title, description, URL or category.
5. Filter by **scope** and **category**, then sort by **title**, **category** or **recent updates**.
6. Select **Open** to open the target in another tab.

Use descriptive titles such as “Jira backlog — Team Alpha” rather than “Jira link 2”.

## 4. Add a link: every field explained

When authorized, select **Add** to open the form.

**Title — required:** clear name displayed in SMN, such as “Architecture documentation”.

**URL — required:** full destination address. Copy the real page URL and confirm it works.

**Description — optional:** explain when and why the link is useful.

**Category — required:** groups related resources for filtering and reuse. The category must exist in link settings.

**Scope — required:** choose **Team** or **Cross-team**. New links default to Team.

### Create your first entry

1. Select **Add**.
2. Enter a meaningful **title** and the **URL**.
3. Add a short **description**.
4. Choose a **category** and **scope**.
5. Select **Save**.
6. Find the new link and use **Open** to verify the destination.

> **Example:** “Jira backlog — Team Alpha”, description “Issues to review before Sprint Planning”, category “Tracking tools”, scope “Team”, and the real backlog URL.

## 5. Manage categories in Settings

If you need a new category, open **Settings → Links**, create or edit the category there, then return to Links.

Keep the structure simple. Categories such as **Planning**, **Documentation**, **Tools** and **References** can be a useful starting point, depending on what your installation contains.

## 6. Show important links on the dashboard

**A key benefit:** saved links can be displayed in supported **dashboard link-list blocks**, where the selected layout and your editing permissions allow them.

1. Create the resource entries in [Links](/app/admin/links).
2. Open the team's [Dashboard](/app).
3. If authorized, enter dashboard customization and choose a layout or block supporting a link list.
4. Configure the available block options and save.
5. Return to the dashboard to verify which links appear.

A good dashboard combines progress information with quick access to the resources the team needs to take action.

> **Design tip:** display frequently used links on the dashboard and leave occasional references in the complete Links module.

Exact block availability depends on the dashboard template and permissions. Link entries are managed centrally in the Links module.

## 7. Reuse link lists in reports

A sprint report can include references to the backlog, meeting notes and other documents.

SMN Office reporting supports **link tags** in compatible templates, potentially distinguishing **Team** and **Cross-team** resources when supported by the tag configuration.

1. Check the link list is up to date.
2. Open [Reports](/app/reports), then **Tags**.
3. Find the **Links** family and use the tag configurator to choose supported options, including scope if offered.
4. Copy the generated tag into the Word or PowerPoint template.
5. Under **Templates**, select the model and appropriate cycle and generate the document.
6. Review the resulting link list.

**Important:** saving a link does not automatically add it to every report. The report template must contain the relevant tag, and the outcome depends on scope and available resources.

> **Reporting tip:** use stable URLs and make sure recipients are authorized to open the destinations.

## 8. Edit, reclassify or delete a link

Use the **edit icon** on a card or row to update the title, URL, description, category or scope.

Changing the **scope** requires additional confirmation. Review any dashboard views or reports that may rely on that distinction.

Use **Delete** when a resource entry is no longer needed. This removes the link from SMN, not the external document or website.

> **Before deleting:** consider whether teammates still rely on the link in dashboards, reports or team procedures.

## 9. Troubleshooting

- **Link missing:** review team context, scope/category filters and search.
- **Cannot create a link:** check permissions and whether a category exists.
- **Invalid address:** use a valid, complete URL.
- **Destination inaccessible:** check permissions on the external service.
- **Link missing from dashboard:** review the block configuration and link scope.
- **Link missing from report:** check template link tags and available resources.
- **Scope change rejected:** confirm the scope change in the form.

## Your final check

Can you explain **where the team finds its resources, which links should be on the dashboard, and which belong in stakeholder reports**?

When these answers are clear, Links becomes a useful shared library integrated into the team's daily workflow.
