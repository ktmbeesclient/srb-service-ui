import {
  GetRequest,
  PostRequest,
  PutRequest,
  DeleteRequest,
} from "@/plugins/https";

export interface TransactionPayload {
  transaction_type: string;
  transaction_date: string;
  pan_no: number;
  party: string;
  invoice_no: number;
  debit_invoice_no: number;
  credit_invoice_no: number;
  amount: number;
  taxable: number;
  non_taxable: number;
  vat: number;
  vat_amount: number;
  grand_total: number;
  status: boolean;
  import: boolean;
  capital: boolean;
}

export const ApiGetActiveTransaction = ({
  page,
  page_size,
  search,
  category,
  start_date,
  end_date,
  client_id,
}: {
  page: number;
  page_size: number;
  search?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  client_id?: string;
}) => {
  const params = new URLSearchParams();

  params.append("page", String(page));
  params.append("page_size", String(page_size));

  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);
  if (client_id) params.append("client_id", client_id);

  return GetRequest(
    `/transactions/active${params.toString() ? `?${params}` : ""}`,
  );
};
export const APIGetTransactions = ({
  page,
  page_size,
  search,
  category,
  start_date,
  end_date,
  client_id,
}: {
  page: number;
  page_size: number;
  search?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  client_id?: string;
}) => {
  const params = new URLSearchParams();

  params.append("page", String(page));
  params.append("page_size", String(page_size));

  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);
  if (client_id) params.append("client_id", client_id);

  return GetRequest(`/transactions?${params.toString()}`);
};

export const ApiGetTransactionById = (id: string) => {
  return GetRequest(`/transactions/${id}`);
};

export const APIGetPartiesOrPan = (
  params: { client_id?: string; category?: string } = {},
) => {
  const query = new URLSearchParams();
  if (params.client_id) query.append("client_id", params.client_id);
  if (params.category) query.append("category", params.category);
  return GetRequest(`/transactions/party?${query.toString()}`);
};

export const ApiCreateClientTransaction = (
  clientId: string,
  data: TransactionPayload | TransactionPayload[],
) => {
  const payload = Array.isArray(data) ? data : [data];
  return PostRequest(`/clients/${clientId}/transactions`, payload);
};

export const ApiUpdateClientTransaction = (
  clientId: string,
  transactionId: string,
  data: TransactionPayload,
) => {
  return PutRequest(`/clients/${clientId}/transactions/${transactionId}`, data);
};

export const ApiDeleteTransactionById = (
  clientId: string,
  transactionId: string,
) => {
  return DeleteRequest(`/clients/${clientId}/transactions/${transactionId}`);
};
