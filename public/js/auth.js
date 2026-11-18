// This file submits account forms and handles dashboard login details.
const accountForm = document.querySelector("#register-form, #login-form");
const formMessage = document.querySelector("#form-message");

function showMessage(message) {
  if (formMessage) {
    formMessage.textContent = message;
  }
}

function submitAccountForm(event) {
  event.preventDefault();
  showMessage("");

  const username = accountForm.elements.username.value;
  const password = accountForm.elements.password.value;
  const confirmation = accountForm.elements.confirmPassword;

  if (confirmation && password !== confirmation.value) {
    showMessage("Those passwords do not match.");
    confirmation.focus();
    return;
  }

  const submitButton = accountForm.querySelector('button[type="submit"]');
  const formDetails = {
    username: username,
    password: password
  };

  if (accountForm.id === "register-form") {
    formDetails.confirmPassword = confirmation.value;
  }

  submitButton.disabled = true;

  fetch(accountForm.dataset.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formDetails)
  })
    .then(function(response) {
      return response.json().then(function(result) {
        if (!response.ok) {
          showMessage(result.message || "Please check your details and try again.");
          return;
        }

        if (accountForm.id === "login-form") {
          window.location.assign("/dashboard");
          return;
        }

        showMessage(result.message + " Go to the login page to sign in.");
        accountForm.reset();
      });
    })
    .catch(function(error) {
      showMessage("We could not reach the server. Please try again.");
      console.error(error);
    })
    .finally(function() {
      submitButton.disabled = false;
    });
}

if (accountForm) {
  accountForm.addEventListener("submit", submitAccountForm);
}

const welcomeUsername = document.querySelector("#welcome-username");

function loadDashboardUsername() {
  fetch("/api/auth/me")
    .then(function(response) {
      if (!response.ok) {
        window.location.assign("/login");
        return null;
      }

      return response.json();
    })
    .then(function(user) {
      if (user) {
        welcomeUsername.textContent = user.username;
      }
    })
    .catch(function(error) {
      showMessage("We could not load your account details. Please refresh the page.");
      console.error(error);
    });
}

if (welcomeUsername) {
  loadDashboardUsername();
}

const logoutButton = document.querySelector("#logout-button");

function logOut() {
  logoutButton.disabled = true;

  fetch("/api/auth/logout", { method: "POST" })
    .then(function(response) {
      if (!response.ok) {
        showMessage("We could not log you out. Please try again.");
        logoutButton.disabled = false;
        return;
      }

      window.location.assign("/");
    })
    .catch(function(error) {
      showMessage("We could not log you out. Please try again.");
      logoutButton.disabled = false;
      console.error(error);
    });
}

if (logoutButton) {
  logoutButton.addEventListener("click", logOut);
}
