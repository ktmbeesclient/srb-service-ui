export enum UserRolesEnum {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLIENT = "CLIENT",
}

export enum StatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum BooleanEnum {
  TRUE = "true",
  FALSE = "false"
}

export const StatusData = [
  { label: "Active", value: StatusEnum.ACTIVE },
  { label: "Inactive", value: StatusEnum.INACTIVE },
];
