let debounceTimeout;
let selectedWork = null;
let selectedEdition = null;
let editionData = [];

document.getElementById("book-search-bar").addEventListener("input", function () {
  clearTimeout(debounceTimeout);
  const query = this.value;
  if (query.length < 2) return;
  debounceTimeout = setTimeout(async () => {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    const list = document.getElementById("autocomplete-list");
    list.innerHTML = "";
    data.docs.slice(0, 5).forEach((book) => {
      const li = document.createElement("li");
      li.textContent =
        book.title +
        (book.author_name ? " by " + book.author_name.join(", ") : "");
      li.addEventListener("click", () => selectBook(book));
      list.appendChild(li);
    });
  }, 400);
});

async function selectBook(book) {
  selectedWork = book;
  document.getElementById("autocomplete-list").innerHTML = "";
  document.getElementById("edition-section").style.display = "block";
  const res = await fetch(`https://openlibrary.org/works/${book.key.split('/').pop()}/editions.json?limit=50`);
  const data = await res.json();
  editionData = data.entries.filter(ed =>
    ed.languages && ed.languages.some(lang => lang.key === "/languages/eng")
  );
  editionData.sort((a, b) => {
    if ((b.covers ? 1 : 0) !== (a.covers ? 1 : 0)) {
      return (b.covers ? 1 : 0) - (a.covers ? 1 : 0);
    }
    const dateA = new Date(a.publish_date || "1900");
    const dateB = new Date(b.publish_date || "1900");
    return dateB - dateA;
  });
  const dropdown = document.getElementById("edition-dropdown");
  dropdown.innerHTML = "";
  editionData.forEach((ed, idx) => {
    const option = document.createElement("option");
    option.value = idx;
    option.textContent = `${ed.title || book.title} (${ed.publish_date || "Unknown"})${ed.publishers ? " - " + ed.publishers.join(", ") : ""}`;
    dropdown.appendChild(option);
  });
  dropdown.onchange = () => showPreview(editionData[dropdown.value]);
  if (editionData.length > 0) showPreview(editionData[0]);
}

document.getElementById("isbn-search-btn").addEventListener("click", async () => {
  const isbn = document.getElementById("manual-isbn").value.trim();
  if (!isbn) return;
  const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
  if (res.ok) {
    const ed = await res.json();
    showPreview(ed);
  } else {
    alert("Edition not found for that ISBN.");
  }
});

function showPreview(edition) {
  selectedEdition = edition;
  document.getElementById("preview-section").style.display = "block";
  const coverImg = document.getElementById("preview-cover");
  const noCoverPath = "/no-cover.svg";
  if (edition.covers && edition.covers[0]) {
    coverImg.src = `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`;
    coverImg.alt = `Book cover for ${edition.title || selectedWork.title}`;
    coverImg.style.display = "inline";
    if (coverImg.nextElementSibling && coverImg.nextElementSibling.className === "no-cover") {
      coverImg.nextElementSibling.remove();
    }
  } else {
    coverImg.src = noCoverPath;
    coverImg.alt = "No cover available";
    coverImg.style.display = "inline";
    if (coverImg.nextElementSibling && coverImg.nextElementSibling.className === "no-cover") {
      coverImg.nextElementSibling.remove();
    }
  }
  let pagesValue = edition.number_of_pages || "";
  let pagesInputHtml = pagesValue
    ? `<span id=\"pages-span\">${pagesValue}</span>`
    : `<input type=\"number\" id=\"pages-input\" min=\"1\" placeholder=\"Enter pages\">`;
  document.getElementById("preview-info").innerHTML = `
    <strong>${edition.title || selectedWork.title}</strong><br>
    Author: ${(edition.authors && edition.authors[0]?.name) || (selectedWork.author_name ? selectedWork.author_name.join(", ") : "Unknown")}<br>
    Pages: ${pagesInputHtml}<br>
    Publisher: ${edition.publishers ? edition.publishers.join(", ") : "Unknown"}<br>
    Year: ${edition.publish_date || "Unknown"}<br>
    ISBN: ${(edition.isbn_13 && edition.isbn_13[0]) || (edition.isbn_10 && edition.isbn_10[0]) || "Unknown"}
  `;
  let autofillSkill = "";
  if (edition.key) {
    fetch(`https://openlibrary.org${edition.key}/subjects.json`).then(async (res) => {
      if (res.ok) {
        const subjData = await res.json();
        if (subjData.subjects && subjData.subjects.length > 0) {
          autofillSkill = subjData.subjects[0].name;
        } else {
          autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
        }
      } else {
        autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
      }
      document.getElementById("skill-input").value = autofillSkill;
    });
  } else {
    autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
    document.getElementById("skill-input").value = autofillSkill;
  }
}

let skillList = [];

async function fetchSkills() {
  try {
    const res = await fetch('/skills');
    if (res.ok) {
      skillList = await res.json();
    } else {
      skillList = [];
    }
  } catch {
    skillList = [];
  }
}

