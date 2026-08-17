import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import ListingsPage from "./pages/ListingsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import CalendarPage from "./pages/CalendarPage";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function AppLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSearchView = searchParams.get("view") === "search";

  const NAV_ITEMS = [
    {
      label: "Home",
      to: "/",
      match: () => location.pathname === "/" && !isSearchView,
    },
    {
      label: "Search",
      to: "/?view=search",
      match: () =>
        (location.pathname === "/" && isSearchView) ||
        location.pathname.startsWith("/property"),
    },
    {
      label: "Open House",
      to: "/calendar",
      match: () => location.pathname === "/calendar",
    },
  ];
  const [theme, setTheme] = useState(
    () => localStorage.getItem("idx-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("idx-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link to="/" className="app-brand">
          <span className="app-logo-mark">
            <img
              src={`${process.env.PUBLIC_URL}/idxexchange_logo.jpg`}
              alt=""
              className="app-logo-image"
            />
          </span>
          <span className="app-brand-text">
            <span className="app-logo-name">IDX Exchange</span>
            <span className="app-slogan">
              Real estate search with property listings
            </span>
          </span>
        </Link>

        <div className="app-topbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
            <span className="theme-toggle-label">
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>

          <div className="user-avatar" aria-label="User profile">
            NN
          </div>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-sidebar" aria-label="Main navigation">
          <ul className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const isActive = item.match();

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`sidebar-link${isActive ? " active" : ""}`}
                  >
                    <span className="sidebar-dot" aria-hidden="true" />
                    <span className="sidebar-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="app-main">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ListingsPage />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
