export const BrandDTO = {
  receiveBrandOption: (data: any) => {
    return {
      label: data?.brandName,
      value: data?.id,
    };
  },
};
