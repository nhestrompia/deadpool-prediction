"use client";

type AmountInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function AmountInput({
  label,
  value,
  placeholder,
  onChange,
}: AmountInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-[0.65rem] uppercase tracking-[0.3em] sm:text-xs">
        {label}
      </label>
      <input
        className="w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
