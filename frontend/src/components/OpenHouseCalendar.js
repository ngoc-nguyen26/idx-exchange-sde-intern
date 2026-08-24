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
        data.map((oh) => {
          let parsedData = {};
          try {
            parsedData = typeof oh.all_data === 'string' ? JSON.parse(oh.all_data) : (oh.all_data || {});
          } catch (e) {
            console.error("Failed to parse all_data for listing", oh.L_ListingID);
          }

          const baseAddress = oh.L_Address || parsedData.address || "Open House";
          const city = oh.L_City || parsedData.city || null;
          
          return {
            title: city ? `${baseAddress} (${city})` : baseAddress,
            start: toEventDate(oh.OpenHouseDate, oh.OH_StartTime),
            end: toEventDate(oh.OpenHouseDate, oh.OH_EndTime),
            listingId: oh.L_ListingID,
            city: city,
            neighborhood: oh.L_Neighborhood || parsedData.neighborhood || null,
            rawProperty: oh,
            allData: parsedData
          };
        })
      );

      setError("");
    } catch (err) {
      setError(err.message || "Failed to load open houses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let gridStart;
    let gridEnd;

    if (view === Views.MONTH) {
      gridStart = startOfWeek(startOfMonth(date), { locale: enUS });
      gridEnd = endOfWeek(endOfMonth(date), { locale: enUS });
    } else if (view === Views.WEEK) {
      gridStart = startOfWeek(date, { locale: enUS });
      gridEnd = endOfWeek(date, { locale: enUS });
    } else if (view === Views.AGENDA) {
      gridStart = date;
      gridEnd = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else { // DAY view
      gridStart = date;
      gridEnd = date;
    }

    loadRange(gridStart, gridEnd);
  }, [view, date, loadRange]);

  const handleViewChange = (newView) => {
    if (view === Views.MONTH && (newView === Views.WEEK || newView === Views.DAY)) {
      setDate((prevDate) => startOfMonth(prevDate));
    }
    setView(newView);
  };

  const isPassed = useCallback(
    (event) => event.end < new Date(),
    []
  );

  const eventPropGetter = useCallback(
    (event) => {
      const isPast = isPassed(event);
      
      if (view === Views.MONTH) {
        return { className: isPast ? "oh-status-red" : "oh-status-green" };
      } else if (view === Views.AGENDA) {
        // Agenda view styling is handled mostly via CSS, return empty or specific class
        return { className: isPast ? "oh-agenda-past" : "" };
      } else {
        // Time grid (Week/Day) polished red theme
        return { className: isPast ? "oh-time-red-expired" : "oh-time-green-upcoming" };
      }
    },
    [isPassed, view]
  );

  // Highlight whichever date is currently selected (drawer open for it), so
  // the drawer's contents are visually anchored to a cell on the calendar.
  const dayPropGetter = useCallback(
    (cellDate) => {
      if (panelDate && isSameDay(cellDate, panelDate)) {
        return { className: "oh-selected-day-cell" };
      }
      return {};
    },
    [panelDate]
  );

  const panelEvents = useMemo(
    () =>
      panelDate
        ? events.filter((event) => isSameDay(event.start, panelDate))
        : [],
    [events, panelDate]
  );

  const handleShowMore = useCallback((_events, showMoreDate) => {
    setPanelDate(showMoreDate);
  }, []);

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

      {loading && (
        <p className="status-message">
          Loading open houses…
        </p>
      )}

      <div className="oh-layout">
        <div className="oh-calendar-main">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            onView={handleViewChange}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            dayLayoutAlgorithm="overlap"
            dayMaxEvents={2}
            onShowMore={handleShowMore}
            onDrillDown={handleDrillDown}
            onSelectEvent={(event) => navigate(`/property/${event.listingId}`)}
          />
        </div>

        {panelDate && (
          <OpenHouseDayPanel
            date={panelDate}
            events={panelEvents}
            isPassed={isPassed}
            onClose={() => setPanelDate(null)}
            onSelectProperty={(event) => {
              navigate(`/property/${event.listingId}`);
            }}
          />
        )}
      </div>
    </div>
  );
}