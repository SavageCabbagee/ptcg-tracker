type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function TextField({ label, value, onChange, required = false }: TextFieldProps) {
  return (
    <label className="field-label">
      {label}
      <input
        className="field-input"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
