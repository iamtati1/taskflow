function Input({
    value,
    onChange,
    placeholder,
    type = "text",
    className = "",
}) {
    return (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type={type}
            className={`
                w-full
                rounded-xl
                border border-white/10
                bg-black/20
                px-4
                py-3
                text-white
                placeholder-white/30
                outline-none
                transition
                focus:border-cyan-400/40
                focus:ring-2
                focus:ring-cyan-400/10
                ${className}
            `}
        />
    );
}

export default Input;