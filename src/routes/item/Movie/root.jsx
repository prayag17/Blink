/** @format */
import { useState, useEffect } from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Divider from "@mui/material/Divider";

import { setBackdrop, showAppBar } from "../../../utils/slice/appBar";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getUserLibraryApi } from "@jellyfin/sdk/lib/utils/api/user-library-api";
import { useQuery } from "@tanstack/react-query";
import { MdiStarHalfFull } from "../../../components/icons/mdiStarHalfFull";
import { getRuntimeFull } from "../../../utils/date/time";

const ItemMovie = () => {
	const { id } = useParams();
	const dispatch = useDispatch();
	const appBarVisiblity = useSelector((state) => state.appBar.visible);
	const [scrollTarget, setScrollTarget] = useState(undefined);

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 0,
		target: scrollTarget,
	});

	useEffect(() => {
		if (!appBarVisiblity) {
			dispatch(showAppBar());
		}
		dispatch(setBackdrop(trigger));
	}, [trigger]);

	const user = useQuery({
		queryKey: ["user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

	const item = useQuery({
		queryKey: ["item,Movie", id],
		queryFn: async () => {
			const result = await getUserLibraryApi(window.api).getItem({
				userId: user.data.Id,
				itemId: id,
			});
			return result.data;
		},
		enabled: !!user.data,
	});
	if (item.isLoading) {
		return (
			<Box
				sx={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}
	if (item.isSuccess) {
		return (
			<Box
				recomponent="main"
				className="scrollY"
				sx={{
					flexGrow: 1,
					pt: 11,
					px: 3,
					pb: 3,
					position: "relative",
				}}
				f={(node) => {
					if (node) {
						setScrollTarget(node);
					}
				}}
			>
				<Box className="item-detail-header">
					<Box className="item-detail-title-name">
						<Typography variant="h4">
							{item.data.Name}
						</Typography>
					</Box>
					<Stack
						direction="row"
						gap={2}
						divider={
							<Divider
								variant="middle"
								flexItem
								orientation="vertical"
							/>
						}
						ex={{ alignItems: "center" }}
					>
						<Typography
							sx={{ flexGrow: 0 }}
							variant="subtitle1"
						>
							{item.data.ProductionYear}
						</Typography>
						<Chip
							variant="outlined"
							label={
								!!item.data.OfficialRating
									? item.data.OfficialRating
									: "Not Rated"
							}
						/>
						<Box
							sx={{
								display: "flex",
								gap: "0.25em",
								alignItems: "center",
							}}
							className="item-detail-info-rating"
						>
							{!!item.data.CommunityRating ? (
								<>
									<MdiStarHalfFull />
									<Typography variant="subtitle1">
										{Math.round(
											item.data
												.CommunityRating *
												10,
										) / 10}
									</Typography>
								</>
							) : (
								<Typography variant="subtitle1">
									No Community Rating
								</Typography>
							)}
						</Box>
						<Typography variant="subtitle1">
							{getRuntimeFull(item.data.RunTimeTicks)}
						</Typography>
					</Stack>
				</Box>
			</Box>
		);
	}
	if (item.isError) {
		return <h1>{"Something went wrong :("}</h1>;
	}
};

export default ItemMovie;
