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
        data.map((oh) => ({
          title: oh.L_Address || "Open House",
          start: toEventDate(oh.OpenHouseDate, oh.OH_StartTime),
          end: toEventDate(oh.OpenHouseDate, oh.OH_EndTime),
          listingId: oh.L_ListingID,
          city: oh.L_City || null,
          neighborhood: oh.L_Neighborhood || null,
          rawProperty: oh,
        }))
      );

      setError("");
    } catch (err) {
      setError(err.message || "Failed to load open houses");
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load events for the active calendar range. */
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
      gridStart = date;
      gridEnd = date;
    }

    loadRange(gridStart, gridEnd);
  }, [view, date, loadRange]);

  /* Keep the first day of the month when switching to Week or Day. */
  const handleViewChange = (newView) => {
    if (
      view === Views.MONTH &&
      (newView === Views.WEEK || newView === Views.DAY)
    ) {
      setDate((prevDate) => startOfMonth(prevDate));
    }

    setView(newView);
  };

  const isPassed = useCallback(
    (event) => event.end < new Date(),
    []
  );

  /* Assign up to three visual shades to overlapping Week/Day events. */
  const shadeIndexByEvent = useMemo(() => {
    const shadeMap = new Map();

    if (view !== Views.WEEK && view !== Views.DAY) {
      return shadeMap;
    }

    const n = events.length;
    const visited = new Array(n).fill(false);

    const overlaps = (a, b) =>
      a.start < b.end && b.start < a.end;

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;

      const stack = [i];
      const group = [];
      visited[i] = true;

      while (stack.length) {
        const idx = stack.pop();
        group.push(idx);

        for (let j = 0; j < n; j++) {
          if (!visited[j] && overlaps(events[idx], events[j])) {
            visited[j] = true;
            stack.push(j);
          }
        }
      }

      group.sort(
        (a, b) =>
          events[a].start - events[b].start || a - b
      );

      group.forEach((idx, order) => {
        shadeMap.set(events[idx], Math.min(order, 2));
      });
    }

    return shadeMap;
  }, [events, view]);

  const eventPropGetter = useCallback(
    (event) => {
      const statusClass = isPassed(event)
        ? "oh-status-red"
        : "oh-status-green";

      const shadeIndex = shadeIndexByEvent.get(event) || 0;
      const shadeClass =
        shadeIndex > 0 ? `oh-shade-${shadeIndex}` : "";

      return {
        className: [statusClass, shadeClass]
          .filter(Boolean)
          .join(" "),
      };
    },
    [isPassed, shadeIndexByEvent]
  );

  /* Events for the selected Month-view day. */
  const panelEvents = useMemo(
    () =>
      panelDate
        ? events.filter((event) =>
            isSameDay(event.start, panelDate)
          )
        : [],
    [events, panelDate]
  );

  /* Clicking "+N more" opens the existing day panel. */
  const handleShowMore = useCallback((_events, showMoreDate) => {
    setPanelDate(showMoreDate);
  }, []);

  /* Month date clicks open the same day panel.
     Week/Day navigation keeps normal calendar behavior. */
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
        dayLayoutAlgorithm="overlap"
        dayMaxEvents={2}
        onShowMore={handleShowMore}
        onDrillDown={handleDrillDown}
        onSelectEvent={(event) =>
          navigate(`/property/${event.listingId}`)
        }
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