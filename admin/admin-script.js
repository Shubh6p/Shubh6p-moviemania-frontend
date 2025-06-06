// admin-script.js (MovieMania_Final-main/admin)

function val(id) {
  return document.getElementById(id).value.trim();
}

function logout() {
  sessionStorage.removeItem("admin_auth");
  sessionStorage.removeItem("admin_user");
  window.location.href = "login.html";
}

function isAuthenticated() {
  if (!sessionStorage.getItem("admin_auth")) {
    window.location.href = "login.html";
  }
}

function restrictAccessByRole(role) {
  const allPanels = ["manageAdmins", "changePassword", "addMovie", "addSeries", "generateJSON", "sessionSection"];
  const editable = ["addMovie", "addSeries", "generateJSON"];

  if (role === "owner") return;

  if (role === "admin") {
    const manageEl = document.getElementById("manageAdmins");
    if (manageEl) {
      manageEl.innerHTML = "<p style='color: red; padding: 1em;'>âŒ You donâ€™t have access to manage admins.</p>";
    }
    editable.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.querySelectorAll("input, textarea, button").forEach(e => e.disabled = false);
    });
  }

  if (role === "viewer") {
  const panelsToLock = [
    "manageAdmins", "addMovie", "addSeries", "generateJSON",
    "backupExport", "analyticsDashboard", "notifications", "changePassword"
  ];

  panelsToLock.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = "<p style='color: red; padding: 1em;'>âŒ You donâ€™t have access to this panel.</p>";
      }
    });
  }
}

function loadMyProfile() {
  const username = sessionStorage.getItem("admin_user");
  if (!username) return;

  fetch(`https://moviemania-backend-k8ot.onrender.com/api/profile?username=${username}`)
    .then(res => res.json())
    .then(profile => {
      document.getElementById("myProfileUsername").textContent = profile.username;
      document.getElementById("myProfileRole").textContent = profile.role;
      document.getElementById("myProfileCreated").textContent = profile.createdAt;
      document.getElementById("myProfileLastLogin").textContent =
        profile.lastLogin?.timestamp || "N/A";

      restrictAccessByRole(profile.role);
    });
}

function previewImage(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => preview.src = e.target.result;
    reader.readAsDataURL(file);
  }
}

function loadSessions() {
  const currentUser = sessionStorage.getItem("admin_user");
  const currentRole = document.getElementById("myProfileRole")?.textContent;

  fetch("https://moviemania-backend-k8ot.onrender.com/api/sessions")
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById("sessionLogs");
      tbody.innerHTML = "";
      const filtered = currentRole === "owner" ? data : data.filter(s => s.username === currentUser);

      filtered.reverse().forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${entry.username}</td>
          <td>${entry.ip}</td>
          <td>${new Date(entry.timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
      });
    });
}

