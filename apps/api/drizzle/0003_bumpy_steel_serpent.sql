-- Seeds the one entity noisefloor's admin panel operates against
-- (openspec/changes/add-admin-panel design.md's Decision 1: seeded once,
-- not built through a UI, since a second entity isn't expected soon).
INSERT INTO "entities" ("name") VALUES ('Northern Rural Networks');
