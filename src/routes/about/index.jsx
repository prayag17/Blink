import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import React, { useEffect } from "react";

import logo from "../../assets/logo.svg";

import { useQuery } from "@tanstack/react-query";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";

import { axiosClient, useApi } from "../../utils/store/api";
import { useBackdropStore } from "../../utils/store/backdrop";
import { useCentralStore } from "../../utils/store/central";
import "./about.module.scss";

const About = () => {
	const [api] = useApi((state) => [state.api]);
	const systemInfo = useQuery({
		queryKey: ["about", "systemInfo"],
		queryFn: async () => {
			const result = await getSystemApi(api).getSystemInfo();
			return result.data;
		},
		enabled: Boolean(api),
	});

	const [setBackdrop] = useBackdropStore((state) => [state.setBackdrop]);
	const [applicationVersion] = useCentralStore((state) => [
		state.clientVersion,
	]);

	useEffect(() => {
		setBackdrop("", "");
	});
	if (systemInfo.isPending) {
		return (
			<div
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<CircularProgress size={72} thickness={1.4} />
			</div>
		);
	}
	return (
		<main className="scrollY about">
			<Stack
				alignItems="center"
				justifyContent="center"
				className="about-section monospace"
				width="75%"
			>
				<a
					href="https://github.com/prayag17/JellyPlayer"
					className="about-logo"
					target="_blank"
					rel="noreferrer"
				>
					<img alt="JellyPlayer" width="100%" height="100%" src={logo} />
				</a>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						opacity: 0.9,
					}}
				>
					<div className="about-grid">
						<Typography variant="h6" fontWeight={300}>
							Server
						</Typography>
						<Typography
							variant="h6"
							fontWeight={300}
							sx={{
								opacity: 0.7,
							}}
						>
							{systemInfo.data.ServerName}
						</Typography>
					</div>

					<div className="about-grid">
						<Typography variant="h6" fontWeight={300}>
							Server Version
						</Typography>
						<Typography
							variant="h6"
							fontWeight={300}
							sx={{
								opacity: 0.7,
							}}
						>
							{systemInfo.data.Version}
						</Typography>
					</div>

					<div className="about-grid">
						<Typography variant="h6" fontWeight={300}>
							Operating System
						</Typography>
						<Typography
							variant="h6"
							fontWeight={300}
							sx={{
								opacity: 0.7,
							}}
						>
							{systemInfo.data.OperatingSystemDisplayName}
						</Typography>
					</div>

					<div className="about-grid">
						<Typography variant="h6" fontWeight={300}>
							Architecture
						</Typography>
						<Typography
							variant="h6"
							fontWeight={300}
							sx={{
								opacity: 0.7,
							}}
						>
							{systemInfo.data.SystemArchitecture}
						</Typography>
					</div>

					<div className="about-grid">
						<Typography variant="h6" fontWeight={300}>
							JellyPlayer Version
						</Typography>
						<Typography
							variant="h6"
							fontWeight={300}
							sx={{
								opacity: 0.7,
							}}
						>
							{applicationVersion}
						</Typography>
					</div>
				</div>
			</Stack>
		</main>
	);
};

export default About;
