document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleBtn");
  const videos = document.getElementById("contenedorVideos");

  btn.addEventListener("click", () => {
    videos.classList.toggle("mostrar");
  });
});