function WelcomeBanner({ currentUser }) {
    const hour = new Date().getHours();

    let greeting = "Welcome";

    if (hour < 12) {
        greeting = "Good Morning";
    } else if (hour < 18) {
        greeting = "Good Afternoon";
    } else {
        greeting = "Good Evening";
    }

    return (
        <div className="space-y-2">

            {/* MAIN HEADER */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {greeting},{" "}
                <span className="text-cyan-300">
                    {currentUser?.username || "there"}
                </span>
            </h1>

            {/* ACCENT LINE */}
            <div className="w-16 h-px bg-cyan-400/40" />

            {/* SUBTEXT */}
            <p className="text-zinc-400 text-sm md:text-base max-w-md leading-relaxed">
                Stay focused. Small progress compounds over time.
            </p>

        </div>
    );
}

export default WelcomeBanner;