import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import React, { Suspense, useState } from "react";

import "./login.scss";

import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/_api/login/")({
	component: LoginRoute,
});

function LoginRoute() {
	const location = useLocation();
	const navigate = useNavigate();
	const api = Route.useRouteContext().api;
	const [status, setStatus] = useState("Fetching public users...");

	const usersList = useQuery({
		queryKey: ["public-users"],
		queryFn: async () => {
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});

	if (location.pathname === "/login") {
		console.log(api);
		if (usersList.isSuccess && !usersList.isFetching) {
			if (usersList.data.length > 0) {
				setStatus("Public users found!");
				navigate({ to: "/login/list" });
			} else {
				setStatus("No public users found");
				navigate({ to: "/login/manual" });
			}
		}
	}

	return (
		<Suspense fallback={<h1>Loading /login</h1>}>
			<div
				style={{
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					width: "100vw",
					height: "100vh",
				}}
			>
				<CircularProgress size={72} thickness={2} />
				<AnimatePresence mode="wait">
					<motion.div
						key={status}
						initial={{
							opacity: 0,
							transform: "translateY(10px)",
						}}
						layout
						animate={{ opacity: 1, transform: "translateY(0px)" }}
						exit={{
							opacity: 0,
							transform: "translateY(-10px)",
						}}
					>
						<Typography
							component={Markdown}
							remarkPlugins={[remarkGfm]}
							color="white"
							variant="h6"
							mt={3}
							fontWeight={350}
							textAlign="center"
						>
							{status}
						</Typography>
					</motion.div>
				</AnimatePresence>
			</div>
		</Suspense>
	);
}
