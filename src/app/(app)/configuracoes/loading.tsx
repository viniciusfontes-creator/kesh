export default function ConfiguracoesLoading() {
    return (
        <div className="flex flex-col h-full w-full p-6 md:px-12 md:py-10 space-y-10 max-w-5xl mx-auto pb-40 md:pb-12 animate-pulse">
            {/* Header skeleton */}
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-muted rounded-full" />
                    <div className="h-10 w-40 bg-muted rounded-2xl" />
                </div>
                <div className="h-5 w-80 bg-muted/60 rounded-xl" />
            </header>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                    <div key={i} className="h-56 bg-muted/30 rounded-[32px] border border-border/30" />
                ))}
                <div className="h-48 bg-muted/20 rounded-[32px] border border-border/30 md:col-span-2" />
                <div className="h-48 bg-muted/20 rounded-[32px] border border-border/30 md:col-span-2" />
            </div>
        </div>
    )
}
