import { cn } from "@/lib/utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand-600 text-white active:bg-brand-700",
  secondary: "bg-surface-muted text-foreground active:bg-neutral-200",
  danger: "bg-danger text-white active:bg-red-700",
  ghost: "bg-transparent text-brand-600 active:bg-brand-50",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  md: "min-h-12 px-4 text-base",
  lg: "min-h-14 px-6 text-lg font-semibold",
};

export function Button({
  className,
  variant = "primary",
  size = "lg",
  fullWidth = true,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl transition-colors disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
