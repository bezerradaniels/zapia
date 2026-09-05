export { useCustomers } from "./hooks/useCustomers";
export { useCustomer, useCustomerOrders } from "./hooks/useCustomer";
export {
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useAnonymizeCustomer,
  useDeleteAllCustomers,
} from "./hooks/useCustomerMutations";
export {
  deleteCustomer,
  anonymizeCustomer,
  deleteAllCustomers,
} from "./api/mutations";
export type { Customer, CustomerSocialLink } from "./types";
export type { CustomerInput } from "./api/mutations";
export type { CustomerFormValues } from "./schemas/customerSchema";
