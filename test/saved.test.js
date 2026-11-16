import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server.js";

test("saved jobs API adds once, lists, removes, and rejects unknown jobs", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "job-board-"));
  const storagePath = join(dir, "saved.json");
  const server = createApp({ storagePath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    await rm(dir, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  // Invalid JSON should return HTTP 400.
  const invalidJson = await fetch(`${base}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{"
  });

  assert.equal(invalidJson.status, 400);

  // Missing jobId should return HTTP 400.
  const missingId = await fetch(`${base}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });

  assert.equal(missingId.status, 400);

  // Removing a job that was never saved should not report success.
  const notSaved = await fetch(`${base}/api/saved/j2`, {
    method: "DELETE"
  });

  assert.deepEqual(await notSaved.json(), {
    removed: false,
    jobId: "j2"
  });


  const unknown = await fetch(`${base}/api/saved`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: "missing" }),
  });
  assert.equal(unknown.status, 404);
  assert.match((await unknown.json()).error, /Unknown job ID/);

  for (let i = 0; i < 2; i++) {
    const saved = await fetch(`${base}/api/saved`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: "j1" }),
    });
    assert.equal(saved.status, 201);
  }
  assert.deepEqual(JSON.parse(await readFile(storagePath, "utf8")), ["j1"]);
  const listed = await fetch(`${base}/api/saved`);
  assert.deepEqual((await listed.json()).map((job) => job.id), ["j1"]);

  const removed = await fetch(`${base}/api/saved/j1`, { method: "DELETE" });
  assert.deepEqual(await removed.json(), { removed: true, jobId: "j1" });
  assert.deepEqual(await (await fetch(`${base}/api/saved`)).json(), []);
});
