import type {RecommendedIndicator} from "./recommended-catalog";

/** English wording for the reference library; formulas and technical tags remain unchanged. */
const english:Record<string,readonly [string,string,string,string,string,string,string]>={
 "SCR-01": [
  "Commitment",
  "Initially planned tickets",
  "Number of tickets planned at Sprint start.",
  "20 tickets entered",
  "20 tickets",
  "Baseline volume for comparing completion.",
  "Does not identify which planned tickets were completed."
 ],
 "SCR-02": [
  "Commitment",
  "Initially planned Story Points",
  "Sum of Story Points initially planned for the Sprint.",
  "80 SP entered",
  "80 SP",
  "Initial estimated Sprint volume.",
  "Does not measure working time."
 ],
 "SCR-03": [
  "Delivery",
  "Completed tickets",
  "Number of tickets completed during the Sprint.",
  "16 tickets entered",
  "16 tickets",
  "Measures the amount of work completed.",
  "May include tickets added after Sprint start."
 ],
 "SCR-04": [
  "Delivery",
  "Completed Story Points",
  "Total Story Points associated with completed tickets.",
  "64 SP entered",
  "64 SP",
  "Shows the completed work volume.",
  "Does not imply individual productivity."
 ],
 "SCR-05": [
  "Delivery",
  "Ticket completion rate",
  "Ratio of completed tickets to initially planned tickets.",
  "16 / 20 × 100",
  "80 %",
  "Tracks volume completion.",
  "A zero denominator is unavailable. This does not prove that the originally committed tickets were delivered and may exceed 100%."
 ],
 "SCR-06": [
  "Delivery",
  "Story Point completion rate",
  "Ratio of completed Story Points to the initial amount.",
  "64 / 80 × 100",
  "80 %",
  "Compares initial and completed estimated volumes.",
  "A zero denominator is unavailable. Delivered tickets may differ from the initial plan."
 ],
 "SCR-07": [
  "Delivery",
  "Ticket difference",
  "Difference between completed and planned ticket volumes.",
  "16 - 20",
  "−4 tickets",
  "Shows the raw difference in ticket count.",
  "Tickets are not necessarily equal in size."
 ],
 "SCR-08": [
  "Delivery",
  "Story Point difference",
  "Difference between completed and initially planned Story Points.",
  "64 - 80",
  "−16 SP",
  "Shows the raw difference in estimated work volume.",
  "Does not reveal which work items changed."
 ],
 "SCR-09": [
  "Scope",
  "Added Story Points",
  "Story Points added during the Sprint.",
  "13 SP entered",
  "13 SP",
  "Makes scope additions visible.",
  "Does not identify which tickets were completed."
 ],
 "SCR-10": [
  "Scope",
  "Removed Story Points",
  "Story Points removed during the Sprint.",
  "5 SP entered",
  "5 SP",
  "Makes scope removals visible.",
  "Additions are not automatically offset by removals."
 ],
 "SCR-11": [
  "Scope",
  "Net scope change",
  "Net estimated scope change relative to the initial baseline.",
  "(13 - 5) / 80 × 100",
  "10 %",
  "Compares additions and removals proportionally.",
  "Opposing changes may cancel out; also inspect the underlying values."
 ],
 "SCR-12": [
  "Capacity",
  "Maximum developer capacity",
  "Theoretical developer capacity before absences.",
  "Maximum capacity: 50 person-days",
  "50 person-days",
  "Provides an availability baseline.",
  "Theoretical capacity differs from effort spent."
 ],
 "SCR-13": [
  "Capacity",
  "Planned developer capacity",
  "Capacity after planned absences.",
  "Planned capacity: 44 person-days",
  "44 person-days",
  "Supports forward planning.",
  "Unexpected absences are not deducted here."
 ],
 "SCR-14": [
  "Capacity",
  "Actual developer capacity",
  "Capacity after all recorded absences.",
  "Actual capacity: 40 person-days",
  "40 person-days",
  "Shows effective availability.",
  "This is not actual effort consumed."
 ],
 "SCR-15": [
  "Capacity",
  "Developer availability rate",
  "Actual capacity divided by maximum capacity.",
  "40 / 50 × 100",
  "80 %",
  "Shows the effect of unavailability.",
  "A zero denominator is unavailable. Does not measure productivity."
 ],
 "SCR-16": [
  "Capacity",
  "Actual vs planned capacity difference",
  "Difference between effective and planned capacity.",
  "40 - 44",
  "−4 person-days",
  "Highlights unexpected changes in availability.",
  "Interpret results in light of absence data quality."
 ],
 "SCR-17": [
  "Trends",
  "Average velocity over 5 Sprints",
  "Average completed Story Points over five Sprints.",
  "SP: 32, 40, 36, 44, 38",
  "38 SP",
  "Helps estimate future delivery magnitude.",
  "The selected Sprint is included; compare Sprints of similar duration."
 ],
 "SCR-18": [
  "Trends",
  "Average throughput over 5 Sprints",
  "Average number of completed tickets over five Sprints.",
  "Tickets: 8, 9, 11, 10, 12",
  "10 tickets",
  "Tracks team delivery pace.",
  "Ticket sizes may vary."
 ],
 "SCR-19": [
  "Trends",
  "Velocity change",
  "Absolute change in completed Story Points from the previous Sprint.",
  "38 SP versus 44 SP",
  "−6 SP",
  "Identifies Sprint-to-Sprint changes.",
  "One change alone does not establish a trend."
 ],
 "SCR-20": [
  "Trends",
  "Relative velocity change",
  "Percentage change in completed Story Points from the previous Sprint.",
  "45 SP versus 40 SP",
  "12.5 %",
  "Compares proportional changes.",
  "A previous value of zero makes the calculation unavailable."
 ],
 "SCR-21": [
  "Trends",
  "Minimum velocity over 5 Sprints",
  "Fewest completed Story Points among five Sprints.",
  "SP: 32, 40, 36, 44, 38",
  "32 SP",
  "Provides a historical lower bound.",
  "Not a commitment for future results."
 ],
 "SCR-22": [
  "Trends",
  "Maximum velocity over 5 Sprints",
  "Most completed Story Points among five Sprints.",
  "SP: 32, 40, 36, 44, 38",
  "44 SP",
  "Provides a historical upper bound.",
  "Not a systematic target."
 ],
 "SCR-23": [
  "Trends",
  "Velocity range over 5 Sprints",
  "Difference between maximum and minimum completed work over five Sprints.",
  "44 - 32",
  "12 SP",
  "Shows observed result variability.",
  "A range is not a standard deviation."
 ],
 "SCR-24": [
  "Trends",
  "Change in completion rate",
  "Change in completion rate, in percentage points, between two Sprints.",
  "80% versus 75%",
  "5 points",
  "Tracks predictability of delivery volume.",
  "Requires SP_RATE, defined as SP_DONE / SP_INITIAL * 100. This is a change in points, not relative growth."
 ],
 "KAN-01": [
  "Throughput",
  "Tickets completed in the period",
  "Number of tickets completed during the Kanban period.",
  "12 tickets entered",
  "12 tickets",
  "Measures throughput for a period.",
  "Periods should be comparable."
 ],
 "KAN-02": [
  "Throughput",
  "Average throughput over 5 periods",
  "Average completed tickets across five periods.",
  "8, 9, 11, 10, 12",
  "10 tickets",
  "Provides a throughput reference.",
  "Different period lengths distort comparisons."
 ],
 "KAN-03": [
  "Throughput",
  "Throughput change",
  "Difference between current and previous throughput.",
  "12 versus 10",
  "2 tickets",
  "Measures absolute throughput change.",
  "A short-term increase alone proves little."
 ],
 "KAN-04": [
  "Throughput",
  "Relative throughput change",
  "Relative throughput change across two periods.",
  "12 versus 10",
  "20 %",
  "Compares proportional throughput.",
  "A zero previous value is unavailable."
 ],
 "KAN-05": [
  "Throughput",
  "Minimum throughput over 5 periods",
  "Fewest completed tickets within the window.",
  "8, 9, 11, 10, 12",
  "8 tickets",
  "Shows the observed historical minimum.",
  "Not a guarantee of future throughput."
 ],
 "KAN-06": [
  "Throughput",
  "Maximum throughput over 5 periods",
  "Most completed tickets within the window.",
  "8, 9, 11, 10, 12",
  "12 tickets",
  "Shows the observed historical maximum.",
  "Not a standard delivery target."
 ],
 "KAN-07": [
  "Throughput",
  "Throughput range over 5 periods",
  "Difference between highest and lowest throughput over five periods.",
  "12 - 8",
  "4 tickets",
  "Makes throughput variability easy to see.",
  "This is not a standard deviation."
 ],
 "KAN-08": [
  "Flow",
  "Work in progress (WIP)",
  "Number of started but unfinished work items at a given point in time.",
  "7 tickets in progress",
  "7 tickets",
  "Shows the current work in the system.",
  "Specify which statuses count as WIP and when measured."
 ],
 "KAN-09": [
  "Flow",
  "Currently blocked tickets",
  "Blocked tickets among WIP at the same point in time.",
  "2 blocked tickets",
  "2 tickets",
  "Shows how much work cannot progress.",
  "Do not confuse the current blocked count with incidents over the period."
 ],
 "KAN-10": [
  "Flow",
  "Blocked WIP share",
  "Share of active work items that are blocked.",
  "2 / 8 × 100",
  "25 %",
  "Quantifies the effect of current blockers.",
  "A zero WIP is unavailable; both values must be measured at the same time."
 ],
 "KAN-11": [
  "Flow",
  "Average Cycle Time",
  "Average time from starting to completing an item.",
  "6 days, external measure entered",
  "6 days",
  "Provides a reference for processing time.",
  "Calculate the value before entry; specify start/end events, unit and period."
 ],
 "KAN-12": [
  "Flow",
  "Average Lead Time",
  "Average elapsed time from entering the agreed workflow to delivery.",
  "9 days, external measure entered",
  "9 days",
  "Measures elapsed time through the workflow.",
  "Define workflow boundaries; this measurement may come from outside SMN."
 ],
 "KAN-13": [
  "Capacity",
  "Maximum developer capacity",
  "Theoretical developer availability for the Kanban period.",
  "Maximum capacity: 50 person-days",
  "50 person-days",
  "Shows theoretical resources.",
  "Depends on roles and the configured period."
 ],
 "KAN-14": [
  "Capacity",
  "Planned developer capacity",
  "Availability after planned absences.",
  "Planned capacity: 44 person-days",
  "44 person-days",
  "Estimates planned availability.",
  "Does not deduct unexpected absences."
 ],
 "KAN-15": [
  "Capacity",
  "Actual developer capacity",
  "Availability after recorded absences.",
  "Actual capacity: 40 person-days",
  "40 person-days",
  "Shows effective availability.",
  "Does not measure effort consumed."
 ],
 "KAN-16": [
  "Capacity",
  "Developer availability rate",
  "Share of maximum theoretical capacity that is available.",
  "40 / 50 × 100",
  "80 %",
  "Visualizes unavailability.",
  "A zero denominator is unavailable."
 ],
 "KAN-17": [
  "Capacity",
  "Actual vs planned capacity difference",
  "Difference between actual and planned capacity.",
  "40 - 44",
  "−4 person-days",
  "Identifies the availability gap.",
  "Does not measure throughput."
 ]
};

export function localizeRecommendedIndicator(entry:RecommendedIndicator,locale:string):RecommendedIndicator{
 if(locale!=="en")return entry;
 const v=english[entry.id];
 if(!v)return entry;
 const [domain,name,purpose,exampleInputs,exampleResult,interpretation,caveat]=v;
 const unit=entry.unit==="jours"?"days":entry.unit==="points de %"?"percentage points":entry.unit;
 const display=unit==="%"?"Card / trend":unit==="J/H"?"Card / evolution":"Card / histogram";
 return {...entry,domain,name,purpose,exampleInputs,exampleResult,interpretation,caveat,unit,display};
}
