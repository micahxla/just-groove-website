# Availability calendar

The custom calendar replaces the embedded Google iframe and keeps the original calendar ID (`justgroovellc@gmail.com`). It displays only busy intervals, never event names, locations, descriptions, guests, or links. Dates and times use the visitor's browser timezone; the end of a busy interval is exclusive.

## Connect live availability

`js/calendar-view.js` fetches Google Calendar events and converts their start/end times into busy intervals for the existing renderer. The Calendar ID and browser API key are configured at the top of that file. It never treats a failed request as an empty calendar.

1. Enable Google Calendar API in an owner-controlled Google Cloud project.
2. Create a browser API key restricted to Google Calendar API and the site's actual HTTP referrers. Add localhost referrers only if needed for local verification.
3. Set the `apiKey` constant at the top of `js/calendar-view.js` to that restricted browser key. The script uses this constant directly; the HTML data attributes do not override it. A browser key is visible to visitors; never put OAuth tokens, service-account credentials, or secret iCal URLs here.
4. This API-key-only events feed requires a publicly readable calendar. The UI displays only busy times, but any public event details returned by Google remain accessible through the browser/API. Do not make private client information public to enable this feature. If the calendar cannot be publicly readable, use an owner-authorized server-side service that returns only busy intervals. No sharing settings are changed by this code.
5. Verify live results before publishing. The site requests the displayed month with a one-day buffer at each boundary for all-day dates in different timezones, follows pagination, expands recurring events, and excludes cancelled events and events marked free. Timed events display in the visitor's timezone; all-day events retain their calendar dates with an exclusive end date. The renderer filters out intervals outside the displayed month.

Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/list

## Local verification

Serve this folder with a local static server and open the site at desktop and mobile widths. Check month navigation, Today, selected-day busy intervals, browser timezone conversion, midnight and multiday intervals, all-day dates, pagination, empty months, denied access, network failures, retry, and rapid navigation. Invalid intervals and failed requests must remain unavailable, not show an open schedule. Google may omit `items` for an empty events response.

The booking form and its Formspree integration are unchanged. Do not send a real test inquiry unless intended.