function renderSkillInput(autofillSkill = "") {
  const skillInputDiv = document.getElementById("skill-input-div");
  if (!skillInputDiv) return;
  let optionsHtml = skillList.map(skill => `<option value="${skill}">${skill}</option>`).join("");
  skillInputDiv.innerHTML = `
    <select id="skill-dropdown">
      <option value="">--Select a skill--</option>
      ${optionsHtml}
      <option value="__manual__">Other (enter manually)</option>
    </select>
    <input type="text" id="skill-input" value="${autofillSkill}" style="display:none; margin-left:8px;">
  `;
  const dropdown = document.getElementById("skill-dropdown");
  const input = document.getElementById("skill-input");
  dropdown.addEventListener("change", () => {
    if (dropdown.value === "__manual__") {
      input.style.display = "inline-block";
      input.value = "";
      input.focus();
    } else if (dropdown.value) {
      input.style.display = "none";
      input.value = dropdown.value;
    } else {
      input.style.display = "none";
      input.value = "";
    }
  });
  if (autofillSkill && !skillList.includes(autofillSkill)) {
    dropdown.value = "__manual__";
    input.style.display = "inline-block";
    input.value = autofillSkill;
  }
}

const origShowPreview = showPreview;
showPreview = function(edition) {
  selectedEdition = edition;
  document.getElementById("preview-section").style.display = "block";
  const coverImg = document.getElementById("preview-cover");
  const noCoverPath = "/no-cover.svg";
  if (edition.covers && edition.covers[0]) {
    coverImg.src = `https://covers.openlibrary.org/b/id/${edition.covers[0]}-L.jpg`;
    coverImg.alt = `Book cover for ${edition.title || selectedWork.title}`;
    coverImg.style.display = "inline";
    if (coverImg.nextElementSibling && coverImg.nextElementSibling.className === "no-cover") {
      coverImg.nextElementSibling.remove();
    }
  } else {
    coverImg.src = noCoverPath;
    coverImg.alt = "No cover available";
    coverImg.style.display = "inline";
    if (coverImg.nextElementSibling && coverImg.nextElementSibling.className === "no-cover") {
      coverImg.nextElementSibling.remove();
    }
  }
  let pagesValue = edition.number_of_pages || "";
  let pagesInputHtml = pagesValue
    ? `<span id=\"pages-span\">${pagesValue}</span>`
    : `<input type=\"number\" id=\"pages-input\" min=\"1\" placeholder=\"Enter pages\">`;
  document.getElementById("preview-info").innerHTML = `
    <strong>${edition.title || selectedWork.title}</strong><br>
    Author: ${(edition.authors && edition.authors[0]?.name) || (selectedWork.author_name ? selectedWork.author_name.join(", ") : "Unknown")}<br>
    Pages: ${pagesInputHtml}<br>
    Publisher: ${edition.publishers ? edition.publishers.join(", ") : "Unknown"}<br>
    Year: ${edition.publish_date || "Unknown"}<br>
    ISBN: ${(edition.isbn_13 && edition.isbn_13[0]) || (edition.isbn_10 && edition.isbn_10[0]) || "Unknown"}
  `;
  let autofillSkill = "";
  if (edition.key) {
    fetch(`https://openlibrary.org${edition.key}/subjects.json`).then(async (res) => {
      if (res.ok) {
        const subjData = await res.json();
        if (subjData.subjects && subjData.subjects.length > 0) {
          autofillSkill = subjData.subjects[0].name;
        } else {
          autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
        }
      } else {
        autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
      }
      renderSkillInput(autofillSkill);
    });
  } else {
    autofillSkill = (edition.subjects && edition.subjects[0]) || (selectedWork.subject ? selectedWork.subject[0] : "");
    renderSkillInput(autofillSkill);
  }
}

document.getElementById("add-to-library-btn").addEventListener("click", async () => {
  let skill = "";
  const dropdown = document.getElementById("skill-dropdown");
  const input = document.getElementById("skill-input");
  if (dropdown) {
    if (dropdown.value === "__manual__") {
      skill = input.value.trim();
    } else {
      skill = dropdown.value;
    }
  } else if (input) {
    skill = input.value.trim();
  }
  let pages = selectedEdition.number_of_pages || 0;
  const pagesInput = document.getElementById("pages-input");
  if (pagesInput) {
    pages = parseInt(pagesInput.value, 10) || 0;
  }
  if (!skill) {
    alert("Please enter a skill.");
    return;
  }
  if (!pages || pages < 1) {
    alert("Please enter the number of pages.");
    return;
  }
  const payload = {
    title: selectedEdition.title || selectedWork.title,
    author: (selectedEdition.authors && selectedEdition.authors[0]?.name) || (selectedWork.author_name ? selectedWork.author_name.join(", ") : ""),
    coverurl: selectedEdition.covers ? `https://covers.openlibrary.org/b/id/${selectedEdition.covers[0]}-L.jpg` : "/no-cover.svg",
    pages: pages,
    subject: skill,
    isbn: (selectedEdition.isbn_13 && selectedEdition.isbn_13[0]) || (selectedEdition.isbn_10 && selectedEdition.isbn_10[0]) || "",
  };
  const res = await fetch("/library/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    alert("Book added to your library!");
  } else {
    alert("Failed to add book.");
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  await fetchSkills();
  const label = document.querySelector('label[for="skill-input"]') || document.querySelector('label:has(#skill-input)');
  if (label) {
    let skillInput = document.getElementById('skill-input');
    if (skillInput) {
      const div = document.createElement('div');
      div.id = 'skill-input-div';
      skillInput.parentNode.replaceChild(div, skillInput);
      renderSkillInput("");
    }
  }
});
