import { render, screen, fireEvent } from "@testing-library/react";
import PropertyCard from "./PropertyCard";

// Mock navigate so we can test navigation without using a real Router.
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the carousel since it isn't part of the PropertyCard tests.
jest.mock("./PropertyImageCarousel", () => () => <div data-testid="carousel" />);

const baseProperty = {
  L_ListingID: "123",
  L_Address: "123 Main St",
  L_City: "Garland",
  L_State: "TX",
  L_SystemPrice: 450000,
  L_Keyword2: 3,
  LM_Dec_3: 2,
  LM_Int2_3: 1800,
  L_Photos: [],
};

beforeEach(() => {
  mockNavigate.mockClear();
});

describe("PropertyCard", () => {
  test("renders property data", () => {
    render(<PropertyCard property={baseProperty} />);

    expect(screen.getByText("$450,000")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Garland, TX")).toBeInTheDocument();
    expect(screen.getByText("3 beds")).toBeInTheDocument();
    expect(screen.getByText("2 baths")).toBeInTheDocument();
    expect(screen.getByText("1800 sqft")).toBeInTheDocument();
  });

  test("shows fallback text when price or stats are missing", () => {
    const sparseProperty = {
      L_ListingID: "999",
      L_Photos: [],
    };
    render(<PropertyCard property={sparseProperty} />);

    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
    expect(screen.getByText("Address unavailable")).toBeInTheDocument();
    expect(screen.getByText(/—\s*beds/)).toBeInTheDocument();
    expect(screen.getByText(/—\s*baths/)).toBeInTheDocument();
    expect(screen.getByText(/—\s*sqft/)).toBeInTheDocument();
  });

  test("clicking the card navigates to the property detail page", () => {
    render(<PropertyCard property={baseProperty} />);

    fireEvent.click(screen.getByRole("article"));

    expect(mockNavigate).toHaveBeenCalledWith("/property/123");
  });

  test("clicking the card calls onClick instead of navigating, when provided", () => {
    const handleClick = jest.fn();
    render(<PropertyCard property={baseProperty} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("article"));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("renders favorite button and toggles favorite without triggering navigation", () => {
    const handleToggleFavorite = jest.fn();
    render(
      <PropertyCard
        property={baseProperty}
        isFavorite={false}
        onToggleFavorite={handleToggleFavorite}
      />
    );

    const favoriteButton = screen.getByRole("button", { name: /add to favorites/i });
    fireEvent.click(favoriteButton);

    expect(handleToggleFavorite).toHaveBeenCalledWith(baseProperty);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows filled heart and correct label when isFavorite is true", () => {
    render(
      <PropertyCard
        property={baseProperty}
        isFavorite={true}
        onToggleFavorite={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /remove from favorites/i })).toBeInTheDocument();
    expect(screen.getByText("♥")).toBeInTheDocument();
  });

  test("does not render favorite button when onToggleFavorite is not provided", () => {
    render(<PropertyCard property={baseProperty} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("renders open house status badge and time when provided", () => {
    render(
      <PropertyCard
        property={baseProperty}
        openHouseStatus="upcoming"
        openHouseTime="Sat 1-3pm"
      />
    );

    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Sat 1-3pm")).toBeInTheDocument();
  });

  test("renders expired badge text when openHouseStatus is expired", () => {
    render(<PropertyCard property={baseProperty} openHouseStatus="expired" />);

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });
});