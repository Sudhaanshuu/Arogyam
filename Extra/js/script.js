// For the floating login page
const loginModal = document.getElementById("login-modal");
const closeModal = document.getElementById("close-modal");

window.addEventListener("load", () => {
    loginModal.style.display = "block";
});

closeModal.addEventListener("click", () => {
    loginModal.style.display = "none";
});