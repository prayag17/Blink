import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { Divider, Drawer, List, ListItem, ListItemButton } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import ListItemLink from "../listItemLink";
import { getTypeIcon } from "../utils/iconsCollection";

interface NavigationDrawerProps {
    open: boolean;
    onClose: () => void;
}

export const NavigationDrawer = ({ open, onClose }: NavigationDrawerProps) => {
    const api = useApiInContext((s) => s.api);
    const [user] = useCentralStore((s) => [s.currentUser]);

    const libraries = useQuery({
        queryKey: ["libraries"],
        queryFn: async () => {
            if (!user?.Id || !api?.accessToken) {
                return;
            }
            const libs = await getUserViewsApi(api).getUserViews({
                userId: user.Id,
            });
            return libs.data;
        },
        enabled: !!user?.Id && !!api?.accessToken,
        networkMode: "always",
    });

    const drawerPaperProps = useMemo(() => {
        return {
            className: "glass library-drawer",
            elevation: 6,
        };
    }, []);

    return (
        <Drawer
            open={open}
            slotProps={{ paper: drawerPaperProps }}
            className="library-drawer"
            onClose={onClose}
        >
            <List>
                <ListItem>
                    <ListItemButton onClick={onClose}>
                        <span className="material-symbols-rounded">menu_open</span>
                        <div style={{ marginLeft: "8px" }}>Close</div>
                    </ListItemButton>
                </ListItem>
            </List>
            <Divider variant="middle" />
            <List>
                <ListItemLink
                    className="library-drawer-item"
                    to="/home"
                    icon="home"
                    primary="Home"
                    onClick={onClose}
                />
                {libraries.isSuccess &&
                    libraries.data?.Items?.map((library) => (
                        <ListItemLink
                            className="library-drawer-item"
                            key={library.Id}
                            to="/library/$id"
                            params={{ id: library.Id ?? "" }}
                            icon={
                                library.CollectionType &&
                                getTypeIcon(library.CollectionType)
                            }
                            primary={library.Name ?? "Library"}
                            onClick={onClose}
                        />
                    ))}
            </List>
            <Divider variant="middle" />
            <List>
                <ListItemLink
                    to="/settings/preferences"
                    icon="settings"
                    primary="Settings"
                    className="library-drawer-item"
                    onClick={onClose}
                />
                <ListItemLink
                    to="/settings/changeServer"
                    icon="dns"
                    primary="Change Server"
                    className="library-drawer-item"
                    onClick={onClose}
                />
                <ListItemLink
                    to="/settings/about"
                    icon="info"
                    primary="About"
                    className="library-drawer-item"
                    onClick={onClose}
                />
            </List>
        </Drawer>
    );
};
