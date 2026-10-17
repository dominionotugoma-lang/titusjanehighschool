
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

document.getElementById("year").textContent =
  new Date().getFullYear();

contactForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !subject || !message) {
    formStatus.textContent = "Please complete every field.";
    formStatus.style.color = "red";
    return;
  }

  // Replace this with the school's real email address.
  const schoolEmail = "school@example.com";

  const emailSubject = encodeURIComponent(subject);
  const emailBody = encodeURIComponent(
    "Name: " + name +
    "\nEmail: " + email +
    "\n\nMessage:\n" + message
  );

  formStatus.textContent =
    "Opening your email application. Send the message there to complete it.";
  formStatus.style.color = "#073b83";

  window.location.href =
    "mailto:" + schoolEmail +
    "?subject=" + emailSubject +
    "&body=" + emailBody;
});
