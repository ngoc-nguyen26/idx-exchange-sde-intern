import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import endOfWeek from "date-fns/endOfWeek";
import getDay from "date-fns/getDay";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import isSameDay from "date-fns/isSameDay";
import enUS from "date-fns/locale/en-US";
import { fetchOpenHouses } from "../api/client";
import OpenHouseDayPanel from "./OpenHouseDayPanel.js";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./OpenHouseCalendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales: { "en-US": enUS },
});

function toEventDate(dateStr, timeStr) {
  const [h = 0, m = 0] = (timeStr || "00:00").split(":").map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function OpenHouseCalendar() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  // Which day's aggregate drill-down panel is open, if any.
  const [panelDate, setPanelDate] = useState(null);
  const navigate = useNavigate();

  const loadRange = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const data = await fetchOpenHouses({
        startDate: toDateKey(start),
        endDate: toDateKey(end),
      });
      setEvents(
        data.map((oh) => ({
          title: oh.L_Address || "Open House",
          start: toEventDate(oh.OpenHouseDate, oh.OH_StartTime),
          end: toEventDate(oh.OpenHouseDate, oh.OH_EndTime),
          listingId: oh.L_ListingID,
          // Optional — used by the day panel's location grouping when the
          // API provides them; falls back to parsing the address string.
          city: oh.L_City || null,
          neighborhood: oh.L_Neighborhood || null,
          rawProperty: oh
        }))
      );
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load open houses");
    } finally {
      setLoading(false);
    }
  }, []);

  // Recompute the fetch range whenever the current view or the
  // focused date changes (this covers Month/Week/Day/Agenda + Next/Back/Today).
  useEffect(() => {
    let gridStart;
    let gridEnd;

    if (view === Views.MONTH) {
      gridStart = startOfWeek(startOfMonth(date), { locale: enUS });
      gridEnd = endOfWeek(endOfMonth(date), { locale: enUS });
    } else if (view === Views.WEEK) {
      gridStart = startOfWeek(date, { locale: enUS });
      gridEnd = endOfWeek(date, { locale: enUS });
    } else {
      // Day or Agenda — just load the single focused day
      gridStart = date;
      gridEnd = date;
    }

    loadRange(gridStart, gridEnd);
  }, [view, date, loadRange]);

  // Fix: when switching FROM Month view TO Week/Day view, anchor the
  // calendar on the first day of the month that was being viewed,
  // instead of letting react-big-calendar fall back to today's date.
  const handleViewChange = (newView) => {
    if (view === Views.MONTH && newView === Views.WEEK) {
      setDate((prevDate) => startOfMonth(prevDate));
    } else if (view === Views.MONTH && newView === Views.DAY) {
      setDate((prevDate) => startOfMonth(prevDate));
    }
    setView(newView);
  };

  // Business logic for expired/upcoming: red once the open house's end
  // time has passed, green if it's today-and-not-passed-yet or in the
  // future. Uses the existing event.end date (built from the real
  // open-house date/time fields) — no separate date system. Shared by
  // the status dot and the day panel's Upcoming/Expired filter.
  const isPassed = useCallback((event) => event.end < new Date(), []);

  const eventPropGetter = useCallback(
    (event) => ({
      className: isPassed(event) ? "oh-status-red" : "oh-status-green",
    }),
    [isPassed]
  );

  // Events for whichever day the drill-down panel currently has open.
  const panelEvents = useMemo(
    () => (panelDate ? events.filter((e) => isSameDay(e.start, panelDate)) : []),
    [events, panelDate]
  );

  // Clicking "+N more" on a busy month-view day opens the aggregate panel
  // instead of react-big-calendar's default cramped popup.
  const handleShowMore = useCallback((_events, showMoreDate) => {
    setPanelDate(showMoreDate);
  }, []);

  // Clicking a date number in Month view opens the panel too (per the
  // "calendar answers when, the panel answers where/which" design).
  // Any other drill-down (e.g. a Week/Day header) keeps the library's
  // normal behavior of navigating to Day view.
  const handleDrillDown = useCallback(
    (drillDate, drillView) => {
      if (view === Views.MONTH) {
        setPanelDate(drillDate);
      } else {
        setDate(drillDate);
        setView(drillView || Views.DAY);
      }
    },
    [view]
  );

return (
  <div className="oh-calendar-wrapper">
    {error && <p className="error-box">{error}</p>}
    {loading && <p className="status-message">Loading open houses…</p>}
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      view={view}
      onView={handleViewChange}
      date={date}
      onNavigate={setDate}
      eventPropGetter={eventPropGetter}
      dayLayoutAlgorithm="no-overlap"
      dayMaxEvents={2}
      onShowMore={handleShowMore}
      onDrillDown={handleDrillDown}
      onSelectEvent={(event) => navigate(`/property/${event.listingId}`)}
    />
    {panelDate && (
      <OpenHouseDayPanel
        date={panelDate}
        events={panelEvents}
        isPassed={isPassed}
        onClose={() => setPanelDate(null)}
        onSelectProperty={(event) => {
          setPanelDate(null);
          navigate(`/property/${event.listingId}`);
        }}
      />
    )}
  </div>
);
}