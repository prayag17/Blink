import {
	Avatar,
	Divider,
	IconButton,
	ListItemIcon,
	Menu,
	MenuItem,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import React, {
	type MouseEventHandler,
	useCallback,
	useMemo,
	useState,
} from "react";
import { delUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import {
	setSettingsDialogOpen,
	setSettingsTabValue,
} from "@/utils/store/settings";

export const UserAvatarMenu = () => {
	const api = useApiInContext((s) => s.api);
	const createApi = useApiInContext((s) => s.createApi);
	const [user, resetCurrentUser] = useCentralStore((s) => [
		s.currentUser,
		s.resetCurrentUser,
	]);
	const navigate = useNavigate();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
	const openMenu = Boolean(anchorEl);

	const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = useCallback(
		(event) => {
			setAnchorEl(event.currentTarget);
		},
		[],
	);

	const handleMenuClose = useCallback(() => {
		setAnchorEl(null);
	}, []);

	const handleLogout = useCallback(async () => {
		console.log("Logging out user...");
		await api?.logout();
		createApi(api?.basePath ?? "", undefined);
		resetCurrentUser();
		delUser();
		sessionStorage.removeItem("accessToken");
		queryClient.clear();
		await router.invalidate();
		setAnchorEl(null);
		navigate({ to: "/login", replace: true });
	}, [api, createApi, navigate, queryClient, resetCurrentUser, router]);

	const menuButtonSx = useMemo(() => ({ p: 0 }), []);
	const menuStyle = useMemo(() => ({ mt: 2 }), []);

	return (
		<div>
			<IconButton sx={menuButtonSx} onClick={handleMenuOpen}>
				{!!user?.Id &&
					(user?.PrimaryImageTag === undefined ? (
						<Avatar className="appBar-avatar" alt={user?.Name ?? "image"}>
							<span className="material-symbols-rounded appBar-avatar-icon">
								account_circle
							</span>
						</Avatar>
					) : (
						<Avatar
							className="appBar-avatar"
							src={`${api?.basePath}/Users/${user?.Id}/Images/Primary`}
							alt={user?.Name ?? "image"}
						>
							<span className="material-symbols-rounded appBar-avatar-icon">
								account_circle
							</span>
						</Avatar>
					))}
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={openMenu}
				onClose={handleMenuClose}
				sx={menuStyle}
				disableScrollLock
				PaperProps={{ className: "glass" }}
			>
				<MenuItem
					onClick={() => {
						handleLogout();
						handleMenuClose();
					}}
				>
					<ListItemIcon>
						<span className="material-symbols-rounded">logout</span>
					</ListItemIcon>
					Logout
				</MenuItem>
				<Divider />
				<MenuItem
					onClick={() => {
						setSettingsDialogOpen(true);
						setSettingsTabValue(1);
						handleMenuClose();
					}}
				>
					<ListItemIcon>
						<span className="material-symbols-rounded">settings</span>
					</ListItemIcon>
					Settings
				</MenuItem>
				<MenuItem
					onClick={() => {
						navigate({ to: "/settings/preferences" });
						handleMenuClose();
					}}
				>
					<ListItemIcon>
						<span className="material-symbols-rounded">tune</span>
					</ListItemIcon>
					Preferences
				</MenuItem>
				<MenuItem
					onClick={() => {
						navigate({ to: "/settings/about" });
						handleMenuClose();
					}}
				>
					<ListItemIcon>
						<span className="material-symbols-rounded">info</span>
					</ListItemIcon>
					About
				</MenuItem>
			</Menu>
		</div>
	);
};
