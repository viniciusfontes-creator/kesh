export default function ContasLoading() {
    return (
        <div className="flex flex-col h-full w-full p-6 md:px-12 md:py-10 space-y-8 max-w-5xl mx-auto pb-40 md:pb-12 animate-pulse">
            {/* Header skeleton */}
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-muted rounded-full" />
                    <div className="h-10 w-72 bg-muted rounded-2xl" />
                </div>
                <div className="h-5 w-96 bg-muted/60 rounded-xl" />
            </header>

            {/* Tabs skeleton */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-28 bg-muted/50 rounded-2xl" />
                ))}
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-muted/30 rounded-[28px] border border-border/30" />
                ))}
            </div>
        </div>
    )
}
