import { useQuery } from "@tanstack/react-query";
import React, { useLayoutEffect } from "react";

import { Grid, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";

import { AppBarBackOnly } from "@/components/appBar/backOnly.jsx";
import { Card } from "@/components/card/card.js";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";

import { ErrorNotice } from "@/components/notices/errorNotice/errorNotice.jsx";
import "./login.scss";

import QuickConnectButton from "@/components/buttons/quickConnectButton";
import { useApiInContext } from "@/utils/store/api";
import { setBackdrop } from "@/utils/store/backdrop.js";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/login/list")({
	component: LoginPublicUsersList,
});

function LoginPublicUsersList() {
	const navigate = useNavigate();

	const api = useApiInContext((s) => s.api);

	const handleChangeServer = () => {
		navigate({ to: "/setup/server/list" });
	};
	const handleManualLogin = () => {
		navigate({ to: "/login/manual" });
	};
	const users = useQuery({
		queryKey: ["login", "public-users"],
		queryFn: async () => {
			const result = await getUserApi(api).getPublicUsers();
			return result.data;
		},
		enabled: Boolean(api),
	});

	useLayoutEffect(() => {
		setBackdrop("", "");
	}, []);
	if (users.isSuccess) {
		return (
			<>
				<AppBarBackOnly />
				<Container
					maxWidth="md"
					sx={{
						height: "100vh",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Typography variant="h3" mb={2}>
						Users
					</Typography>

					<Grid
						container
						columns={{
							xs: 2,
							sm: 3,
							md: 4,
						}}
						wrap="nowrap"
						alignItems="center"
						overflow="auto"
						width="100%"
						mb={3}
						paddingBottom={2}
						className="roundedScrollbar"
					>
						{users.data.map((item, index) => {
							return (
								<Grid
									key={item.Id}
									flexShrink={0}
									flexGrow={1}
									xs={1}
									sm={1}
									md={1}
								>
									<Card
										cardTitle={item.Name}
										item={item}
										disableOverlay
										itemType="User"
										cardType="square"
										onClick={() =>
											navigate({
												to: "/login/$userId/$userName",
												params: { userId: item.Id, userName: item.Name },
											})
										}
										overrideIcon="User"
										imageType="Primary"
									/>
								</Grid>
							);
						})}
					</Grid>

					<div className="buttons">
						<Button
							color="secondary"
							variant="contained"
							className="userEventButton"
							onClick={handleChangeServer}
						>
							Change Server
						</Button>
						<QuickConnectButton />
						<Button
							variant="contained"
							className="userEventButton"
							onClick={handleManualLogin}
							size="small"
						>
							Manual Login
						</Button>
					</div>
				</Container>
			</>
		);
	}
	if (users.isError) {
		return <ErrorNotice error="" />;
	}
}
