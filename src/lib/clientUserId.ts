const GUEST_ID_KEY = "unique_id";

const isObjectIdLike = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

export const getOrCreateGuestId = (): string => {
  if (typeof window === "undefined") return "";
  let guestId = window.localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    window.localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
};

export const resolveClientUserId = (authenticatedUserId?: string | null): string => {
  if (authenticatedUserId && isObjectIdLike(authenticatedUserId)) {
    return authenticatedUserId;
  }
  return getOrCreateGuestId();
};
