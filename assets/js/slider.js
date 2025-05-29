let slideIndex = 0;
let autoSlideInterval;
const AUTO_SLIDE_TIME = 15000; // 15 giây

function createDots() {
  const slides = document.querySelectorAll('.slider-item');
  const dotsContainer = document.getElementById('sliderDots');
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (idx === 0) dot.classList.add('active-dot');
    dot.addEventListener('click', () => {
      showSlide(idx);
      resetAutoSlide();
    });
    dotsContainer.appendChild(dot);
  });
}

function showSlide(index) {
  const slides = document.querySelectorAll('.slider-item');
  const dots = document.querySelectorAll('.dot');
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle('active-dot', i === index);
  });
  currentSlide = index;
}

let currentSlide = 0;

function moveSlide(step) {
  const slides = document.querySelectorAll('.slider-item');
  let newIndex = (currentSlide + step + slides.length) % slides.length;
  showSlide(newIndex);
  resetAutoSlide();
}

function autoSlide() {
  moveSlide(1);
}

function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(autoSlide, AUTO_SLIDE_TIME);
}

window.addEventListener('DOMContentLoaded', () => {
  createDots();
  showSlide(0);
  autoSlideInterval = setInterval(autoSlide, AUTO_SLIDE_TIME);
});
