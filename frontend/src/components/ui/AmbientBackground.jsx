// The theme-tinted light behind every screen (styles in globals.css):
// a faint grid, film grain and three slowly drifting glows in the brand
// colours. Purely decorative.
function AmbientBackground() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="app-grid" />
            <div className="app-noise" />
            <div className="ambient-light ambient-a" />
            <div className="ambient-light ambient-b" />
            <div className="ambient-light ambient-c" />
        </div>
    );
}

export default AmbientBackground;
