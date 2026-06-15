// lib/categories.ts
// Single source of truth for all category data.
// Web uses this. Future React Native app imports the same file.

export type Category = {
  key: string;
  label: string;
  isLive?: boolean;
};

export type ModalType = {
  key: string;
  label: string;
};

export const FEED_CATEGORIES: Category[] = [
  { key: "individual",   label: "Individual" },
  { key: "organization", label: "Company & Org" },
  { key: "nation",       label: "Nation" },
  { key: "community",    label: "Community" },
  { key: "historical",   label: "Historical" },
  { key: "live",         label: "Live", isLive: true },
];

export const SHARE_TYPES: ModalType[] = [
  { key: "individual",  label: "A person" },
  { key: "company",     label: "A company" },
  { key: "nonprofit",   label: "A nonprofit or NGO" },
  { key: "institution", label: "An institution" },
  { key: "government",  label: "A government or ministry" },
  { key: "nation",      label: "A nation" },
  { key: "community",   label: "A community" },
  { key: "movement",    label: "A movement" },
  { key: "faith",       label: "A faith community" },
  { key: "family",      label: "A family" },
  { key: "historical",  label: "A historical account" },
  { key: "live",        label: "Live — happening now" },
];