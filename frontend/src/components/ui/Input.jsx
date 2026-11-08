import { fieldClass } from "./Field";

// A text field in the app's style. Other props (id, name, aria-*,
// autoComplete, required) pass through to the input.
function Input({
    value,
    onChange,
    placeholder,
    type = "text",
    className = "",
    maxLength,
    ...rest
}) {
    return (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type={type}
            maxLength={maxLength}
            className={`${fieldClass} ${className}`}
            {...rest}
        />
    );
}

export default Input;
