import { ConnectionSubHeader } from "@/components/layout/connection-sub-header";
import { ConnectionDbRail } from "@/components/layout/connection-db-rail";

export default async function ConnectionLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ connectionId: string }>;
}) {
    const { connectionId } = await params

    return (
        <div className="flex flex-col min-h-full -m-4">
            <ConnectionSubHeader connectionId={connectionId} />
            <div className="flex flex-1">
                <div className="flex-1 p-4">
                    {children}
                </div>
                <div className="sticky top-0 self-start">
                    <ConnectionDbRail connectionId={connectionId} />
                </div>
            </div>
        </div>
    );
}
