function openModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("femail").value = "";
}

// Close modal when clicking outside of it
window.onclick = function (event) {
  var modal = document.getElementById("modal");
  if (event.target == modal) {
    modal.style.display = "none";
    document.getElementById("femail").value = "";
  }
};

// ---------------------- POST LOGIN -------------------------
const form = document.getElementById("loginForm");
const res = document.getElementById("res");
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const formData = new FormData(form);

  const jsonData = {};
  formData.forEach((value, key) => {
    jsonData[key] = value;
  });

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    if (data.success) {
      window.location.href = data.redirect;
    }

    res.textContent = data.message;
  } catch (error) {
    console.error("Error:", error);
  }
});

// ----------- POST FORGOT PASSWORD
document
  .getElementById("forgotPassword")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get the email input value
    var email = document.getElementById("femail").value;

    // Create a data object with the email
    var data = { email: email };

    // Make a fetch request
    fetch("/forgot-password", {
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
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        document.querySelector(".res2").textContent = "An error occurred.";
      });
  });
