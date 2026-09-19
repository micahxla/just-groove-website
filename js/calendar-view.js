(() => {
    const calendar = document.querySelector(".availability-calendar iframe");

    if (!calendar) return;

    const compactScreen = window.matchMedia("(max-width: 600px)");
    const calendarUrl = new URL(calendar.src);

    function updateCalendarView() {
        calendarUrl.searchParams.set("mode", compactScreen.matches ? "AGENDA" : "MONTH");
        calendarUrl.searchParams.set("showCalendars", "0");
        calendarUrl.searchParams.set("showPrint", "0");
        calendarUrl.searchParams.set("showTitle", "0");
        calendarUrl.searchParams.set("showTabs", "0");
        calendar.src = calendarUrl.toString();
    }

    updateCalendarView();
    compactScreen.addEventListener("change", updateCalendarView);
})();
