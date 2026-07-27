import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import PropertyFilters from "./PropertyFilters";

test("shows all six filter fields", () => {
  render(<PropertyFilters onSearch={jest.fn()} onClear={jest.fn()} />);

  expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/min price/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/max price/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/beds/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/baths/i)).toBeInTheDocument();
});

// Test 2: Form submission sends complete filter values
test("submitting the form sends the complete, combined filter values", () => {
  const onSearch = jest.fn();
  render(<PropertyFilters onSearch={onSearch} onClear={jest.fn()} />);

  fireEvent.change(screen.getByLabelText(/city/i), {
    target: { value: "Harpersville" },
  });
  fireEvent.change(screen.getByLabelText(/min price/i), {
    target: { value: "150000" },
  });
  fireEvent.change(screen.getByLabelText(/beds/i), {
    target: { value: "3" },
  });

  fireEvent.click(screen.getByRole("button", { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({
    city: "Harpersville",
    zipcode: "",
    minPrice: "150000",
    maxPrice: "",
    beds: "3",
    baths: "",
  });
});

// Test 3: Clear button resets form and calls onClear
test("Clear Filters button empties the form and calls onClear", () => {
  const onClear = jest.fn();
  render(<PropertyFilters onSearch={jest.fn()} onClear={onClear} />);

  const cityInput = screen.getByLabelText(/city/i);
  fireEvent.change(cityInput, { target: { value: "Naperville" } });

  expect(cityInput.value).toBe("Naperville");

  const clearButton = screen.getByRole("button", { name: /clear filters/i });
  fireEvent.click(clearButton);

  expect(cityInput.value).toBe("");
  expect(onClear).toHaveBeenCalledTimes(1);
});

// Test 4: User can select a value from Beds dropdown
test("user can select a value from the Beds dropdown", () => {
  render(<PropertyFilters onSearch={jest.fn()} onClear={jest.fn()} />);

  const bedsDropdown = screen.getByLabelText(/beds/i);
  fireEvent.change(bedsDropdown, { target: { value: "4" } });

  expect(bedsDropdown.value).toBe("4");

  expect(
    within(bedsDropdown).getByRole("option", { name: "Any" })
  ).toBeInTheDocument();
});

// Test 5: Rendering does not trigger callbacks
test("does not call onSearch or onClear just from rendering", () => {
  const onSearch = jest.fn();
  const onClear = jest.fn();

  render(<PropertyFilters onSearch={onSearch} onClear={onClear} />);

  expect(onSearch).not.toHaveBeenCalled();
  expect(onClear).not.toHaveBeenCalled();
});