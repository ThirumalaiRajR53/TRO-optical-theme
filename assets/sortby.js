class SortingDropdown extends HTMLElement {
  constructor() {
    super();
    const shownOption = this.querySelector(".sortby-option-value");

    if (window.location.pathname === "/search") {
      const sortbyValue = localStorage.getItem("search-sort-key");
      if (sortbyValue) {
        shownOption.textContent = sortbyValue;
      } else {
        shownOption.textContent = "Relevance";
      }
    } else {
      const sortbyValue = localStorage.getItem("collection-sort-key");
      if (sortbyValue) {
        shownOption.textContent = sortbyValue;
      } else {
        shownOption.textContent = "Alphabetically, A-Z";
      }
    }

    this.querySelector(".facet__sortby-options").addEventListener("click", (e) => {
      const sortbyData = e.target.getAttribute("data-value");
      e.target.dispatchEvent(new InputEvent("input", { bubbles: true, data: sortbyData }));

      shownOption.textContent = e.target.textContent;
      if (window.location.pathname === "/search") {
        localStorage.setItem("search-sort-key", e.target.textContent);
        localStorage.setItem("search-sort-value", sortbyData);
      } else {
        localStorage.setItem("collection-sort-key", e.target.textContent);
        localStorage.setItem("collection-sort-value", sortbyData);
      }
    });
  }
}

customElements.define("sorting-dropdown", SortingDropdown);
