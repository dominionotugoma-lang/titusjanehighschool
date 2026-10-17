const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      menuToggle.textContent = "☰";
    });
  });
}

const galleryImages = Array.from(
  document.querySelectorAll("#galleryGrid .gallery-card img")
);

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxCounter = document.getElementById("lightboxCounter");
const closeButton = document.getElementById("lightboxClose");
let currentImageIndex = 0;
let previouslyFocusedElement = null;

const imageCount = document.getElementById("imageCount");
if (imageCount) imageCount.textContent = String(galleryImages.length);

function showImage(index) {
  if (!galleryImages.length) return;

  currentImageIndex = (index + galleryImages.length) % galleryImages.length;
  const image = galleryImages[currentImageIndex];
  const card = image.closest(".gallery-card");
  const caption = card ? card.querySelector(".caption") : null;

  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = caption ? caption.textContent : image.alt;
  lightboxCounter.textContent =
    `Image ${currentImageIndex + 1} of ${galleryImages.length}`;
}

function openLightbox(index) {
  previouslyFocusedElement = document.activeElement;
  showImage(index);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  closeButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lightboxImage.removeAttribute("src");

  if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === "function") {
    previouslyFocusedElement.focus();
  }
}

galleryImages.forEach((image, index) => {
  image.addEventListener("click", () => openLightbox(index));
  image.addEventListener("error", () => {
    image.classList.add("image-missing");
    image.alt = `Photo ${index + 1} is missing. Add the file at ${image.getAttribute("src")}.`;
    image.title = `Missing image file: ${image.getAttribute("src")}`;
  });
});

closeButton.addEventListener("click", closeLightbox);

document.getElementById("lightboxPrev").addEventListener("click", () => {
  showImage(currentImageIndex - 1);
});

document.getElementById("lightboxNext").addEventListener("click", () => {
  showImage(currentImageIndex + 1);
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showImage(currentImageIndex - 1);
  if (event.key === "ArrowRight") showImage(currentImageIndex + 1);
});

const currentYear = document.getElementById("currentYear");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
