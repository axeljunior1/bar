export type CreateBarFormState = {
  error: string | null;
  message: string | null;
  fields: {
    barName: string;
    ownerEmail: string;
    ownerName: string;
  };
  formKey: number;
};

export const createBarInitialState: CreateBarFormState = {
  error: null,
  message: null,
  fields: {
    barName: "",
    ownerEmail: "",
    ownerName: "",
  },
  formKey: 0,
};

export function readCreateBarFormFields(formData: FormData) {
  return {
    barName: String(formData.get("barName") ?? ""),
    ownerEmail: String(formData.get("ownerEmail") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
  };
}

export function createBarFormErrorState(
  prev: CreateBarFormState | undefined,
  formData: FormData,
  error: string,
): CreateBarFormState {
  const base = prev ?? createBarInitialState;

  return {
    error,
    message: null,
    fields: readCreateBarFormFields(formData),
    formKey: base.formKey + 1,
  };
}
