import { showToast, Toast } from "@raycast/api";
import { searchBookmarks, getCollections, createBookmark } from "./api";

/**
 * Validate API token by making a simple API call.
 * Call this from search-bookmarks or browse-collections on first load.
 */
export async function validateToken(): Promise<boolean> {
  try {
    const res = await getCollections();
    return res.result;
  } catch {
    return false;
  }
}

/**
 * Show a toast for API errors
 */
export function showErrorToast(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  showToast({
    style: Toast.Style.Failure,
    title: "Raindrop API Error",
    message,
  });
}
