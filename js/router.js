window.toggleSidebar = function () {
  document.getElementById('sidebar').classList.toggle('active');
}

window.cerrarSidebar = function () {

  document.getElementById('sidebar')
    .classList.remove('active');

  document.getElementById('overlay')
    .classList.remove('active');
}

window.toggleSidebar = function () {

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');

}
function cerrarSidebar() {

  document.getElementById('sidebar')
    .classList.remove('active');

  document.getElementById('overlay')
    .classList.remove('active');

}
document.getElementById('overlay')
  .addEventListener('click', cerrarSidebar);



