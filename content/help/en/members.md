# Members: build a reliable picture of team capacity

A team member is more than a name on a roster. **Their profile, assignment, work schedule, country and absences** help SMN represent team availability. Taking time to check this information prevents misleading sprint capacity figures.

> **Good habit:** start with members already in SMN. Update existing records instead of creating duplicates.

## 1. Find the right team members

1. Open [Team / Members](/app/admin/members) and check the selected team.
2. Choose **Cards** for browsing profiles or **List** to compare people.
3. Use **name**, **role**, **function** and **status** filters, then select **Filter**.
4. Review **Active** and **Inactive** groups. Someone who has left the team may still belong in its history.
5. Open a member record to review the details.

Cards/List is a local display preference; it does not modify assignments.

## 2. Complete the profile: why each field matters

### Identity and professional function

**Display name** — Identifies the person in the roster and records.

**Email address** — Optional contact information where relevant; it does not determine team assignment.

**Professional function** — Describes the person's job or specialty. It is different from their **Agile role**: someone may divide their activity between development, Scrum Master and Product Owner responsibilities.

### Location determines the national holiday calendar

Open **Location** on the member record and review:

- **Country (two-letter ISO code)** — Identifies the member's country and the matching national public holidays.
- **Region** — Adds geographical context.
- **City** — Identifies the usual working location.
- **Time zone (IANA)** — Provides the member's time-zone reference.
- **Effective date** — Indicates when the location version takes effect.

**Do you need to enter public holidays manually?** Not for national holidays already included in SMN's reference data. The member calendar automatically looks up holidays for the **country stored on that member's location record**, rather than using the installation country or another person's location.

> **Example:** a team may include one person in France and another in India. Each calendar should show the national holidays of the corresponding country when those dates are included in SMN's reference data. Always check the **country**, not just the city or time zone.

**Important:** local or regional holidays are not guaranteed to be available. Check the calendar when a particular non-working day matters for planning.

## 3. Define team assignment and Agile roles

Open **Assignment**. Assignment start and end dates determine when a person belongs to the team, including for historical sprints.

### Understand the percentages

**Contract percentage** — Reference working-time proportion.

**Allocation percentage** — The part assigned to the team. The form checks that allocation does not exceed contract percentage.

**Contribution percentage** — Describes the contribution configured for planning.

**Role distribution** — Allocates **100%** across **Scrum Master**, **Product Owner** and **Developer**, as required by the form.

**Effective date** — Records when a change becomes applicable, preserving dated assignment versions.

> **Example:** a part-time employee may be assigned to the team for only part of their working time and split their responsibilities between development and Scrum Master duties. Their name alone cannot determine development capacity.

### Joining, leaving and history

1. Review the **assignment start date**.
2. When a person leaves, enter the **end date** and an optional reason.
3. Record changes of responsibility with a **new dated version**.
4. Correct a historical revision only to fix an earlier mistake.

Ending an assignment is not the same as deleting the member.

## 4. Configure working days and half-days

Open **Calendar**, then **Edit work calendar**.

The form shows Monday through Sunday with two slots per day:

- **Morning worked** — Check when the member normally works in the morning.
- **Afternoon worked** — Check when the member normally works in the afternoon.
- **Effective date** — Defines when this weekly pattern starts to apply.

Half-day slots help represent a non-working Wednesday afternoon or a part-time schedule.

When no schedule has been saved, SMN can suggest a Monday-to-Friday week with both half-days worked. **A suggestion is not a validated schedule**: adjust and save it based on the person's real working pattern.

> **Planning tip:** avoid copying one member's working week to everyone. Two developers with identical contract percentages may follow different schedules.

## 5. Check absences and calendar exceptions

From the member record, review the calendar and absences. The absence form includes **start and end dates**, **half-day slots**, a **category**, a **reason**, and whether the absence is **planned or unplanned**.

Calendar exceptions capture one-off changes to the normal working week. National holidays available in SMN are looked up automatically from the member's country, so you do not need to create a manual absence for each supported holiday.

Avoid duplicate absences and ensure dates fall within the relevant team assignment. Be careful with historical changes affecting closed sprints.

## 6. How member information feeds team capacity

Team capacity is not simply **headcount multiplied by sprint days**. Several pieces of information matter together:

1. **Assignment period** — Is the member part of this team on the relevant dates?
2. **Contract, allocation and contribution** — How much activity should be considered?
3. **Agile roles** — How is work distributed across development, Scrum Master and Product Owner duties?
4. **Personal work calendar** — Which days and half-days are worked?
5. **Country and public holidays** — Which national holidays apply to this member?
6. **Absences and exceptions** — What changes the available working time?

These inputs inform availability, worked-day and capacity information in SMN. The exact calculation depends on the indicator's definition: **total person-day capacity** and **development capacity** need not include the same activities.

> **Example:** a sprint covers ten usual working days. One member only joins in week two, another does not work Wednesday afternoons, and a third has a national holiday. Counting three people for ten full days would overstate availability.

## 7. When capacity or holidays look wrong

- **Capacity too high:** check assignment end dates, working patterns and missing absences.
- **Capacity too low:** check assignment dates, unchecked half-days, percentages and recorded absences.
- **Missing public holiday:** verify the member's country code and that the holiday exists in SMN's reference data.
- **Wrong country's holiday:** correct the member's **Location**, not the global installation country.
- **Unexpected historical result:** review dated versions and closed sprint states. Some closed-sprint indicators may need to be refreshed by closing the sprint again after a correction.

## Your final check

Ask yourself: **Are assignment dates correct? Do contract and role percentages reflect reality? Is the work schedule accurate? Does the country match the holiday calendar? Have absences been reviewed?**

Once these details are reliable, your team is in a better position to plan sprints and interpret capacity indicators.
