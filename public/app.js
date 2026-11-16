const status = document.getElementById("status");

function showMessage(message) {
  status.textContent = message;
}
const list = document.getElementById("jobs");
const search = document.getElementById("search");
const savedList = document.getElementById("saved-jobs");


async function showSaved() {
  const res = await fetch("/api/saved");
  const jobs = await res.json();

  savedList.replaceChildren();

  if (jobs.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent =
      "You haven't saved any jobs yet. Browse the jobs above and save one!";
    savedList.append(emptyMessage);
    return;
  }

  for (const job of jobs) {
    const li = document.createElement("li");
    li.textContent = `${job.title} at ${job.company}, ${job.location}`;

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", async () => {
      try {
        const response = await fetch(
          `/api/saved/${encodeURIComponent(job.id)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Unable to remove job.");
        }

        showMessage("Job removed successfully!");

        await showSaved();
        await show(search.value);
      } catch (error) {
        showMessage(error.message);
      }
    });

    li.append(" ", remove);
    savedList.append(li);
  }
}


async function show(query = "") {
  const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
  const jobs = await res.json();
  list.replaceChildren();
  for (const job of jobs) {
    const li = document.createElement("li");
    const details = document.createElement("span");
    details.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month. `;
    const save = document.createElement("button");
    save.textContent = "Save";
save.addEventListener("click", async () => {
  save.disabled = true;
  save.textContent = "Saving...";

  try {
    const response = await fetch("/api/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobId: job.id
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save job");
    }

    save.textContent = "Saved";
    showMessage("Job saved successfully!");
    await showSaved();

  } catch (error) {
    showMessage(error.message);
    save.textContent = "Save";
    save.disabled = false;
  }
});
    li.append(details, save);
    list.append(li);
  }
}

search.addEventListener("input", () => show(search.value));
show();
showSaved();
