
const slides = Array.from(document.querySelectorAll(".slide"));
const dots = Array.from(document.querySelectorAll(".dot"));

let currentSlide = 0;
let slideshowTimer;

function showSlide(index) {
  if (slides.length === 0) return;

  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

function startSlideshow() {
  clearInterval(slideshowTimer);

  if (slides.length > 1) {
    slideshowTimer = setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
  }
}

document.getElementById("nextSlide")?.addEventListener("click", () => {
  showSlide(currentSlide + 1);
  startSlideshow();
});

document.getElementById("prevSlide")?.addEventListener("click", () => {
  showSlide(currentSlide - 1);
  startSlideshow();
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showSlide(index);
    startSlideshow();
  });
});

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

showSlide(0);
startSlideshow();
