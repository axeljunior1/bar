import { cn } from "@/lib/utils/cn";
import {
  capitalizeSentence,
  capitalizeWords,
} from "@/lib/utils/text";

type CapitalizeMode = "words" | "sentence";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  capitalize?: CapitalizeMode | false;
};

function resolveCapitalize(
  capitalize: CapitalizeMode | false | undefined,
  type?: string,
): CapitalizeMode | false {
  if (capitalize === false) {
    return false;
  }

  if (capitalize) {
    return capitalize;
  }

  if (
    type === "email" ||
    type === "password" ||
    type === "number" ||
    type === "search" ||
    type === "tel" ||
    type === "url"
  ) {
    return false;
  }

  return "words";
}

function applyCapitalize(value: string, mode: CapitalizeMode): string {
  return mode === "sentence" ? capitalizeSentence(value) : capitalizeWords(value);
}

export function Input({
  label,
  error,
  className,
  id,
  capitalize,
  onChange,
  type = "text",
  autoCapitalize,
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const capitalizeMode = resolveCapitalize(capitalize, type);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (capitalizeMode && onChange) {
      const nextValue = applyCapitalize(event.target.value, capitalizeMode);

      onChange({
        ...event,
        target: { ...event.target, value: nextValue },
        currentTarget: { ...event.currentTarget, value: nextValue },
      });
      return;
    }

    if (capitalizeMode) {
      event.target.value = applyCapitalize(event.target.value, capitalizeMode);
    }

    onChange?.(event);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-muted">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        autoCapitalize={
          autoCapitalize ??
          (capitalizeMode === "sentence" ? "sentences" : capitalizeMode ? "words" : "none")
        }
        className={cn(
          "min-h-14 w-full rounded-2xl border border-border bg-white px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          error && "border-danger focus:border-danger focus:ring-red-100",
          className,
        )}
        onChange={handleChange}
        {...props}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
