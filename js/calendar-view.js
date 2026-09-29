const calendarId = "justgroovellc@gmail.com";
const apiKey = "AIzaSyBtuYArzO9zeepYi25knhVHOQ-5QwxPX-I";

(() => {
    const calendar = document.querySelector(".availability-calendar");
    if (!calendar) return;

    const monthLabel = calendar.querySelector("#calendar-month");
    const days = calendar.querySelector(".calendar-days");
    const status = calendar.querySelector(".calendar-status");
    const details = calendar.querySelector(".calendar-details");
    const selectedLabel = calendar.querySelector("#calendar-selected-date");
    const busyTimes = calendar.querySelector(".calendar-busy-times");
    const retry = calendar.querySelector(".calendar-retry");
    const today = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
    const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
    const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
    let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let month = new Date(today.getFullYear(), today.getMonth(), 1);
    let intervals = [];
    let state = "loading";
    let pendingRequest;

    calendar.querySelector(".calendar-toolbar").hidden = false;
    calendar.querySelector(".calendar-weekdays").hidden = false;
    calendar.querySelector(".calendar-timezone").textContent = `Times shown in your timezone: ${timeZone.replaceAll("_", " ")}`;

    function sameDate(first, second) {
        return first.toDateString() === second.toDateString();
    }

    function busyOn(date) {
        const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        return intervals.filter(interval => interval.start < nextDay && interval.end > date);
    }

    function renderDetails() {
        details.hidden = state !== "ready";
        selectedLabel.textContent = dateFormat.format(selectedDate);
        busyTimes.replaceChildren();
        if (state !== "ready") return;

        const nextDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        const selectedIntervals = busyOn(selectedDate);
        if (!selectedIntervals.length) {
            const item = document.createElement("li");
            item.textContent = "No booked times listed. Please confirm your date using the booking form.";
            busyTimes.append(item);
        }
        selectedIntervals.forEach(interval => {
            const item = document.createElement("li");
            const start = interval.start < selectedDate ? selectedDate : interval.start;
            const end = interval.end > nextDay ? nextDay : interval.end;
            const range = start.getTime() === selectedDate.getTime() && end.getTime() === nextDay.getTime()
                ? "All day"
                : `${timeFormat.format(start)} – ${end.getTime() === nextDay.getTime() ? "midnight (next day)" : timeFormat.format(end)}`;
            item.textContent = `Booked · ${range}`;
            busyTimes.append(item);
        });
    }

    function renderDays() {
        monthLabel.textContent = monthFormat.format(month);
        days.replaceChildren();
        const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        for (let blank = 0; blank < month.getDay(); blank += 1) {
            const spacer = document.createElement("span");
            spacer.setAttribute("aria-hidden", "true");
            days.append(spacer);
        }
        for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
            const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
            const button = document.createElement("button");
            const hasBusyTimes = state === "ready" && busyOn(date).length > 0;
            button.type = "button";
            button.className = "calendar-day";
            button.textContent = dayNumber;
            button.classList.toggle("has-busy-times", hasBusyTimes);
            button.setAttribute("aria-pressed", String(sameDate(date, selectedDate)));
            button.setAttribute("aria-label", `${dateFormat.format(date)}. ${state !== "ready" ? "Availability unknown" : hasBusyTimes ? "Busy times listed" : "No booked times listed; confirm availability"}`);
            if (sameDate(date, today)) button.setAttribute("aria-current", "date");
            button.addEventListener("click", () => {
                selectedDate = date;
                days.querySelectorAll("button").forEach(day => day.setAttribute("aria-pressed", String(day === button)));
                renderDetails();
            });
            days.append(button);
        }
        renderDetails();
    }

    function eventDate(value) {
        if (value?.dateTime) return new Date(value.dateTime);
        if (value?.date && /^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
            const [year, monthNumber, day] = value.date.split("-").map(Number);
            return new Date(year, monthNumber - 1, day);
        }
        return new Date(NaN);
    }

    async function fetchGoogleCalendarEvents(displayMonth, signal) {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
        url.search = new URLSearchParams({
            key: apiKey,
            timeMin: new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 0).toISOString(),
            timeMax: new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 2).toISOString(),
            timeZone,
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: "2500",
            fields: "items(start,end,status,transparency),nextPageToken"
        });
        const events = [];
        let pageToken;
        do {
            if (pageToken) url.searchParams.set("pageToken", pageToken);
            const response = await fetch(url.toString(), { signal, credentials: "omit" });
            if (!response.ok) throw new Error(`Google Calendar request failed (HTTP ${response.status}). Check the API key restrictions, API enablement, and calendar access.`);
            const data = await response.json();
            if (data.error || !Array.isArray(data.items ?? [])) throw new Error("Availability is unavailable");
            events.push(...(data.items ?? []));
            pageToken = data.nextPageToken;
        } while (pageToken);
        return events;
    }

    async function loadMonth() {
        pendingRequest?.abort();
        const request = new AbortController();
        pendingRequest = request;
        intervals = [];
        state = "loading";
        retry.hidden = true;
        status.textContent = "Loading busy times…";
        calendar.setAttribute("aria-busy", "true");
        renderDays();
        const timeout = setTimeout(() => request.abort(), 15000);

        try {
            if (!apiKey || !calendarId) throw new Error("Calendar connection is not configured");
            const events = await fetchGoogleCalendarEvents(month, request.signal);
            if (pendingRequest !== request) return;
            const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);
            intervals = events.filter(event => event.status !== "cancelled" && event.transparency !== "transparent").map(event => {
                const start = eventDate(event.start);
                const end = eventDate(event.end);
                if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) throw new Error("Invalid busy interval");
                return { start, end };
            }).filter(interval => interval.start < monthEnd && interval.end > month)
                .sort((first, second) => first.start - second.start);
            state = "ready";
            status.textContent = intervals.length
                ? "Lime dots mark booked dates. Select a date to view times."
                : "No booked times listed this month. Please confirm your date using the booking form.";
        } catch (error) {
            if (pendingRequest !== request) return;
            console.warn(error instanceof TypeError ? "Google Calendar could not be reached." : error.message);
            intervals = [];
            state = "error";
            status.textContent = "Availability is currently unavailable. Please ask about your date below.";
            retry.hidden = !apiKey;
        } finally {
            clearTimeout(timeout);
            if (pendingRequest === request) {
                calendar.setAttribute("aria-busy", "false");
                renderDays();
            }
        }
    }

    calendar.querySelectorAll("[data-calendar-action]").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.calendarAction;
            if (action === "today") {
                const now = new Date();
                month = new Date(now.getFullYear(), now.getMonth(), 1);
                selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else {
                month = new Date(month.getFullYear(), month.getMonth() + (action === "next" ? 1 : -1), 1);
                selectedDate = new Date(month);
            }
            loadMonth();
        });
    });
    retry.addEventListener("click", loadMonth);
    loadMonth();
})();
