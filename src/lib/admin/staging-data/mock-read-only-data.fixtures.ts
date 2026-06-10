/**
 * G-5z-b — Mock read-only CMS fixtures (fictional / example.com only).
 */

import type {
  DiscographyReadModel,
  LinkReadModel,
  NewsReadModel,
  ProfileReadModel,
  ScheduleReadModel,
} from "./read-only-data-adapter.types";

export const MOCK_PROFILE: ProfileReadModel = {
  displayName: "Mock Artist",
  bio: "Fictional musician profile for staging shell read-only preview (G-5z-b).",
  heroImageUrl: "",
  updatedAt: "2026-06-01T10:00:00Z",
};

export const MOCK_SCHEDULES: ScheduleReadModel[] = [
  {
    id: "mock-schedule-001",
    title: "Mock Live Schedule — Spring Session",
    date: "2026-07-15",
    time: "19:00",
    venueName: "Mock Venue Hall",
    description: "Read-only preview event. Not connected to Supabase.",
    published: true,
    sortOrder: 1,
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "mock-schedule-002",
    title: "Mock Live Schedule — Album Tour",
    date: "2026-08-20",
    time: "18:30",
    venueName: "Example Concert Space",
    description: "Second mock schedule row for staging adapter scaffold.",
    published: true,
    sortOrder: 2,
    updatedAt: "2026-06-02T10:00:00Z",
  },
  {
    id: "mock-schedule-003",
    title: "Mock Live Schedule — Draft (unpublished preview)",
    date: "2026-09-10",
    venueName: "Mock Studio",
    published: false,
    sortOrder: 3,
    updatedAt: "2026-06-03T10:00:00Z",
  },
];

export const MOCK_DISCOGRAPHY: DiscographyReadModel[] = [
  {
    id: "mock-disc-001",
    title: "Mock Album — Midnight Sessions",
    releaseDate: "2025-11-01",
    coverImageUrl: "",
    links: [{ label: "Mock Store", url: "https://example.com/" }],
    published: true,
    sortOrder: 1,
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "mock-disc-002",
    title: "Mock Album — Live at Example Hall",
    releaseDate: "2026-03-15",
    published: true,
    sortOrder: 2,
    updatedAt: "2026-06-02T10:00:00Z",
  },
];

export const MOCK_LINKS: LinkReadModel[] = [
  {
    id: "mock-link-001",
    label: "Mock Link — Official Site",
    url: "https://example.com/",
    sortOrder: 1,
    published: true,
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "mock-link-002",
    label: "Mock Link — Streaming",
    url: "https://example.com/",
    sortOrder: 2,
    published: true,
    updatedAt: "2026-06-02T10:00:00Z",
  },
  {
    id: "mock-link-003",
    label: "Mock Link — Draft",
    url: "https://example.com/",
    sortOrder: 3,
    published: false,
    updatedAt: "2026-06-03T10:00:00Z",
  },
];

export const MOCK_NEWS: NewsReadModel[] = [
  {
    id: "mock-news-001",
    title: "Mock News — New release announced",
    body: "Fictional news post for read-only adapter scaffold preview.",
    url: "https://example.com/",
    published: true,
    publishedAt: "2026-05-01T12:00:00Z",
    updatedAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "mock-news-002",
    title: "Mock News — Tour dates updated",
    body: "Second mock news item. No Supabase query in G-5z-b.",
    published: true,
    publishedAt: "2026-05-15T09:00:00Z",
    updatedAt: "2026-06-02T10:00:00Z",
  },
];
