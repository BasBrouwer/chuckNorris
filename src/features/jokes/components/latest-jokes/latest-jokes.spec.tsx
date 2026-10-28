import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRandomJokeResponse } from "@/test/factories";
import { http, HttpResponse, RANDOM_JOKE_URL, server } from "@/test/mocks";
import { captureInterval } from "@/test/utils";

import { AUTO_REFRESH_INTERVAL_MS, MAX_JOKES } from "../../hooks/use-jokes";
import { LatestJokes } from "./latest-jokes";
import { createLatestJokesProps } from "./latest-jokes.factory";

afterEach(() => {
  vi.useRealTimers();
});

/** Serves "Joke number 1.", "Joke number 2.", ... with ids `joke-1`, `joke-2`, ... */
function serveNumberedJokes() {
  let served = 0;
  server.use(
    http.get(RANDOM_JOKE_URL, () => {
      served += 1;
      return HttpResponse.json(
        createRandomJokeResponse({ id: `joke-${served}`, value: `Joke number ${served}.` }),
      );
    }),
  );
}

async function renderLoaded(props = createLatestJokesProps()) {
  render(<LatestJokes {...props} />);
  await screen.findAllByRole("listitem");
  return props;
}

describe("LatestJokes loading", () => {
  it("shows the loading message and skeleton cards before any joke arrives", async () => {
    render(<LatestJokes {...createLatestJokesProps()} />);

    expect(screen.getByText("Fetching fresh jokes").closest('[role="status"]')).toBeInTheDocument();
    expect(document.querySelectorAll(".quote-card-skeleton")).toHaveLength(6);
    expect(screen.queryByText(/latest$/)).not.toBeInTheDocument();
    await screen.findAllByRole("listitem");
  });

  it("replaces the placeholders with the jokes and shows the count", async () => {
    await renderLoaded();

    expect(screen.getAllByRole("listitem")).toHaveLength(MAX_JOKES);
    expect(document.querySelectorAll(".quote-card-skeleton")).toHaveLength(0);
    expect(screen.queryByText("Fetching fresh jokes")).not.toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Latest jokes" });
    expect(region).toHaveTextContent(`${MAX_JOKES} latest`);
    expect(region).toHaveTextContent("Newest first");
  });

  it("shows the API's joke text on the cards", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "only", value: "The only joke." })),
      ),
    );

    await renderLoaded();

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("The only joke.")).toBeVisible();
  });
});

describe("LatestJokes failure", () => {
  it("offers a retry that recovers when the API is back", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    server.use(http.get(RANDOM_JOKE_URL, () => new HttpResponse(null, { status: 500 })));
    render(<LatestJokes {...createLatestJokesProps()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load jokes.");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    server.resetHandlers();
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(MAX_JOKES);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("LatestJokes favorites", () => {
  it("reports exactly the joke whose heart was clicked", async () => {
    serveNumberedJokes();
    const props = await renderLoaded();
    const [firstCard] = screen.getAllByRole("listitem");
    const text = firstCard?.textContent?.match(/Joke number (\d+)\./)?.[0] ?? "";
    const number = /(\d+)/.exec(text)?.[1];

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Favorite", description: text }));

    expect(props.onToggleFavorite).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: `joke-${number ?? ""}`, text }),
    );
  });

  it("asks the parent whether each joke is a favorite and reflects the answer", async () => {
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "loved", value: "A loved joke." })),
      ),
    );
    const props = createLatestJokesProps({ isFavorite: vi.fn((id: string) => id === "loved") });

    await renderLoaded(props);

    expect(props.isFavorite).toHaveBeenCalledWith("loved");
    expect(screen.getByRole("button", { name: "Favorite", pressed: true })).toBeVisible();
  });

  it("disables adding favorites and shows the notice when the parent says so", async () => {
    await renderLoaded(
      createLatestJokesProps({ isFavoriteDisabled: true, notice: "Favorites are full." }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Favorites are full.");
    for (const heart of screen.getAllByRole("button", { name: "Favorite", pressed: false })) {
      expect(heart).toBeDisabled();
    }
  });

  it("keeps the notice's live region mounted but empty when there is no notice", async () => {
    await renderLoaded();

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("updates the same live region when a notice appears later, so it gets announced", async () => {
    const { rerender } = render(<LatestJokes {...createLatestJokesProps()} />);
    await screen.findAllByRole("listitem");
    const region = screen.getByRole("status");

    rerender(<LatestJokes {...createLatestJokesProps({ notice: "Favorites are full." })} />);

    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Favorites are full.");
  });
});

describe("LatestJokes auto-refresh", () => {
  it("starts off, named and described by its visible label and hint", async () => {
    await renderLoaded();

    const toggle = screen.getByRole("switch", { name: "Auto-refresh" });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription(`Every ${AUTO_REFRESH_INTERVAL_MS / 1000} seconds`);
  });

  it("toggles when the visible label is clicked", async () => {
    await renderLoaded();

    await userEvent.setup().click(screen.getByText("Auto-refresh"));

    expect(screen.getByRole("switch", { name: "Auto-refresh" })).toBeChecked();
  });

  it("adds a new joke on top at every tick while the switch is on", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-01-01T12:00:00Z") });
    await renderLoaded();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    await userEvent.setup().click(screen.getByRole("switch", { name: "Auto-refresh" }));

    for (const [index, text] of ["First timer joke.", "Second timer joke."].entries()) {
      server.use(
        http.get(RANDOM_JOKE_URL, () =>
          HttpResponse.json(createRandomJokeResponse({ id: `tick-${index}`, value: text })),
        ),
      );
      vi.setSystemTime(new Date("2026-01-01T12:01:00Z").getTime() + index * 5000);
      interval.fire();
      await waitFor(() => {
        expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(text);
      });
    }

    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveTextContent("First timer joke.");
    expect(items).toHaveLength(MAX_JOKES);
  });

  it("highlights the joke that just arrived with a New badge, and only that one", async () => {
    await renderLoaded();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    server.use(
      http.get(RANDOM_JOKE_URL, () =>
        HttpResponse.json(createRandomJokeResponse({ id: "fresh", value: "Brand new joke." })),
      ),
    );
    await userEvent.setup().click(screen.getByRole("switch", { name: "Auto-refresh" }));

    interval.fire();

    await waitFor(() => {
      expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Brand new joke.");
    });
    expect(screen.getAllByText("New")).toHaveLength(1);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("New");
  });

  it("stops the timer when the switch is turned off", async () => {
    await renderLoaded();
    const interval = captureInterval(AUTO_REFRESH_INTERVAL_MS);
    const user = userEvent.setup();

    await user.click(screen.getByRole("switch", { name: "Auto-refresh" }));
    expect(interval.isRunning()).toBe(true);
    await user.click(screen.getByRole("switch", { name: "Auto-refresh" }));

    expect(interval.isRunning()).toBe(false);
  });
});
