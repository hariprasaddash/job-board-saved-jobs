// A small job board: a JSON API and one page. Run with `npm start`.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadJobs, searchJobs } from "./lib/jobs.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const savedJobsPath = new URL("./saved-jobs.json", import.meta.url);

async function loadSavedIds(path = savedJobsPath) {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    return Array.isArray(parsed) ? [...new Set(parsed)] : [];
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function saveIds(ids, path = savedJobsPath) {
  await writeFile(path, `${JSON.stringify(ids, null, 2)}\n`, "utf8");
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  return JSON.parse(body);
}

export function createApp({ storagePath = savedJobsPath } = {}) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        return sendJson(res, 200, searchJobs(jobs, url.searchParams.get("q")));
      }
      if (req.method === "GET" && url.pathname === "/api/saved") {
        const [jobs, ids] = await Promise.all([loadJobs(), loadSavedIds(storagePath)]);
        return sendJson(res, 200, ids.map((id) => jobs.find((job) => job.id === id)).filter(Boolean));
      }
      if (req.method === "POST" && url.pathname === "/api/saved") {
        let body;
        try { body = await readBody(req); } catch { return sendJson(res, 400, { error: "Request body must be valid JSON" }); }
        if (typeof body?.jobId !== "string" || !body.jobId.trim()) return sendJson(res, 400, { error: "jobId is required" });
        const jobs = await loadJobs();
        if (!jobs.some((job) => job.id === body.jobId)) return sendJson(res, 404, { error: `Unknown job ID: ${body.jobId}` });
        const ids = await loadSavedIds(storagePath);
        if (!ids.includes(body.jobId)) ids.push(body.jobId);
        await saveIds(ids, storagePath);
        return sendJson(res, 201, { saved: true, jobId: body.jobId });
      }
      const savedMatch = url.pathname.match(/^\/api\/saved\/([^/]+)$/);
      if (req.method === "DELETE" && savedMatch) {
        const jobId = decodeURIComponent(savedMatch[1]);
        const ids = await loadSavedIds(storagePath);
        const remaining = ids.filter((id) => id !== jobId);
        await saveIds(remaining, storagePath);
        return sendJson(res, 200, { removed: ids.length !== remaining.length, jobId });
      }
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
        const file = url.pathname === "/" ? "index.html" : "app.js";
        const type = file.endsWith(".html") ? "text/html" : "text/javascript";
        const body = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
        return res.end(body);
      }
      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      console.error(err);
      sendJson(res, 500, { error: "Something went wrong" });
    }
  });
}

// Started directly (npm start), not imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(PORT, () => console.log(`Job board on http://localhost:${PORT}`));
}
