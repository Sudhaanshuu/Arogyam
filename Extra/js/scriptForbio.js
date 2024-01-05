const loginModal = document.getElementById("login-modal");
const bioAuthModal = document.getElementById("bio-auth-modal");
const imageModal = document.getElementById("image-modal");
const loginForm = document.getElementById("login-form");


window.addEventListener("load", () => {
    loginModal.style.display = "block";
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    bioAuthModal.style.display = "block";
});

const closeModalButtons = document.querySelectorAll(".close");
closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
        loginModal.style.display = "none";
        bioAuthModal.style.display = "none";
        imageModal.style.display = "none";
    });
});