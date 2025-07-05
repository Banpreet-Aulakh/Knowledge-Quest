document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".pages-form").forEach(form => {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      const formData = new FormData(form);
      const pagesRead = formData.get("pagesRead");
      const isbn = formData.get("isbn");
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      try {
        const res = await fetch("/library/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pagesRead, isbn })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.expGained > 0) {
            showExpFloat(`+${data.expGained} ${data.skill} EXP`);
          }
          if (data.levelUp) {
            showExpFloat(`${data.skill} Level Up!`, true);
          }
          // Optionally, reload the page or update the UI
          setTimeout(() => window.location.reload(), 1200);
        } else {
          alert("Failed to update pages read.");
        }
      } catch {
        alert("Error updating progress.");
      } finally {
        button.disabled = false;
      }
    });
  });
});

function showExpFloat(text, levelUp = false) {
  const el = document.createElement("div");
  el.className = "exp-float" + (levelUp ? " levelup" : "");
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = 1;
  }, 10);
  setTimeout(() => {
    el.style.opacity = 0;
    el.remove();
  }, 1200);
}
