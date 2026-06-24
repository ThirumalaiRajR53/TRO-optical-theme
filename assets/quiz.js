const quizEmailError = document.querySelector(".quiz-email-error");

// Ensures that the submit quiz section is shown when the user submits an existing email
if (window.location.search.includes("?contact%5Btags%5D=newsletter&form_type=customer")) {
  const currentSection = localStorage.getItem("currentSection");
  showSection(currentSection);
  quizEmailError.classList.remove("twcss-hidden");
  quizEmailError.classList.add("twcss-block");
}

// section.index doesn't work in theme editor preview, so this function saves the quiz slide section's index as data-* attribute; this index helps to move to next section
function updateSectionIndex() {
  const quizSlideSections = document.querySelectorAll(".quiz-slide-section");
  quizSlideSections.forEach((section, index) => {
    section.querySelectorAll(".next-slide").forEach((nextSlide) => {
      nextSlide.dataset.sectionIndex = index;
    });
  });
}

function attachShowSection() {
  const nextSlides = document.querySelectorAll(".next-slide");
  nextSlides.forEach((nextSlide) => {
    nextSlide.addEventListener("click", () => {
      if (nextSlide.hasAttribute("disabled")) return;
      showSection(Number(nextSlide.dataset.sectionIndex) + 1);
    });
  });
}

// For section add event in theme editor
document.addEventListener("shopify:section:load", (event) => {
  updateSectionIndex();
  attachShowSection();

  // When a block is added to primary or secondary slide sections, this keeps the preview from going blank
  extractIndexAndShowSection(event);

  // Needed because when the quiz-progress section's settings are changed, the correct quiz slide and the correct progress bar can be shown in the theme editor preview
  const isQuizProgressSection = event.detail.sectionId.includes("quiz-progress");
  if (isQuizProgressSection) {
    const currentPercent = localStorage.getItem("currentPercent");
    const currentSection = localStorage.getItem("currentSection");
    showProgressSection(Number(currentSection));
    updateProgressBar(Number(currentPercent));
  }
});

// For section delete event in theme editor
document.addEventListener("shopify:section:unload", (event) => {
  extractIndexAndShowSection(event, true);

  setTimeout(() => {
    updateSectionIndex();
    attachShowSection();
  });
});

// For section reorder event in theme editor
document.addEventListener("shopify:section:reorder", () => {
  updateSectionIndex();
  attachShowSection();
});

// For section select event in theme editor
document.addEventListener("shopify:section:select", (event) => {
  extractIndexAndShowSection(event);
});

function extractIndexAndShowSection(event, isSectionDeleted = false) {
  const sectionIndex = Number(event.target.querySelector(".next-slide").dataset.sectionIndex);
  const currentSection = localStorage.getItem("currentSection");

  if (sectionIndex && isSectionDeleted) {
    if (currentSection == sectionIndex) {
      showSection(sectionIndex - 1);
    }
  } else {
    showSection(sectionIndex);
  }
}

// Needed because the above three events are for theme editor only
document.addEventListener("DOMContentLoaded", () => {
  updateSectionIndex();
  attachShowSection();
});

function updateProgressBar(percent) {
  const quizProgress = document.querySelector("#progress");
  quizProgress.style.width = `${percent}%`;
}

// Show progress bar in all slide sections except the starting one
function showProgressSection(sectionNum) {
  const progressSecton = document.querySelector(".progress-section");

  if (sectionNum > 0) {
    progressSecton.style.display = "block";

    const backButton = progressSecton.querySelector("#back-button");
    backButton.dataset.prevSection = sectionNum == 1 ? "0" : sectionNum - 1;
  } else {
    progressSecton.style.display = "none";
  }
}

function showPrevSection(element) {
  const sectionToShow = element.dataset.prevSection;
  window.location.href = `#section-${element.dataset.prevSection}`;
  showSection(Number(sectionToShow));
}

