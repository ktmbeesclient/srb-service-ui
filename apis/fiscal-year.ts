import { DeleteRequest, GetRequest, PostRequest } from "@/plugins/https";

export const APIGetFiscalYear = () => {
    return GetRequest("/fiscal-year");
};

export const APIActiveFiscalYear = () => {
    return GetRequest("/fiscal-year/active");
};

export const APIPostFiscalYear = (data: any) => {
    return PostRequest("/fiscal-years", data);
};

export const APIDeleteFiscalYearById = (id: string) => {
    return DeleteRequest(`/fiscal-years/${id}`);
};