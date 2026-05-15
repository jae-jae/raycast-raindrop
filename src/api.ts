import { getPreferenceValues } from "@raycast/api";
import type {
  Preferences,
  SearchResponse,
  CollectionsResponse,
  CreateBookmarkRequest,
  CreateBookmarkResponse,
  RaindropBookmark,
} from "./types";

const BASE_URL = "https://api.raindrop.io/rest/v1";

function getToken(): string {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.apiToken;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const url = `${BASE_URL}${endpoint}`;

  console.log(`[raindrop] ${options?.method || "GET"} ${url}`);

  const response = await fetch(url, {
    redirect: "follow",
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Raindrop API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as T;
  console.log(`[raindrop] response ok, items: ${JSON.stringify((data as Record<string, unknown>).items ? ((data as Record<string, unknown>).items as unknown[]).length : "n/a")}`);
  return data;
}

/** Search bookmarks across all collections */
export async function searchBookmarks(keyword: string): Promise<SearchResponse> {
  return request<SearchResponse>(
    `/raindrops/0?sort=score&search=${keyword.replace(/ /g, "%20")}`,
  );
}

/** Get all raindrops in a specific collection */
export async function getCollectionRaindrops(
  collectionId: number,
  page = 0,
): Promise<SearchResponse> {
  return request<SearchResponse>(
    `/raindrops/${collectionId}?sort=-lastUpdate&perpage=50&page=${page}`,
  );
}

/** Get all root collections (plus smart collections) */
export async function getCollections(): Promise<CollectionsResponse> {
  return request<CollectionsResponse>("/collections");
}

/** Get child collections for a parent */
export async function getChildCollections(parentId: number): Promise<CollectionsResponse> {
  return request<CollectionsResponse>(`/collections/childrens/${parentId}`);
}

/** Create a new bookmark */
export async function createBookmark(
  data: CreateBookmarkRequest,
): Promise<CreateBookmarkResponse> {
  return request<CreateBookmarkResponse>("/raindrop", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Get a single bookmark */
export async function getBookmark(id: number): Promise<{ result: boolean; item: RaindropBookmark }> {
  return request<{ result: boolean; item: RaindropBookmark }>(`/raindrop/${id}`);
}

/** Remove a bookmark */
export async function removeBookmark(id: number): Promise<{ result: boolean }> {
  return request<{ result: boolean }>(`/raindrop/${id}`, {
    method: "DELETE",
  });
}