function showSection(sectionNum) {
  const quizSlideSections = document.querySelectorAll(".quiz-slide-section");

  const totalPercent = quizSlideSections.length - 1;

  // Hide all sections
  quizSlideSections.forEach((section) => {
    section.classList.remove("active-section");
    section.parentNode.style.display = "none";
  });

  // Show the targeted section
  quizSlideSections.forEach((section, index) => {
    if (sectionNum == index) {
      section.classList.add("active-section");
      section.parentNode.style.display = "flex";
      section.parentNode.style.flex = "1";
      section.parentNode.style.flexDirection = "column";

      highlightAlreadySelected(section);

      const currentPercent = (index / totalPercent) * 100;
      updateProgressBar(currentPercent);

      localStorage.setItem("currentPercent", currentPercent);
      localStorage.setItem("currentSection", sectionNum);

      if (section.classList.contains("submit-quiz-slide")) {
        addSearchUrl(section);
      }
    }
  });

  showProgressSection(sectionNum);
}

function highlightAlreadySelected(section) {
  const storageKey = section.parentNode.id.replace("shopify-section-", "");
  if (storageKey.includes("secondary-quiz-slide")) {
    const selectedTag = localStorage.getItem(storageKey);
    if (selectedTag) {
      section.querySelectorAll(".secondary-quiz-answer").forEach((block) => {
        if (block.dataset.answerTag == selectedTag) {
          block.classList.add("highlighted-answer");
        }
      });
      section.querySelector(".next-button").removeAttribute("disabled");
    }
  }
}

function saveAnswerTag(key, tag) {
  localStorage.setItem(key, tag);
  saveAnswerKeys(key);

  if (key.includes("secondary-quiz-slide")) {
    document.querySelector(`#shopify-section-${key} .next-button`).removeAttribute("disabled");
  }
}

// These keys are used to extract answers from local storage, which in turn helps to create search query parameters
function saveAnswerKeys(key) {
  const storedKeys = localStorage.getItem("quizKeys");

  if (storedKeys) {
    if (storedKeys.includes(key)) return;
    const currentKeys = storedKeys + "+" + key;
    localStorage.setItem("quizKeys", currentKeys);
  } else {
    localStorage.setItem("quizKeys", key);
  }
}

// For skip button
function removeQuizAnswer(key) {
  const section = document.querySelector(`#shopify-section-${key}`);
  section.querySelectorAll(".secondary-quiz-answer").forEach((block) => {
    block.classList.remove("highlighted-answer");
  });
  section.querySelector(".next-button").setAttribute("disabled", "disabled");

  localStorage.removeItem(key);

  const joinedKeys = localStorage.getItem("quizKeys");
  if (joinedKeys) {
    const splitKeys = joinedKeys.split("+");
    const updatedKeys = splitKeys.filter((splitKey) => splitKey !== key).join("+");
    localStorage.setItem("quizKeys", updatedKeys);
  }
}

function createSearchUrlWithQueries() {
  let selectedTags = "";
  const joinedKeys = localStorage.getItem("quizKeys");
  const splitKeys = joinedKeys.split("+");

  splitKeys.forEach((key) => {
    selectedTags += localStorage.getItem(key) + "+";
  });

  const queryString = "?q=" + selectedTags.slice(0, -1) + "&type=product";
  return routes.search_url + queryString;
}

// Run when the no thanks button is clicked
function redirectToSearchPage() {
  window.location.href = createSearchUrlWithQueries();
}

// Add search URL to the value of the input with the id of quiz-to-search, so that once the email id is submitted in the last quiz slide, the user is redirected to the search page
function addSearchUrl(section) {
  const quizToSearch = section.querySelector("#quiz-to-search");
  quizToSearch.value = createSearchUrlWithQueries();
}

// Highlight selected quiz answer in secondary-quiz-slide.liquid
function highlightSelected(element) {
  const answers = document.querySelectorAll(".secondary-quiz-answer");
  answers.forEach((answer) => {
    answer.classList.remove("highlighted-answer");
  });

  element.classList.add("highlighted-answer");
}

// Check for the id of the section the user was in before reloading and show that section instead of the first section
const initialHash = location.hash;
if (initialHash) {
  const sectionToShow = initialHash.slice(-1);
  showSection(Number(sectionToShow));
}
