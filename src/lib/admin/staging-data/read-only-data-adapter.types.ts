/**
 * G-5z-b — Read-only data adapter types (staging shell). No DB / Storage / writes.
 */

export type ReadOnlyDataProvider = "mock" | "supabase";

export interface ProfileReadModel {
  displayName: string;
  bio?: string;
  heroImageUrl?: string;
  updatedAt?: string;
}

export interface ScheduleReadModel {
  id: string;
  title: string;
  date?: string;
  time?: string;
  venueName?: string;
  description?: string;
  published: boolean;
  homeImageUrl?: string;
  sortOrder?: number;
  updatedAt?: string;
}

export interface DiscographyReadModel {
  id: string;
  title: string;
  releaseDate?: string;
  coverImageUrl?: string;
  links?: Array<{ label: string; url: string }>;
  published: boolean;
  sortOrder?: number;
  updatedAt?: string;
}

export interface LinkReadModel {
  id: string;
  label: string;
  url: string;
  sortOrder?: number;
  published: boolean;
  updatedAt?: string;
}

export interface NewsReadModel {
  id: string;
  title: string;
  body?: string;
  url?: string;
  published: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

export interface ReadOnlyDataAdapter {
  provider: ReadOnlyDataProvider;
  connectedToRuntime: boolean;
  productionReady: false;
  canWrite: false;
  getProfile(): Promise<ProfileReadModel | null>;
  listSchedules(): Promise<ScheduleReadModel[]>;
  listDiscography(): Promise<DiscographyReadModel[]>;
  listLinks(): Promise<LinkReadModel[]>;
  listNews(): Promise<NewsReadModel[]>;
}
