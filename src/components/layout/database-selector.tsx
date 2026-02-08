"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@phosphor-icons/react";

export function DatabaseSelector() {
    const dbs = Array.from({ length: 16 }, (_, i) => i);

    return (
        <div className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" />
            <Select defaultValue="0">
                <SelectTrigger className="h-8 w-[120px] rounded-sm">
                    <SelectValue placeholder="Select Database" />
                </SelectTrigger>
                <SelectContent>
                    {dbs.map((db) => (
                        <SelectItem key={db} value={db.toString()}>
                            DB {db}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
