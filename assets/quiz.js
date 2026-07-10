(function initializeFrameFinder(global) {
  const STORAGE_KEY = "frameFinderAnswers";
  const FILTER_PARAMS = {
    vendor: "filter.p.vendor",
    color: "filter.p.m.custom.color",
    shape: "filter.p.m.custom.shape",
    rim_type: "filter.p.m.custom.rim_type",
  };
  const FALLBACK_ORDER = ["vendor", "color", "rim_type", "shape", "price"];

  function splitValues(value = "") {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function expandGender(collection, gender) {
    if (!gender) return [];
    if (gender === "Men" || gender === "Women") return [gender, "Unisex"];
    if (collection === "sunglasses" && (gender === "Kids" || gender === "Teens")) {
      return [gender, "Unisex"];
    }
    return [gender];
  }

  function buildCollectionUrl(answers, excludedGroups = []) {
    const collection = answers.collection === "sunglasses" ? "sunglasses" : "eyeglasses";
    const excluded = new Set(excludedGroups);
    const params = new URLSearchParams();

    expandGender(collection, answers.gender).forEach((value) => {
      params.append("filter.p.m.custom.gender", value);
    });

    Object.entries(FILTER_PARAMS).forEach(([group, param]) => {
      if (excluded.has(group)) return;
      splitValues(answers[group]).forEach((value) => params.append(param, value));
    });

    if (!excluded.has("price")) {
      const [minimum, maximum] = splitValues(answers.price);
      if (minimum) params.set("filter.v.price.gte", minimum);
      if (maximum) params.set("filter.v.price.lte", maximum);
    }

    params.set("sort_by", "best-selling");
    return `/collections/${collection}?${params.toString()}`;
  }

  function createFallbackUrls(answers) {
    const urls = [buildCollectionUrl(answers)];
    const excluded = [];

    FALLBACK_ORDER.forEach((group) => {
      if (!answers[group]) return;
      excluded.push(group);
      urls.push(buildCollectionUrl(answers, excluded));
    });

    return [...new Set(urls)];
  }

  const api = { buildCollectionUrl, createFallbackUrls, expandGender };
  global.FrameFinder = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  function readAnswers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  }

  function groupedAnswers() {
    return Object.values(readAnswers()).reduce((answers, answer) => {
      answers[answer.group] = answer.value;
      return answers;
    }, {});
  }

  function saveAnswer(section, value) {
    const answers = readAnswers();
    answers[section.closest(".shopify-section").id] = {
      group: section.dataset.filterGroup,
      value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }

  function removeAnswer(section) {
    const answers = readAnswers();
    delete answers[section.closest(".shopify-section").id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }

  function quizSections() {
    return [...document.querySelectorAll(".quiz-slide-section")];
  }

  function updateProgress(sectionNumber) {
    const progress = document.querySelector("#progress");
    const progressSection = document.querySelector(".progress-section");
    if (!progress || !progressSection) return;

    progressSection.style.display = sectionNumber > 0 ? "block" : "none";
    const finalQuestionIndex = Math.max(quizSections().length - 1, 1);
    progress.style.width = `${(sectionNumber / finalQuestionIndex) * 100}%`;

    const backButton = progressSection.querySelector("#back-button");
    if (backButton) backButton.dataset.prevSection = Math.max(sectionNumber - 1, 0);
  }

  function highlightStoredAnswer(section) {
    const answer = readAnswers()[section.closest(".shopify-section").id];
    section.querySelectorAll(".quiz-answer-option").forEach((option) => {
      option.classList.toggle(
        "highlighted-answer",
        Boolean(answer) && option.dataset.answerValue === answer.value,
      );
    });

    const nextButton = section.querySelector(".next-button");
    if (nextButton) nextButton.disabled = !answer;
  }

  function showSection(sectionNumber) {
    const sections = quizSections();
    sections.forEach((section, index) => {
      const wrapper = section.closest(".shopify-section");
      const isActive = index === sectionNumber;
      section.classList.toggle("active-section", isActive);
      wrapper.style.display = isActive ? "flex" : "none";
      if (isActive) {
        wrapper.style.flex = "1";
        wrapper.style.flexDirection = "column";
        highlightStoredAnswer(section);
      }
    });

    localStorage.setItem("currentSection", String(sectionNumber));
    updateProgress(sectionNumber);
  }

  function nextSection(section) {
    const index = quizSections().indexOf(section);
    if (index >= 0) showSection(index + 1);
  }

  async function pageHasProducts(url) {
    const response = await fetch(url, { headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`Recommendation request failed: ${response.status}`);

    const page = new DOMParser().parseFromString(await response.text(), "text/html");
    const productGrid = page.querySelector("#product-grid");
    if (!productGrid) throw new Error("Recommendation response did not contain a product grid");
    return Boolean(productGrid.querySelector(".grid__item"));
  }

  function redirectToResults(url) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("currentSection");
    window.location.assign(url);
  }

  async function showRecommendations(section) {
    const status = section.querySelector(".quiz-status");
    const buttons = section.querySelectorAll(".next-button, .skip-button");
    buttons.forEach((button) => {
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    });
    if (status) status.textContent = "Finding the best available matches…";

    const answers = groupedAnswers();
    const fallbackUrls = createFallbackUrls(answers);

    try {
      for (const url of fallbackUrls) {
        if (await pageHasProducts(url)) {
          redirectToResults(url);
          return;
        }
      }
      redirectToResults(fallbackUrls[fallbackUrls.length - 1]);
    } catch (error) {
      const safeUrl = buildCollectionUrl({
        collection: answers.collection,
        gender: answers.gender,
      });
      redirectToResults(safeUrl);
    }
  }

  function bindQuiz() {
    quizSections().forEach((section) => {
      section.querySelectorAll(".quiz-answer-option").forEach((option) => {
        if (option.dataset.quizBound) return;
        option.dataset.quizBound = "true";
        option.addEventListener("click", () => {
          saveAnswer(section, option.dataset.answerValue || "");
          highlightStoredAnswer(section);
          if (option.dataset.autoAdvance === "true") nextSection(section);
        });
      });

      section.querySelectorAll(".next-button").forEach((button) => {
        if (button.dataset.quizBound) return;
        button.dataset.quizBound = "true";
        button.addEventListener("click", () => {
          if (button.disabled) return;
          if (button.dataset.submitQuiz === "true") {
            showRecommendations(section);
          } else {
            nextSection(section);
          }
        });
      });

      section.querySelectorAll(".skip-button").forEach((button) => {
        if (button.dataset.quizBound) return;
        button.dataset.quizBound = "true";
        button.addEventListener("click", () => {
          removeAnswer(section);
          if (button.dataset.submitQuiz === "true") {
            showRecommendations(section);
          } else {
            nextSection(section);
          }
        });
      });

      section.querySelectorAll(".next-slide:not(.next-button):not(.skip-button):not(.quiz-answer-option)").forEach(
        (button) => {
          if (button.dataset.quizBound) return;
          button.dataset.quizBound = "true";
          button.addEventListener("click", (event) => {
            event.preventDefault();
            nextSection(section);
          });
        },
      );
    });
  }

  global.showPrevSection = function showPreviousSection(button) {
    const previousSection = Number(button.dataset.prevSection || 0);
    showSection(previousSection);
    window.location.hash = `section-${previousSection}`;
  };

  function initialize() {
    bindQuiz();
    const hashSection = window.location.hash.match(/section-(\d+)/);
    const savedSection = localStorage.getItem(STORAGE_KEY)
      ? Number(localStorage.getItem("currentSection") || 0)
      : 0;
    const requestedSection = hashSection ? Number(hashSection[1]) : savedSection;
    showSection(Math.min(requestedSection, quizSections().length - 1));
  }

  document.addEventListener("DOMContentLoaded", initialize);
  document.addEventListener("shopify:section:load", initialize);
  document.addEventListener("shopify:section:reorder", initialize);
  document.addEventListener("shopify:section:select", (event) => {
    const selectedSection = event.target.querySelector(".quiz-slide-section");
    const selectedIndex = quizSections().indexOf(selectedSection);
    if (selectedIndex >= 0) showSection(selectedIndex);
  });
})(typeof window !== "undefined" ? window : globalThis);
