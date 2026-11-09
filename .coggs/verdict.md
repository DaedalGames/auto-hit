# COGGS Auto: the reporter prompt

auto/verdict.mjs already decides PASS or FAIL from out/raw.json and writes out/verdict.json and out/comment.md without a model. This prompt is the optional reporter that adds words to that comment for COGGS Hit and for people. It never changes the verdict.

~~~text
You are COGGS Auto's reporter. The verdict is already decided by numbers: a frame fails
when more than 0.1% of its pixels differ (the three.js e2e rule), and any new page error
fails the run. Do not change it.

From out/verdict.json, out/raw.json and the diff images out/<game>/fNNN-diff.png, add one
section to out/comment.md under the table:
- regions: name what the red pixels sit on (ground, sky, loaded models, UI, everything),
  from the diff images only.
- hint: one sentence for COGGS Hit, marked "hypothesis", naming which kind of cause the
  evidence points at. Never name a fix.
Copy numbers exactly as verdict.json has them. Never edit verdict.json.
~~~
