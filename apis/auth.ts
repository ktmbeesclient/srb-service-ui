import { PostRequest } from "@/plugins/https";

export type Login =
  | { pan_number: number; password: string; name?: never }
  | { name: string; password: string; pan_number?: never };

export const ApiLogin = (data: Login) => PostRequest("/login", data);

export const ApiRefreshToken = (refresh_token: string) => {
  return PostRequest("/refresh", { refresh_token });
};

export const ApiLogout = (refresh_token: string) => {
  return PostRequest("/logout", { refresh_token });
};