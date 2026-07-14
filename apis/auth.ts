import { PostRequest } from "@/plugins/https";
export interface Login {
  pan_number: number;
  password: string;
}
export const ApiLogin = (data: Login) => PostRequest("/login", data);

export const ApiRefreshToken = (refresh_token: string) =>{
 return  PostRequest("/refresh", { refresh_token }); 
}
 

export const ApiLogout = (refresh_token: string) => {
  return PostRequest("/logout", { refresh_token });
}