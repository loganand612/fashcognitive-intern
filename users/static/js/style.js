// Mobile Menu Toggle
document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");
    const sidebar = document.querySelector(".sidebar");

    if (mobileMenuBtn && navLinks && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            sidebar.classList.toggle("active");
        });
    }
});

// Language Dropdown Toggle
document.addEventListener("DOMContentLoaded", function () {
    const languageSelect = document.querySelector(".language-select");

    if (languageSelect) {
        languageSelect.addEventListener("mouseenter", () => {
            languageSelect.querySelector(".language-dropdown").style.display = "block";
        });

        languageSelect.addEventListener("mouseleave", () => {
            languageSelect.querySelector(".language-dropdown").style.display = "none";
        });
    }
});