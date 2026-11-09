# COGGS ontology for engine upgrades

Machine-readable distillation of the Daedal Games game-domain ontology for COGGS Hit and COGGS Auto. Every entry carries `source`: the ontology section it was distilled from (`doc` and `anchor`, a node id or heading) and a short English note. The ontology is private, so it is cited as text and never linked.

| File | Holds |
| --- | --- |
| faces.json | Auto's lanes (with the code that proves each one runs today), the engine faces, and the upgrade-risk taxonomy: per risk what breaks, the play-observable symptom, `lanes` that reliably show it, `partialLanes` that show it only in some games, and the migration-guide lines in .coggs/guides that say so |
| probes.json | breadth-first-qa probe catalog: edge input and what to observe, per face |
| upkeep.json | store and SDK upkeep checklist from the COGGS upkeep map, mapped onto Hit, with the code that shows what Hit does today |

`node tools/ontology.mjs route "<symptoms or page error>"` ranks the likely risks, faces and probes. `node tools/ontology.mjs coverage` counts what Auto and Hit cover today from the code itself. `node --test tools/ontology.test.mjs` fails when an entry loses its source or a guide quote no longer appears in the guide; set `DAEDAL_ONTOLOGY_DIR` to a checkout of the ontology to also check every anchor still exists there.

