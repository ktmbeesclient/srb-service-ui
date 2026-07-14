
import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  client_id: string;
  client_role: string;
  exp: number;
  iat: number;
}

export const decodeAccessToken = (token: string): JwtPayload => {
  return jwtDecode<JwtPayload>(token);
};