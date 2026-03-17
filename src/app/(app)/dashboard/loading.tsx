export default function DashboardLoading() {
    return (
        <div className="flex flex-col h-full w-full p-6 md:px-12 md:py-10 space-y-12 max-w-[1600px] mx-auto pb-40 md:pb-12 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-8 bg-muted rounded-full" />
                    <div className="h-10 w-56 bg-muted rounded-2xl" />
                </div>
                <div className="h-5 w-80 bg-muted/60 rounded-xl" />
            </div>

            {/* KPI cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted/30 rounded-[28px] border border-border/30" />
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[420px] bg-muted/20 rounded-[32px] border border-border/30" />
                <div className="h-[420px] bg-muted/20 rounded-[32px] border border-border/30" />
            </div>
        </div>
    )
}
