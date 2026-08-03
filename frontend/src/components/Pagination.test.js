import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Pagination, { getPageNumbers } from "./Pagination";

const mockPageChange = jest.fn();

beforeEach(() => {
  mockPageChange.mockClear();
});


// Rendering behavior
test("hides pagination when there is only one page", () => {
  const { container } = render(
    <Pagination
      currentPage={1}
      totalPages={1}
      onPageChange={mockPageChange}
    />
  );

  expect(container).toBeEmptyDOMElement();
});

test("hides pagination when there are zero pages", () => {
  const { container } = render(
    <Pagination
      currentPage={1}
      totalPages={0}
      onPageChange={mockPageChange}
    />
  );

  expect(container).toBeEmptyDOMElement();
});


// Navigation button states
test("disables Previous button on the first page", () => {
  render(
    <Pagination
      currentPage={1}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  expect(
    screen.getByRole("button", { name: /previous/i })
  ).toBeDisabled();
});

test("disables Next button on the last page", () => {
  render(
    <Pagination
      currentPage={5}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  expect(
    screen.getByRole("button", { name: /next/i })
  ).toBeDisabled();
});


// Page navigation
test("changes to selected page when clicking a page number", () => {
  render(
    <Pagination
      currentPage={1}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "3" }));

  expect(mockPageChange).toHaveBeenCalledWith(3);
});

test("goes to previous page when clicking Previous", () => {
  render(
    <Pagination
      currentPage={3}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /previous/i }));

  expect(mockPageChange).toHaveBeenCalledWith(2);
});

test("goes to next page when clicking Next", () => {
  render(
    <Pagination
      currentPage={3}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /next/i }));

  expect(mockPageChange).toHaveBeenCalledWith(4);
});


// Accessibility
test("marks the current page with aria-current", () => {
  render(
    <Pagination
      currentPage={3}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  expect(
    screen.getByRole("button", { name: "3" })
  ).toHaveAttribute("aria-current", "page");
});


// Page number display
test("shows all page numbers when there are few pages", () => {
  render(
    <Pagination
      currentPage={3}
      totalPages={5}
      onPageChange={mockPageChange}
    />
  );

  for (let page = 1; page <= 5; page++) {
    expect(
      screen.getByRole("button", { name: String(page) })
    ).toBeInTheDocument();
  }

  expect(screen.queryByText("…")).not.toBeInTheDocument();
});

test("shows ellipsis when there are many pages", () => {
  render(
    <Pagination
      currentPage={5}
      totalPages={24}
      onPageChange={mockPageChange}
    />
  );

  expect(screen.getAllByText("…")).toHaveLength(2);

  ["1", "4", "5", "6", "24"].forEach((page) => {
    expect(
      screen.getByRole("button", { name: page })
    ).toBeInTheDocument();
  });
});


// Helper function
test("does not duplicate the last page number", () => {
  const pages = getPageNumbers(22, 24);

  expect(pages).toEqual([
    1,
    "ellipsis-start",
    20,
    21,
    22,
    23,
    24,
  ]);

  expect(
    pages.filter((page) => page === 24)
  ).toHaveLength(1);
});


// Regression test
test("renders only one button for the last page", () => {
  render(
    <Pagination
      currentPage={22}
      totalPages={24}
      onPageChange={mockPageChange}
    />
  );

  expect(
    screen.getAllByRole("button", { name: "24" })
  ).toHaveLength(1);
});