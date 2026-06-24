const togglePasswordButton = document.querySelector(".register-form #toggle-pw-signup-button");
const passwordElement = document.querySelector('.register-form input[type="password"]');
const emailElement = document.querySelector('.register-form input[type="password"]');
const errorEmailElement = document.querySelector(".register-form #form-signup-email-error");
const errorPasswordElement = document.querySelector(".register-form #form-signup-password-error");

function hideElement(element) {
  if (!element.style.display || element.style.display !== "none") {
    element.style.display = "none";
  }
}

emailElement.addEventListener("click", function () {
  hideElement(errorEmailElement);
});

emailElement.addEventListener("change", function () {
  hideElement(errorEmailElement);
});

passwordElement.addEventListener("click", function () {
  hideElement(errorPasswordElement);
});

passwordElement.addEventListener("input", (event) => {
  if (
    !togglePasswordButton.classList.contains("eye-icon-password") &&
    !togglePasswordButton.classList.contains("eye-icon-crossed-password")
  ) {
    togglePasswordButton.classList.add("eye-icon-password");
    togglePasswordButton.style.width = "1.75rem";
    togglePasswordButton.style.marginTop = "3px";
  }

  hideElement(errorPasswordElement);
});

togglePasswordButton.onclick = (event) => {
  passwordElement.type = passwordElement.type == "password" ? "text" : "password";
  if (togglePasswordButton.classList.contains("eye-icon-password")) {
    togglePasswordButton.classList.remove("eye-icon-password");
    togglePasswordButton.classList.add("eye-icon-crossed-password");
  } else {
    togglePasswordButton.classList.add("eye-icon-password");
    togglePasswordButton.classList.remove("eye-icon-crossed-password");
  }
};
