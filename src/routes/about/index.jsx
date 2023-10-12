/** @format */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Link from "@mui/material/Link";

import logo from "../../assets/logo.svg";
import jellyfinLogo from "../../assets/jellyfinLogo.svg";

import { useQuery } from "@tanstack/react-query";

import { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";

import { version } from "../../../package.json";

import "./about.module.scss";
import { useApi } from "../../utils/store/api";

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

	return (
		<Box
			component="main"
			className="scrollY"
			sx={{
				flexGrow: 1,
				pt: 11,
				px: 3,
				pb: 3,
				position: "relative",
			}}
		>
			<Stack
				alignItems="center"
				justifyContent="center"
				className="about-sections"
			>
				<Link
					href="https://github.com/prayag17/JellyPlayer"
					className="about-logo"
				>
					<img width="100%" height="100%" src={logo} />
				</Link>
				<TableContainer
					component={Paper}
					sx={{ width: "50%", borderRadius: "15px" }}
				>
					<Table>
						<TableBody>
							<TableRow
								sx={{
									"&:last-child td, &:last-child th":
										{
											border: 0,
										},
									"&:hover": {
										background:
											"rgb(255 255 255 / 0.05)",
									},
								}}
							>
								<TableCell>
									<Typography
										variant="h4"
										fontWeight={100}
									>
										Version
									</Typography>
								</TableCell>
								<TableCell>
									<Typography
										variant="h4"
										sx={{ opacity: 0.7 }}
									>
										{version}
									</Typography>
								</TableCell>
							</TableRow>
							<TableRow
								sx={{
									"&:last-child td, &:last-child th":
										{
											border: 0,
										},
									"&:hover": {
										background:
											"rgb(255 255 255 / 0.05)",
									},
								}}
							>
								<TableCell>
									<Typography
										variant="h4"
										fontWeight={100}
									>
										Jellyfin Version
									</Typography>
								</TableCell>
								<TableCell>
									<Typography
										variant="h4"
										sx={{ opacity: 0.7 }}
									>
										{systemInfo.isSuccess &&
											systemInfo.data.Version}
									</Typography>
								</TableCell>
							</TableRow>
							<TableRow
								sx={{
									"&:last-child td, &:last-child th":
										{
											border: 0,
										},
									"&:hover": {
										background:
											"rgb(255 255 255 / 0.05)",
									},
								}}
							>
								<TableCell>
									<Typography
										variant="h4"
										fontWeight={100}
									>
										Server OS
									</Typography>
								</TableCell>
								<TableCell>
									<Typography
										variant="h4"
										sx={{ opacity: 0.7 }}
									>
										{systemInfo.isSuccess &&
											systemInfo.data
												.OperatingSystemDisplayName}
									</Typography>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Stack>
		</Box>
	);
};

export default About;
