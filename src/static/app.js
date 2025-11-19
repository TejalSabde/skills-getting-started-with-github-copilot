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

          // Populate participants list as pills
          const participantsList = card.querySelector(".participants-list");
          participantsList.innerHTML = "";
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            const span = document.createElement("span");
            span.className = "participant-pill";
            span.textContent = email;
            li.appendChild(span);
            participantsList.appendChild(li);
          });

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

  // Initialize app
  fetchActivities();
});
