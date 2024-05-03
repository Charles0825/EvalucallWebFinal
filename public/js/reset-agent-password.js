// Function to get query parameter from URL
function getQueryParam(name) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(name);
}

document
  .getElementById("registerForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get form input values
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    // Check if passwords match
    if (password !== confirmPassword) {
      document.querySelector(".res").textContent = "Passwords do not match.";
      return;
    }

    // Get the token value from the URL
    var token = getQueryParam("token");

    // Create data object with form values
    var data = {
      token: token,
      password: password,
    };

    // Make a fetch request
    fetch("/reset-agent-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((data) => {
        // Handle the response
        document.querySelector(".res").textContent = data.message;
        // Clear the form inputs
        document.getElementById("password").value = "";
        document.getElementById("confirmPassword").value = "";
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        document.querySelector(".res").textContent = "An error occurred.";
      });
  });
