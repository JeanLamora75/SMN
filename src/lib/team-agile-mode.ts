export const AGILE_MODES = ["scrum", "kanban"] as const;

export type AgileMode = (typeof AGILE_MODES)[number];

/** A user-facing creation request must always provide its mode explicitly. */
export function isAgileMode(value: unknown): value is AgileMode {
  return value === "scrum" || value === "kanban";
}

/** The fallback is reserved for importing legacy teams with no reliable mode. */
export function historicalAgileMode(
  teamMode: unknown,
  installationMode: unknown,
): AgileMode {
  if (isAgileMode(teamMode)) return teamMode;
  if (isAgileMode(installationMode)) return installationMode;
  return "scrum";
}

/**
 * The stored historical marker is monotonic. Deleting or archiving a cycle
 * must not unlock a team that has already had a cycle.
 */
export function modeIsLocked(
  historicalCycleCreated: boolean,
): boolean {
  return historicalCycleCreated;
}

export function canChangeAgileMode(
  currentMode: AgileMode,
  requestedMode: AgileMode,
  historicalCycleCreated: boolean,
): boolean {
  return currentMode === requestedMode || !modeIsLocked(historicalCycleCreated);
}

/** Never allow a lifecycle change to remove the installation's last active team. */
export function canArchiveTeam(
  targetIsActive: boolean,
  activeTeamsInInstallation: number,
): boolean {
  return targetIsActive && Number.isSafeInteger(activeTeamsInInstallation)
    && activeTeamsInInstallation > 1;
}
