import { useState, useEffect, useCallback } from "react";
import {
  Action,
  ActionPanel,
  Icon,
  List,
  open,
  showToast,
  Toast,
  Clipboard,
} from "@raycast/api";
// Simple debounce hook
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
import { searchBookmarks } from "./api";
import { loadRecentBookmarks, pushRecentBookmark } from "./storage";
import type { RaindropBookmark } from "./types";

export default function SearchBookmarks() {
  const [searchText, setSearchText] = useState("");
  const [bookmarks, setBookmarks] = useState<RaindropBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearchText = useDebounce(searchText, 300);

  // Load recent bookmarks on mount
  useEffect(() => {
    async function load() {
      try {
        const recent = await loadRecentBookmarks();
        setBookmarks(recent);
      } catch {
        // silently fail — empty list is fine
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Search API when debounced text changes
  useEffect(() => {
    if (!debouncedSearchText.trim()) return;

    let cancelled = false;
    setIsLoading(true);

    searchBookmarks(debouncedSearchText)
      .then((res) => {
        if (cancelled) return;
        if (res.result) {
          setBookmarks(res.items);
        } else {
          showToast({ style: Toast.Style.Failure, title: "Search failed" });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        showToast({ style: Toast.Style.Failure, title: "Error", message: String(err) });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearchText]);

  const handleSelect = useCallback(async (bookmark: RaindropBookmark) => {
    await open(bookmark.link);
    await pushRecentBookmark(bookmark);
  }, []);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Raindrop.io bookmarks…"
      throttle
      filtering={{ keepSectionOrder: true }}
    >
      {bookmarks.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No Bookmarks Found"
          description={searchText ? "Try a different search term" : "Your recent bookmarks will appear here"}
          icon={Icon.Bookmark}
        />
      ) : (
        bookmarks.map((bookmark) => (
          <List.Item
            key={bookmark._id}
            id={String(bookmark._id)}
            title={bookmark.title}
            subtitle={bookmark.domain || undefined}
            icon={
              bookmark.cover || bookmark.highLevel?.cover
                ? { source: bookmark.cover || bookmark.highLevel?.cover || "" }
                : Icon.Globe
            }
            accessories={[
              ...(bookmark.tags.length > 0
                ? [{ tag: bookmark.tags.slice(0, 2).join(", ") }]
                : []),
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open Bookmark" url={bookmark.link} />
                <Action
                  title="Copy URL"
                  icon={Icon.Clipboard}
                  onAction={() => Clipboard.copy(bookmark.link)}
                />
                <Action
                  title="Copy Title & URL"
                  icon={Icon.Clipboard}
                  onAction={() => Clipboard.copy(`${bookmark.title}\n${bookmark.link}`)}
                />
                <Action.OpenInBrowser
                  title="Open in Raindrop"
                  url={`https://app.raindrop.io/my/${bookmark._id}`}
                />
                <ActionPanel.Section title="Details">
                  <Action.CopyToClipboard
                    title="Copy Tags"
                    content={bookmark.tags.join(", ")}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
