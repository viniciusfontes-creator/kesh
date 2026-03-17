export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans antialiased text-zinc-900 dark:text-zinc-50">
            {children}
        </div>
    )
}
