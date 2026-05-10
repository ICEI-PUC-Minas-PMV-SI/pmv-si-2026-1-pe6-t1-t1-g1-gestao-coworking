function moveSlide(button, direction) {
  const track = button.parentElement.querySelector(".carousel-track");
  const slides = track.children;
  const slideWidth = slides[0].clientWidth;

  let currentTransform = getComputedStyle(track).transform;

  let matrix = new DOMMatrix(currentTransform);
  let currentX = matrix.m41;

  track.style.transform = `translateX(${currentX - direction * slideWidth}px)`;
} function irParaCarrinho(plano) {
  window.location.href = `carrinho.html?plano=${plano}`;
}

