document
  .getElementById("registerForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get form input values
    var firstName = document.getElementById("firstName").value;
    var lastName = document.getElementById("lastName").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    // Check if passwords match
    if (password !== confirmPassword) {
      document.querySelector(".res2").textContent = "Passwords do not match.";
      return;
    }

    // Create data object with form values
    var data = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
    };

    // Make a fetch request
    fetch("/register", {
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
        document.querySelector(".res2").textContent = data.message;

        if (data.success) {
          // Clear the form inputs
          document.getElementById("firstName").value = "";
          document.getElementById("lastName").value = "";
          document.getElementById("email").value = "";
          document.getElementById("password").value = "";
          document.getElementById("confirmPassword").value = "";
        }
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        document.querySelector(".res2").textContent = "An error occurred.";
      });
  });
