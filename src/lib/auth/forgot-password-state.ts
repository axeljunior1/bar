export type ForgotPasswordState = {
  error: string | null;
  message: string | null;
  email: string;
};

export const forgotPasswordInitialState: ForgotPasswordState = {
  error: null,
  message: null,
  email: "",
};
