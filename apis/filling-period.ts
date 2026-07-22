import { DeleteRequest, GetRequest, PostRequest } from "@/plugins/https";

export const APIGetFillingPeriod = () => {
    return GetRequest("/filling-period");
};

export const APIPostFillingPeriod = (data: any) => {
    return PostRequest("/filling-periods", data);
};

export const APIActiveFillingPeriod = () => {
    return GetRequest("/filling-period/active");
};

export const APIDeleteFillingPeriodById = (id: string) => {
    return DeleteRequest(`/filling-periods/${id}`);
};