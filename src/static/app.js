document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and current content/options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      const template = document.getElementById("activity-card-template");

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const spotsLeft = details.max_participants - details.participants.length;

        if (template && "content" in template) {
          // Clone template and populate fields
          const clone = template.content.cloneNode(true);
          const card = clone.querySelector(".activity-card");

          card.querySelector(".activity-title").textContent = name;
          card.querySelector(".activity-desc").textContent = details.description;
          card.querySelector(".activity-schedule").innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

          // Availability paragraph (append so template stays generic)
          const availabilityP = document.createElement("p");
          availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
          card.appendChild(availabilityP);

          // Populate participants list as pills with a remove button
          const participantsList = card.querySelector(".participants-list");
          participantsList.innerHTML = "";
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-pill";
            span.textContent = email;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "participant-remove";
            removeBtn.setAttribute("aria-label", `Remove ${email} from ${name}`);
            removeBtn.dataset.email = email;
            removeBtn.dataset.activity = name;
            removeBtn.innerHTML = `&times;`;

            li.appendChild(span);
            li.appendChild(removeBtn);
            participantsList.appendChild(li);
          });

          // Store activity name on the card for reference
          card.dataset.activity = name;

          activitiesList.appendChild(card);
        } else {
          // Fallback to original simple card if template missing
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";
          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;
          activitiesList.appendChild(activityCard);
        }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Use the base .message class plus status class
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities so participants and availability update immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Delegate click events for participant remove buttons
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".participant-remove");
    if (!btn) return;

    const email = btn.dataset.email;
    const activity = btn.dataset.activity;

    if (!email || !activity) return;

    // Confirm action with the user
    const ok = window.confirm(`Unregister ${email} from ${activity}?`);
    if (!ok) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message || "Participant removed";
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");

        // Refresh activities to update UI
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Failed to remove participant. Try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Initialize app
  fetchActivities();
});
