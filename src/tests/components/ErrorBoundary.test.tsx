// src/tests/components/ErrorBoundary.test.tsx
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";
import { captureException } from "../../lib/sentry";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

jest.mock("../../lib/sentry", () => ({
  captureException: jest.fn(),
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kettle exploded");
  return <Text>all good</Text>;
}

describe("ErrorBoundary", () => {
  let consoleError: jest.SpyInstance;

  beforeAll(() => {
    // React logs caught errors to console.error during componentDidCatch.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  beforeEach(() => {
    (captureException as jest.Mock).mockClear();
  });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("all good")).toBeTruthy();
  });

  it("shows the fallback and reports the error when a child crashes", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "kettle exploded" }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });

  it("recovers via Try again once the child stops throwing", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();

    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    fireEvent.press(screen.getByText("Try again"));
    expect(screen.getByText("all good")).toBeTruthy();
  });
});
