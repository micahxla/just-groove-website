const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
const mobileLinks = document.querySelectorAll(".mobile-nav a");


function openMenu() {
    mobileNav.classList.add("open");

    document.body.classList.add("menu-open");

    menuButton.textContent = "CLOSE";

    menuButton.setAttribute("aria-expanded", "true");
}


function closeMenu() {
    mobileNav.classList.remove("open");

    document.body.classList.remove("menu-open");

    menuButton.textContent = "MENU";

    menuButton.setAttribute("aria-expanded", "false");
}


menuButton.addEventListener("click", () => {

    const menuIsOpen = mobileNav.classList.contains("open");

    if (menuIsOpen) {
        closeMenu();
    } else {
        openMenu();
    }

});


mobileLinks.forEach((link) => {

    link.addEventListener("click", () => {
        closeMenu();
    });

});

/* =========================================
   BOOKING FORM
   ========================================= */

const bookingForm = document.querySelector("#booking-form");
const formStatus = document.querySelector("#form-status");
const submitButton = bookingForm.querySelector(".form-submit");


bookingForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "SENDING...";

    formStatus.textContent = "";

    const formData = new FormData(bookingForm);

    try {

        const response = await fetch(bookingForm.action, {
            method: bookingForm.method,
            body: formData,
            headers: {
                "Accept": "application/json"
            }
        });


        if (response.ok) {

            formStatus.textContent =
                "Thank you! Your inquiry has been sent. Just Groove will be in touch soon.";

            bookingForm.reset();

        } else {

            formStatus.textContent =
                "We couldn't send your inquiry. Please try again.";

        }

    } catch (error) {

        formStatus.textContent =
            "We couldn't send your inquiry. Please check your connection and try again.";

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Request a Quote";

    }
});

 /* =========================================
   EVENT DATE
   Prevent past dates
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const eventDateInput = document.querySelector("#event-date");

    if (!eventDateInput) return;

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const todayString = `${year}-${month}-${day}`;

    eventDateInput.setAttribute("min", todayString);
});
