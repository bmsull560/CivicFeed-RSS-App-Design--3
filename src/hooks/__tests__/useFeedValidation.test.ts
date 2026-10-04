// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

vi.mock("../../providers/trpc", () => ({
  trpc: {
    feeds: {
      getValidationStatus: {
        useQuery: vi.fn(),
      },
    },
  },
}));

import { useFeedValidation } from "../useFeedValidation";
import type { FeedValidationStatus } from "../useFeedValidation";
import { trpc } from "../../providers/trpc";

type UseQueryResult = { error: Error | null; data: { statuses: { feedId: string; lastStatus: FeedValidationStatus }[] } | undefined };
type UseQueryMock = ReturnType<typeof vi.fn> & { mockReturnValue: (v: UseQueryResult) => void };
const useQueryMock = trpc.feeds.getValidationStatus.useQuery as unknown as UseQueryMock;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface HookHandle<T> {
  result: { current: T };
  rerender: () => void;
  unmount: () => void;
}

function renderHook<T>(hook: () => T): HookHandle<T> {
  const result = { current: undefined as unknown as T };
  function Probe(): null {
    result.current = hook();
    return null;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(createElement(Probe));
  });
  return {
    result,
    rerender: () => {
      act(() => {
        root.render(createElement(Probe));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("useFeedValidation", () => {
  let handle: HookHandle<Map<string, FeedValidationStatus>> | null = null;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    handle?.unmount();
    handle = null;
    warnSpy.mockRestore();
  });

  it("returns an empty map and warns exactly once per error transition when the backend is unreachable", () => {
    useQueryMock.mockReturnValue({ error: new Error("backend down"), data: undefined });

    handle = renderHook(() => useFeedValidation());
    expect(handle.result.current.size).toBe(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    // Re-renders with the same error must not warn again.
    handle.rerender();
    handle.rerender();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(handle.result.current.size).toBe(0);
  });

  it("maps validation statuses when the query succeeds", () => {
    useQueryMock.mockReturnValue({
      error: null,
      data: {
        statuses: [
          { feedId: "f1", lastStatus: "working" },
          { feedId: "f2", lastStatus: "dead" },
        ],
      },
    });

    handle = renderHook(() => useFeedValidation());
    expect(handle.result.current.get("f1")).toBe("working");
    expect(handle.result.current.get("f2")).toBe("dead");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
