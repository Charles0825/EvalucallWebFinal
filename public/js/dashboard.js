let sidebar = document.querySelector(".body");
let sidebarBtn = document.querySelector(".sideicon");
let logoName = document.querySelector(".logoname");
let linksName = document.querySelectorAll(".nav-links");

// Function to toggle sidebar and menu icon
function toggleSidebar() {
  sidebar.classList.toggle("active");
  logoName.classList.toggle("active");

  linksName.forEach((link) => {
    link.classList.toggle("active");
  });

  if (sidebar.classList.contains("active")) {
    sidebarBtn.innerHTML = "menu";
  } else {
    sidebarBtn.innerHTML = "menu_open";
  }
}

// Initial check on page load
// if (window.innerWidth <= 768) {
//   toggleSidebar();
// }

// Click event listener for sidebar button
sidebarBtn.onclick = function () {
  toggleSidebar();
};

function showSection() {
  const sections = ["dashboard", "agents", "history", "settings"];
  let title = document.querySelector(".section-title");
  sections.forEach((section) => {
    const button = document.querySelector(`.${section}Link`);
    const content = document.querySelector(`.main.${section}`);

    button.addEventListener("click", function () {
      sections.forEach((s) => {
        const sButton = document.querySelector(`.${s}Link`);
        const sContent = document.querySelector(`.main.${s}`);
        sButton.classList.remove("active");
        sContent.classList.remove("active");
      });

      button.classList.add("active");
      content.classList.add("active");
      title.innerHTML = section.charAt(0).toUpperCase() + section.slice(1);
    });
  });
}

showSection();

function populateAgentsTable(agentData) {
  const agentsTable = document.getElementById("agents-table");
  const agentSearchInput = document.getElementById("agent-search-input");

  // Clear agents table
  while (agentsTable.rows.length > 1) {
    agentsTable.deleteRow(1);
  }

  agentData = agentData.map(
    ({ password, resetPasswordToken, resetPasswordExpires, ...rest }) => rest
  );

  // Populate agents table
  agentData.forEach((agent) => {
    const row = agentsTable.insertRow();
    Object.values(agent).forEach((value) => {
      const cell = row.insertCell();
      cell.textContent = value;
    });

    // Add a <span> element for actions with data-agent-id attribute
    const actionCell = row.insertCell();
    const editButton = document.createElement("span");
    editButton.classList.add("material-icons-sharp", "showSum");
    editButton.setAttribute("data-agent-id", agent.id); // Assuming agent_id exists
    editButton.textContent = "edit";
    editButton.onclick = function () {
      getAgentData(this);
    };
    actionCell.appendChild(editButton);

    const deleteButton = document.createElement("span");
    deleteButton.classList.add("material-icons-sharp", "showSum");
    deleteButton.setAttribute("data-agent-id", agent.id); // Assuming agent_id exists
    deleteButton.textContent = "person_remove_alt_1";
    deleteButton.onclick = function () {
      removeAgent(agent.id);
    };
    actionCell.appendChild(deleteButton);

    // Add summary button
    const summaryButton = document.createElement("span");
    summaryButton.classList.add("material-icons-sharp", "showSum");
    summaryButton.setAttribute("data-agent-id", agent.id);
    summaryButton.textContent = "summarize"; // Change this to the desired text
    summaryButton.onclick = function () {
      showSummary(agent.id); // Assuming you have a function to handle showing summary
    };
    actionCell.appendChild(summaryButton);
  });

  agentSearchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const filteredAgents = agentData.filter((agent) => {
      return Object.values(agent).some((value) => {
        // Check if value is not null before calling toString()
        if (value !== null && value !== undefined) {
          return value.toString().toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });
    renderTable(
      filteredAgents,
      agentsTable,
      `<span class="material-icons-sharp showSum" data-agent-id="{{agent_id}}" onclick="getAgentData(this)">edit</span>
      <span class="material-icons-sharp showSum" data-agent-id="{{agent_id}}" onclick="removeAgent({{agent_id}})">person_remove_alt_1</span>
      <span class="material-icons-sharp showSum" data-agent-id="{{agent_id}}" onclick="showSummary({{agent_id}})">summarize</span>`
    );
  });
}

function populateHistoryTable(historyData) {
  const historyTable = document.getElementById("history-table");
  const historySearchInput = document.getElementById("history-search-input");

  // Clear history table
  while (historyTable.rows.length > 1) {
    historyTable.deleteRow(1);
  }

  historyData = historyData.map(({ message, ...rest }) => rest);

  // Populate history table
  historyData.forEach((entry) => {
    const row = historyTable.insertRow();
    Object.values(entry).forEach((value) => {
      const cell = row.insertCell();
      cell.textContent = value;
    });

    // Add a <span> element for the 'summarize' button with data-entry-id attribute
    const buttonCell = row.insertCell();
    const summarizeButton = document.createElement("span");
    summarizeButton.classList.add("material-icons-sharp", "showSum");
    summarizeButton.setAttribute("data-entry-id", entry.entry_id);
    summarizeButton.textContent = "summarize";
    summarizeButton.onclick = function () {
      getHistoryData(this);
    };
    buttonCell.appendChild(summarizeButton);
  });

  historySearchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const filteredHistory = historyData.filter((entry) => {
      return Object.values(entry).some((value) => {
        // Check if value is not null or undefined before calling toString()
        if (value !== null && value !== undefined) {
          return value.toString().toLowerCase().includes(searchTerm);
        }
        return false;
      });
    });

    renderTable(
      filteredHistory,
      historyTable,
      `<span class="material-icons-sharp showSum" data-entry-id="{{entry_id}}" onclick="getHistoryData(this)">summarize</span>`
    );
  });
}

