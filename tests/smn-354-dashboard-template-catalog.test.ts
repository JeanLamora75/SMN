import assert from "node:assert/strict";
import test from "node:test";
import {
  DASHBOARD_TEMPLATES,
  getDashboardTemplate,
  latestTemplateVersion,
  listCreatableDashboardTemplates,
  migrateTemplateBlock,
  requireCreatableDashboardTemplate,
} from "../src/lib/dashboard-builder/templates";

const expectations = [
  ["M01", 1, 1, 1, [1]],
  ["M02", 2, 2, 1, [1, 1]],
  ["M03", 3, 3, 1, [1, 1, 1]],
  ["M04", 4, 2, 2, [1, 1, 1, 1]],
  ["M05", 2, 3, 1, [2, 1]],
  ["M06", 3, 3, 2, [4, 1, 1]],
] as const;

for (const [id, count, columns, rows, area] of expectations) {
  test(`SMN-354 AC1/AC2: ${id} version, geometry, thumbnail, no business configuration`, () => {
    const template = getDashboardTemplate(id);
    assert.ok(template);
    assert.equal(template.version, 1);
    assert.equal(template.id, id);
    assert.equal(template.slotCount, count);
    assert.equal(template.columns, columns);
    assert.equal(template.rows, rows);
    assert.deepEqual(template.slots.map(s => s.columnSpan * s.rowSpan), area);
    assert.equal(template.thumbnail.length, rows);
    assert.ok(template.thumbnail.every(r => r.length === columns));
    assert.equal(new Set(template.slots.map(s => s.slotId)).size, count);
    assert.equal(Object.hasOwn(template, "source"), false);
    assert.equal(Object.hasOwn(template, "visualization"), false);
    assert.equal(latestTemplateVersion(id), 1);
  });
}
test("SMN-354 AC3: creation catalog and lookup of recorded versions are separate", () => {
  assert.equal(listCreatableDashboardTemplates().length, 6);
  for (const template of DASHBOARD_TEMPLATES) {
    assert.equal(requireCreatableDashboardTemplate(template.id), template);
    assert.equal(getDashboardTemplate(template.id, template.version), template);
    assert.equal(Object.isFrozen(template), true);
  }
});
test("SMN-354 AC4: migration of current versions preserves all slot configurations", () => {
  const slots = [{ templateSlotId: "primary", sourceId: "F01", filters: { team: "A" } }];
  const result = migrateTemplateBlock({ templateId: "M01", templateVersion: 1, slots }, []);
  assert.deepEqual(result.slots, slots);
  assert.notEqual(result.slots, slots);
  assert.notEqual(result.slots[0], slots[0]);
});
test("SMN-354 AC4: corrupt source versions and unmapped slots are rejected", () => {
  assert.throws(() => migrateTemplateBlock({ templateId: "M01", templateVersion: 0, slots: [] }, []));
  assert.throws(() => migrateTemplateBlock({ templateId: "M01", templateVersion: 2, slots: [] }, []));
  assert.throws(() => migrateTemplateBlock({ templateId: "M01", templateVersion: 1, slots: [{ templateSlotId: "unknown" }] }, []));
});
