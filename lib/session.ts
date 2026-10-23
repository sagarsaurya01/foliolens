import { cookies } from "next/headers";
import { getUser } from "./data";

const COOKIE = "fl_uid";
export const currentUserId = (): string | null => cookies().get(COOKIE)?.value ?? null;
export const currentUser = () => {
  const id = currentUserId();
  return id ? getUser(id) : null;
};
export const setCurrentUser = (id: string) =>
  cookies().set(COOKIE, id, { httpOnly: true, path: "/", sameSite: "lax" });
export const clearCurrentUser = () => cookies().delete(COOKIE);
