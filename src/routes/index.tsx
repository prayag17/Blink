import {
	type ServerInfo,
	getAllServers,
	getDefaultServer,
	getServer,
} from "@/utils/storage/servers";
import { UserStore, delUser, getUser } from "@/utils/storage/user";
import { useApiInContext } from "@/utils/store/api";
import { setAppReady, useCentralStore } from "@/utils/store/central";
import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import {
	Button,
	ButtonGroup,
	CircularProgress,
	Typography,
} from "@mui/material";
import {
	Outlet,
	createFileRoute,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type LoaderData = {
	serversOnDisk: ServerInfo[];
	currentServer: ServerInfo | undefined;
	userOnDisk: { Name: string; AccessToken: string } | null;
};

export const Route = createFileRoute("/")({
	errorComponent: (error) => {
		console.error(error.error);
	},
	beforeLoad: async ({ context, navigate }) => {
		const currentServerId = await getDefaultServer();
		const currentServer = await getServer(currentServerId);
		const userOnDisk = await getUser();
		if (currentServerId) {
			context.createApi(currentServer?.address, undefined);
			if (userOnDisk) {
				context.createApi(currentServer?.address, userOnDisk.AccessToken);
				throw redirect({ to: "/home/" });
			}
			throw redirect({ to: "/login/" });
		}

		throw redirect({ to: "/setup/server/add" });
	},
});