function loadAdmins() {
  fetch("https://moviemania-backend-k8ot.onrender.com/api/admins")
    .then(res => res.json())
    .then(admins => {
      const tbody = document.getElementById("adminList");
      tbody.innerHTML = "";
      admins.forEach(admin => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input value="${admin.username}" onchange="updateAdminField('${admin.username}', 'username', this.value)" /></td>
          <td><input value="${admin.role}" onchange="updateAdminField('${admin.username}', 'role', this.value)" /></td>
          <td>${admin.createdAt}</td>
          <td><button onclick="deleteAdmin('${admin.username}')">Delete</button></td>
        `;
        tbody.appendChild(row);
      });
    });
}

function addAdmin() {
  const username = val("newAdminUsername");
  const password = val("newAdminPassword");
  const role = val("newAdminRole") || "admin";
  if (!username || !password) return alert("Username and password required");

  fetch("https://moviemania-backend-k8ot.onrender.com/api/admins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Admin added successfully");
        document.getElementById("newAdminUsername").value = "";
        document.getElementById("newAdminPassword").value = "";
        document.getElementById("newAdminRole").value = "";
        loadAdmins();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    });
}

function deleteAdmin(username) {
  const currentUser = sessionStorage.getItem("admin_user");
  if (username === currentUser) return alert("You cannot delete yourself.");
  if (!confirm(`Delete admin '${username}'?`)) return;

  fetch(`https://moviemania-backend-k8ot.onrender.com/api/admins/${username}`, { method: "DELETE" })
    .then(res => res.json())
    .then(data => {
      if (data.success) loadAdmins();
      else alert("Error: " + (data.error || "Unknown"));
    });
}

function updateAdminField(originalUsername, field, value) {
  const body = {};
  if (field === "username") body.newUsername = value;
  else body[field] = value;

  fetch(`https://moviemania-backend-k8ot.onrender.com/api/admins/${originalUsername}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) loadAdmins();
      else alert("Error: " + (data.error || "Unknown"));
    });
}

function changeAdminPassword() {
  const username = val("targetUsername");
  const password = val("newPassword");
  if (!username || !password) return alert("Both fields required");

  fetch(`https://moviemania-backend-k8ot.onrender.com/api/admins/${username}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) alert("Password updated");
      else alert("Error: " + (data.error || "Unknown"));
    });
}

function loadAnalytics() {
  fetch("https://moviemania-backend-k8ot.onrender.com/api/stats")
    .then(res => res.json())
    .then(data => {
      document.getElementById("totalMovies").textContent = data.totalMovies;
      document.getElementById("totalSeries").textContent = data.totalSeries;
      document.getElementById("totalAdmins").textContent = data.totalAdmins;
      document.getElementById("recentLogins").textContent = data.recentLogins;
    });
}

function downloadBackupZip() {
  window.open("https://moviemania-backend-k8ot.onrender.com/api/backup/zip", "_blank");
}

function loadNotifications() {
  fetch("https://moviemania-backend-k8ot.onrender.com/api/notifications")
    .then(res => res.json())
    .then((logs) => {
      const box = document.getElementById("notif_list");
      box.innerHTML = "";

      logs.reverse().forEach((n) => {
        const time = new Date(n.timestamp).toLocaleString();
        box.innerHTML += `<p>[${time}] ${n.message}</p>`;
      });

      // ðŸ”´ Mark latest as read
      if (logs.length > 0) {
        sessionStorage.setItem("lastSeenNotification", logs[logs.length - 1].timestamp);
        updateNotificationDot();
      }
    });
}
function updateNotificationDot() {
  fetch("https://moviemania-backend-k8ot.onrender.com/api/notifications")
    .then(res => res.json())
    .then(logs => {
      const dot = document.getElementById("notif-dot");
      const lastSeen = sessionStorage.getItem("lastSeenNotification");

      const newLogs = logs.filter(log => !lastSeen || new Date(log.timestamp) > new Date(lastSeen));
      dot.style.display = newLogs.length > 0 ? "inline-block" : "none";
    });
}


function saveToServer() {
  const file = document.getElementById("posterInput").files[0];
  if (!file) return alert("âŒ Please select a poster image.");

  const formData = new FormData();
  formData.append("poster", file);

  fetch("https://moviemania-backend-k8ot.onrender.com/upload-poster", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.text())
    .then((response) => {
      if (response.startsWith("success:")) {
        const fileName = response.split(":")[1];
        const uploadedPosterPath = `../images/${fileName}`;

        const movie = {
          id: val("id"),
          title: val("title"),
          category: val("category").split(",").map(c => c.trim()),
          details: val("details"),
          image: uploadedPosterPath,
          url: `movie.html?id=${val("id")}`,
          releaseDate: val("releaseDate"),
          summary: val("summary"),
          rating: val("rating"),
          languages: val("languages"),
          countries: val("countries"),
          poster: uploadedPosterPath,
          trailer: val("trailer"),
          downloads: {
            "480p": val("link480"),
            "720p": val("link720"),
            "1080p": val("link1080"),
          },
        };

        fetch("https://moviemania-backend-k8ot.onrender.com/save/movies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movie, null, 2),
        })
          .then((res) => res.text())
          .then((msg) => {
          document.getElementById("output").textContent = JSON.stringify(movie, null, 2);
          alert(msg);

          // âœ… Clear form inputs
          const fieldsToClear = [
            "id", "title", "category", "details", "releaseDate", "summary",
            "rating", "languages", "countries", "trailer", "link480", "link720", "link1080"
          ];
          fieldsToClear.forEach(id => document.getElementById(id).value = "");

          // âœ… Clear poster input and preview
          document.getElementById("posterInput").value = "";
          document.getElementById("posterPreview").src = "";

          // Optional: clear JSON output too
          // document.getElementById("output").textContent = "";
        });

      } else {
        alert("âŒ Poster upload failed: " + response);
      }
    });
}

function generateSeriesJSON() {
  const id = val("seriesId");
  const title = val("seriesTitle");
  const description = val("description");
  const episodeCount = parseInt(val("episodeCount"));
  const qualities = val("qualities").split(",").map((q) => q.trim());
  const pattern = val("linkPattern");

  if (!id || !title || isNaN(episodeCount)) return alert("Please fill all fields.");

  const result = { [id]: { title, description, episodes: {} } };
  qualities.forEach((quality) => {
    result[id].episodes[quality] = [];
    for (let i = 1; i <= episodeCount; i++) {
      const link = pattern.replace("{id}", id).replace("{num}", i).replace("{quality}", quality);
      result[id].episodes[quality].push({ title: `Episode ${i}`, link });
    }
  });
  document.getElementById("output").textContent = JSON.stringify(result, null, 2);
}

function saveSeriesToServer() {
  const jsonText = document.getElementById("output").textContent;
  if (!jsonText) return alert("Please generate JSON first.");

  fetch("https://moviemania-backend-k8ot.onrender.com/save/series", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: jsonText,
})
  .then((res) => res.text())
  .then((msg) => {
    alert(msg);

    // âœ… Clear key inputs after successful save
    document.getElementById("seriesId").value = "";
    document.getElementById("seriesTitle").value = "";
    document.getElementById("episodeCount").value = "";

    // Optional: also clear description and preview
    document.getElementById("description").value = "";
    // document.getElementById("output").textContent = "";
  });
}


function mergeAndFormatJSON() {
  const input = val("input");
  let json;
  try {
    if (input.startsWith("{")) {
      json = JSON.parse(`{${input.replace(/^[{]|[}]$/g, "")}}`);
    } else if (input.startsWith("[")) {
      json = Object.assign({}, ...JSON.parse(input));
    } else {
      json = JSON.parse(`{${input}}`);
    }
    document.getElementById("output").textContent = JSON.stringify(json, null, 2);
  } catch (e) {
    document.getElementById("output").textContent = "âŒ Invalid JSON input.\n" + e.message;
  }
}

// Panel navigation
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.panel;
      showPanel(target);
    });
  });
});

// Login function for login.html
function login() {
  const username = val("username");
  const password = val("password");

  fetch("https://moviemania-backend-k8ot.onrender.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_user", data.user.username);
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("error").textContent = data.message || "Invalid credentials.";
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById("error").textContent = "Error connecting to server.";
    });
}