function showSummary(agentId) {
  const idtag = document.getElementById("mva-id");
  const passedtag = document.getElementById("mva-passed");
  const failedtag = document.getElementById("mva-failed");
  const durationtag = document.getElementById("mva-duration");
  const tcallstag = document.getElementById("mva-tcalls");
  fetch(`/user-stats/${agentId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((summaryData) => {
      modal3.style.display = "block";
      if (!summaryData || Object.keys(summaryData).length === 0) {
        // If summaryData is empty or null, display a message indicating no data
        idtag.textContent = "No data available";
        passedtag.textContent = "No data available";
        failedtag.textContent = "No data available";
        durationtag.textContent = "No data available";
        tcallstag.textContent = "No data available";
      } else {
        idtag.textContent = agentId;
        passedtag.textContent = summaryData.passedCalls;
        failedtag.textContent = summaryData.failedCalls;
        durationtag.textContent = summaryData.averageDuration;
        tcallstag.textContent = summaryData.totalCalls;
      }
      console.log(summaryData);
    })
    .catch((error) => {
      console.error("Error fetching summary data:", error);
      // Handle errors, such as displaying an error message to the user
    });
}

function refreshData() {
  fetchData("/agentsdata", populateAgentsTable);
  fetchData("/historydata", populateHistoryTable);
}

function refreshAgentData() {
  fetchData("/agentsdata", populateAgentsTable);
}

function refreshHistoryData() {
  fetchData("/historydata", populateHistoryTable);
}

document.addEventListener("DOMContentLoaded", refreshData);

function fetchData(file, callback) {
  fetch(file)
    .then((response) => response.json())
    .then((data) => callback(data));
}

// Function to populate the history table
function populateTable(data, table, nameValue) {
  data.forEach((item) => {
    const row = table.insertRow();
    Object.values(item).forEach((value) => {
      const cell = row.insertCell();
      cell.innerHTML = value;
    });
    // Add 'name' property as inner HTML for the last cell
    const nameCell = row.insertCell();
    nameCell.innerHTML = nameValue;
  });
}

// Function to render the table with filtered data
function renderTable(data, table, nameValue) {
  // Clear table except for the header row
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  data.forEach((item) => {
    let row = table.insertRow();
    Object.values(item).forEach((text) => {
      let cell = row.insertCell();
      cell.textContent = text;
    });
    // Add 'name' property as inner HTML for the last cell
    let nameCell = row.insertCell();
    nameCell.innerHTML = nameValue;
  });
}

// Get the modal
var modal = document.getElementById("myModal-history");
var modal2 = document.getElementById("myModal-agents");
var modal3 = document.getElementById("myModal-view-agents");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close-history")[0];
var span2 = document.getElementsByClassName("close-agents")[0];
var span3 = document.getElementsByClassName("close-view-agents")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = "none";
};
span2.onclick = function () {
  modal2.style.display = "none";
};
span3.onclick = function () {
  modal3.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
window.onclick = function (event) {
  if (event.target == modal2) {
    modal2.style.display = "none";
  }
};
window.onclick = function (event) {
  if (event.target == modal3) {
    modal3.style.display = "none";
  }
};

function getAgentData(span) {
  // Traverse up the DOM to find the closest table row (tr)
  var row = span.closest("tr");

  if (row) {
    // Retrieve data from the row
    var id = row.cells[0].textContent;
    var fname = row.cells[1].textContent;
    var lname = row.cells[2].textContent;
    var email = row.cells[3].textContent;
    var dateCreated = row.cells[4].textContent;

    // Construct the data string
    var dataString = "ID: " + id;

    // Display data in the modal
    document.getElementById("modal-data-agents").innerHTML = dataString;
    document.getElementById("agentId").value = id;
    modal2.style.display = "block";
  } else {
    console.error("Row not found.");
  }
}

function removeAgent(agentId) {
  // Send a DELETE request to the server
  fetch(`/agentsdata/${agentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to remove agent");
      }
      // Agent removed successfully
      console.log("Agent removed successfully");
      refreshAgentData();
      // Optionally, you can reload the page or update the UI after removing the agent
    })
    .catch((error) => {
      console.error("Error removing agent:", error.message);
      // Handle error, display an error message, or perform fallback actions
    });
}

