import { House, Users, Gear, ListBullets } from "@phosphor-icons/react";

export const navItems = [
    {
        title: "Home",
        url: "/",
        icon: House,
    },
    {
        title: "Users",
        url: "/users",
        icon: Users,
        role: "admin",
    },
    {
        title: "Audit Log",
        url: "/audit",
        icon: ListBullets,
        role: "admin",
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Gear,
    },
];
