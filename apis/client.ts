import {
  DeleteRequest,
  GetRequest,
  PostRequest,
  PutRequest,
} from "@/plugins/https";

export const ApiGetAllclient = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  period_name?: string;
}) => {
  const query = new URLSearchParams();

  if (params?.page) query.append("page", String(params.page));
  if (params?.pageSize) query.append("page_size", String(params.pageSize));
  if (params?.search) query.append("search", params.search);
  if (params?.period_name) query.append("period_name", params.period_name);

  const qs = query.toString();

  return GetRequest(`/clients${qs ? `?${qs}` : ""}`);
};

export const ApiGetClientById = (id: string) => {
  return GetRequest(`/clients/${id}`);
};

export const ApiGetClientBySlug = (slug: string) => {
  return GetRequest(`/clients/slug/${slug}`);
};

export const ApiGetActiveClient = () => {
  return GetRequest("/clients/active");
};

export const ApiCreateClient = (data: any) => {
  return PostRequest("/clients", data);
};

export const ApiUpdateClientById = (id: string, data: any) => {
  return PutRequest(`/clients/${id}`, data);
};

export const ApiDeleteClientById = (id: string) => {
  return DeleteRequest(`/clients/${id}`);
};