document
  .getElementById("editAgentForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the form data
    const formData = new FormData(this);
    const agentId = formData.get("agentId");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");

    // Make a fetch request to edit the agent's information
    fetch(`/agentsdata/${agentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, lastName, email }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to edit agent");
        }
        return response.json();
      })
      .then((data) => {
        // Handle the response
        document.querySelector("#ares").textContent = data.message;
        refreshAgentData();
      })
      .catch((error) => {
        console.error("Error editing agent:", error.message);
        // Handle error, display an error message, or perform fallback actions
      });
  });

// function getHistoryData(span) {
//   // Traverse up the DOM to find the closest table row (tr)
//   var row = span.closest("tr");
//   var entryId = span.getAttribute("data-entry-id");
//   if (row) {
//     // Retrieve data from the row
//     var id = row.cells[1].textContent;
//     var name = row.cells[2].textContent;
//     var email = row.cells[3].textContent;
//     var duration = row.cells[4].textContent;
//     var datetime = row.cells[5].textContent;
//     var message = row.cells[6].textContent;
//     // Construct the data string
//     var dataString =
//       "ID: " +
//       id +
//       "<br>Name: " +
//       name +
//       "<br>Email: " +
//       email +
//       "<br>Duration: " +
//       duration +
//       "<br>Datetime: " +
//       datetime +
//       "<br>Message" +
//       message;

//     // Display data in the modal
//     document.getElementById("modal-data-history").innerHTML = dataString;
//     modal.style.display = "block";
//   } else {
//     console.error("Row not found.");
//   }
// }

function getHistoryData(span) {
  var entryId = span.getAttribute("data-entry-id");

  fetch(`/historydetail?entry_id=${entryId}`)
    .then((response) => response.json())
    .then((data) => {
      showModalWithData(data);
    })
    .catch((error) => {
      console.error("Error fetching history details:", error);
    });
}

// function showModalWithData(data) {
//   // Select the elements by their IDs
//   var yesOrNAElements = document.querySelectorAll(
//     ".modal-content-history tbody td:nth-child(2)"
//   );
//   var percentageElements = document.querySelectorAll(
//     ".modal-content-history tbody td:nth-child(3)"
//   );
//   var idh = document.querySelector("#id-h");
//   var nameh = document.querySelector("#name-h");

//   idh.textContent = data.id;
//   nameh.textContent = data.name;
//   const jsonData = JSON.parse(data.message);
//   const values = Object.values(jsonData);
//   const roundedValues = values.map((value) => Math.round(value));
//   const yesOrNA = roundedValues.map((value) => {
//     return value >= 5 ? "Yes" : "N/A";
//   });

//   yesOrNAElements.forEach(function (element, index) {
//     element.textContent = yesOrNA[index];
//   });

//   percentageElements.forEach(function (element, index) {
//     element.textContent = roundedValues[index] + "%";
//   });

//   modal.style.display = "block";
// }

function showModalWithData(data) {
  // Select the elements by their IDs
  var yesOrNAElements = document.querySelectorAll(
    ".modal-content-history tbody td:nth-child(2)"
  );
  var percentageElements = document.querySelectorAll(
    ".modal-content-history tbody td:nth-child(3)"
  );
  var idh = document.querySelector("#id-h");
  var nameh = document.querySelector("#name-h");

  idh.textContent = data.id;
  nameh.textContent = data.name;
  const jsonData = JSON.parse(data.message);
  const values = Object.values(jsonData);
  const roundedValues = values.map((value) => Math.round(value));
  const yesOrNA = roundedValues.map((value) => {
    return value >= 5 ? "Yes" : "N/A";
  });

  yesOrNAElements.forEach(function (element, index) {
    element.textContent = yesOrNA[index];
  });

  percentageElements.forEach(function (element, index) {
    element.textContent = roundedValues[index] + "%";
  });

  // Destroy existing chart if it exists
  if (window.myChart) {
    window.myChart.destroy();
  }

  // Create a bar chart
  var ctx = document.getElementById("barchart-h").getContext("2d");
  window.myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(jsonData),
      datasets: [
        {
          label: "Values",
          data: roundedValues,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  modal.style.display = "block";
}

// --------------- Download as Excel
document
  .getElementById("download-agents")
  .addEventListener("click", function () {
    // Get table data
    var table = document.getElementById("agents-table");
    var rows = Array.from(table.querySelectorAll("tr"));

    // Prepare data array
    var data = [];

    // Add header row, excluding the last column header
    var headerRow = [];
    var headers = table.querySelectorAll("th");
    for (var i = 0; i < headers.length - 1; i++) {
      headerRow.push(headers[i].innerText);
    }
    data.push(headerRow);

    // Add rows data, removing the last column
    rows.forEach(function (row) {
      var rowData = [];
      var cells = row.querySelectorAll("td");
      for (var i = 0; i < cells.length - 1; i++) {
        rowData.push(cells[i].innerText);
      }
      data.push(rowData);
    });

    // Create worksheet
    var ws = XLSX.utils.aoa_to_sheet(data);

    // Create workbook
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Save workbook
    var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "agents_data.xlsx"
    );
  });

document
  .getElementById("download-history")
  .addEventListener("click", function () {
    // Get table data
    var table = document.getElementById("history-table");
    var rows = Array.from(table.querySelectorAll("tr"));

    // Prepare data array
    var data = [];

    // Add header row, excluding the last column header
    var headerRow = [];
    var headers = table.querySelectorAll("th");
    for (var i = 0; i < headers.length - 1; i++) {
      headerRow.push(headers[i].innerText);
    }
    data.push(headerRow);

    // Add rows data, removing the last column
    rows.forEach(function (row) {
      var rowData = [];
      var cells = row.querySelectorAll("td");
      for (var i = 0; i < cells.length - 1; i++) {
        rowData.push(cells[i].innerText);
      }
      data.push(rowData);
    });

    // Create worksheet
    var ws = XLSX.utils.aoa_to_sheet(data);

    // Create workbook
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    // Save workbook
    var wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "history_data.xlsx"
    );
  });

// ------------- Change Profile

document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("image-input");
  const imagePreview = document.getElementById("settings-profile-pic");

  fileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        imagePreview.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});

// Get the modal
var amodal = document.getElementById("myModal-add-agent");

// Get the button that opens the modal
var abtn = document.getElementById("addAgentButton");

// Get the <span> element that closes the modal
var aspan = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
abtn.onclick = function () {
  amodal.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
aspan.onclick = function () {
  amodal.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == amodal) {
    amodal.style.display = "none";
  }
};

// Function to fetch account settings
function fetchAccountSettings() {
  fetch("/get-account-settings")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.profilePicturePath) {
        document.getElementById("settings-profile-pic").src =
          data.profilePicturePath;
        document.getElementById("profile-pic").src = data.profilePicturePath;
      } else {
        console.log("Profile picture path is missing");
      }
      document.getElementById("userName").textContent =
        data.firstName + " " + data.lastName;
      document
        .getElementById("firstNamee")
        .setAttribute("placeholder", data.firstName);
      document
        .getElementById("lastNamee")
        .setAttribute("placeholder", data.lastName);
      document.getElementById("emaill").setAttribute("placeholder", data.email);
    })
    .catch((error) => {
      console.log("There was a problem with the fetch operation:", error);
    });
}

fetchAccountSettings();

fetch("/call-stats")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    // Update UI with call statistics
    document.getElementById("passedCount").innerText = data.passedCalls;
    document.getElementById("failedCount").innerText = data.failedCalls;
    document.getElementById("totalCalls").innerText = data.totalCalls;

    // Display average duration
    const averageDuration = data.averageDuration;
    const averageHandleElement = document.getElementById("averageHandle");

    if (averageDuration === "00:00:00") {
      // Display custom message if duration is zero
      averageHandleElement.innerText = "No calls made";
    } else {
      // Remove leading zeros for seconds, minutes, or hours
      let trimmedDuration = averageDuration.replace(/^00:/, ""); // Remove leading zeros for seconds

      // Check if there are only seconds remaining
      if (trimmedDuration.startsWith("0")) {
        // Remove leading zero for seconds
        trimmedDuration = trimmedDuration.slice(3);
        // Display seconds
        averageHandleElement.innerText = trimmedDuration + " secs";
      } else {
        // Check if there are only minutes remaining
        if (trimmedDuration.startsWith("00:")) {
          // Remove leading zeros for minutes and hours
          trimmedDuration = trimmedDuration.slice(3);
          if (trimmedDuration.startsWith("0")) {
            // Remove leading zero for minutes
            trimmedDuration = trimmedDuration.slice(3);
          }
          // Display minutes
          averageHandleElement.innerText = trimmedDuration + " mins";
        } else {
          // Check if there are only hours remaining
          if (trimmedDuration.startsWith("00:00:")) {
            // Remove leading zeros for hours
            trimmedDuration = trimmedDuration.slice(6);
            if (trimmedDuration.startsWith("0")) {
              // Remove leading zero for hours
              trimmedDuration = trimmedDuration.slice(3);
            }
            // Display hours
            averageHandleElement.innerText = trimmedDuration + " hrs";
          }
        }
      }
    }
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
    // Handle error, show error message in UI, etc.
  });

// Fetch call statistics from the server

document
  .getElementById("accountSettingsForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    try {
      // Get form input values
      var formData = new FormData(this);

      // Make a fetch request
      const response = await fetch("/update-account-settings", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      document.getElementById("res").textContent = data.message;
    } catch (error) {
      // Handle errors
      console.error("Error:", error);
    }
  });

document
  .getElementById("addAgentForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    // Get form input values
    var firstName = document.getElementById("firstName").value;
    var lastName = document.getElementById("lastName").value;
    var email = document.getElementById("email").value;

    // Create data object with form values
    var data = {
      firstName: firstName,
      lastName: lastName,
      email: email,
    };

    // Make a fetch request
    fetch("/register-agent", {
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
        refreshAgentData();
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        document.querySelector(".res").textContent = "An error occurred.";
      });
  });

document.addEventListener("DOMContentLoaded", function () {
  function fetchAndRenderChart() {
    fetch("/call-stats-linechart")
      .then((response) => response.json())
      .then((data) => {
        const labels = data.labels.map((label) => label.substring(0, 10));
        console.log(data.labels);
        const passedCallsData = data.passedCallsData;
        const failedCallsData = data.failedCallsData;
        console.log(labels);
        // Create the line chart
        const ctx = document.getElementById("callStatsChart").getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Passed Calls",
                data: passedCallsData,
                borderColor: "green",
                backgroundColor: "rgba(0, 255, 0, 0.2)",
              },
              {
                label: "Failed Calls",
                data: failedCallsData,
                borderColor: "red",
                backgroundColor: "rgba(255, 0, 0, 0.2)",
              },
            ],
          },
          options: {
            scales: {
              xAxes: [
                {
                  type: "time",
                  time: {
                    unit: "day",
                  },
                },
              ],
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
      })
      .catch((error) => console.error("Error fetching data:", error));
  }

  fetchAndRenderChart();
});

document.addEventListener("DOMContentLoaded", function () {
  function fetchAndRenderBarChart() {
    fetch("/agent-calls-barchart")
      .then((response) => response.json())
      .then((data) => {
        const agents = data.map((entry) => entry.agent);
        const totalCalls = data.map((entry) => entry.totalCalls);

        // Create the bar chart
        const ctx = document.getElementById("agentCallsChart").getContext("2d");
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: agents,
            datasets: [
              {
                label: "Total Calls",
                data: totalCalls,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
      })
      .catch((error) => console.error("Error fetching data:", error));
  }

  fetchAndRenderBarChart();
});
