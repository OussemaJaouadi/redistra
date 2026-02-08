export default function KeysPage() {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold">Redis Keys</h1>
                <p className="text-muted-foreground">Browse and manage Redis keys</p>
            </div>
            
            <div className="border rounded-sm bg-card">
                <div className="p-8 text-center text-muted-foreground">
                    <p>Key browser coming soon...</p>
                    <p className="text-sm mt-2">Select a connection first to browse Redis keys</p>
                </div>
            </div>
        </div>
    )
}
