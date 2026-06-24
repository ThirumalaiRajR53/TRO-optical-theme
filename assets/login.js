function hideElement(element) {
  if (!element.style.display || element.style.display !== "none") {
    element.style.display = "none";
  }
}

const emailElement = document.querySelector('.login-form input[type="email"]');
const passwordElement = document.querySelector('.login-form input[type="password"]');
const errorElement = document.querySelector(".login-form #form-login-error");
const togglePasswordButton = document.querySelector(".login-form #toggle-pw-button");

emailElement.addEventListener("click", function () {
  hideElement(errorElement);
});

emailElement.addEventListener("change", function () {
  hideElement(errorElement);
});

passwordElement.addEventListener("click", function () {
  hideElement(errorElement);
});

passwordElement.addEventListener("input", (event) => {
  if (
    !togglePasswordButton.classList.contains("eye-icon-password") &&
    !togglePasswordButton.classList.contains("eye-icon-crossed-password")
  ) {
    togglePasswordButton.classList.add("eye-icon-password");
    togglePasswordButton.style.width = "1.75rem";
  }

  hideElement(errorElement);
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

const rememberMeCheckboxElement = document.getElementById("remember-me-checkbox");

if (localStorage.checkbox && localStorage.checkbox !== "") {
  rememberMeCheckboxElement.setAttribute("checked", "checked");
  emailElement.value = localStorage.username;
} else {
  rememberMeCheckboxElement.removeAttribute("checked");
  emailElement.value = "";
}

function rememberUsername() {
  if (rememberMeCheckboxElement.checked && emailElement.value !== "") {
    localStorage.username = emailElement.value;
    localStorage.checkbox = rememberMeCheckboxElement.value;
  } else {
    localStorage.username = "";
    localStorage.checkbox = "";
  }
}
