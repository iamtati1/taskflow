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
            className={`
                w-full
                rounded-xl
                border border-white/10
                bg-black/25
                px-4
                py-3
                text-white
                placeholder-white/30
                outline-none
                transition
                focus:border-cyan-400/50
                focus:bg-black/35
                aria-[invalid=true]:border-rose-400/50
                ${className}
            `}
            {...rest}
        />
    );
}

export default Input;
