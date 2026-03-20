import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, ...inputProps }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} ref={ref} {...inputProps} />
        {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
      </div>
    );
  },
);
FormField.displayName = "FormField";
