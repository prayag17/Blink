/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	showAppBar,
	setBackdrop,
	showBackButton,
} from "../../utils/slice/appBar";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import { theme } from "../../theme";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

import { Card } from "../../components/card/card";

const LibraryView = () => {
	const dispatch = useDispatch();
	const appBarVisiblity = useSelector((state) => state.appBar.visible);

	if (!appBarVisiblity) {
		dispatch(showAppBar());
	}
	const { id } = useParams();
	const [scrollTarget, setScrollTarget] = useState(undefined);

	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 0,
		target: scrollTarget,
	});

	const user = useQuery({
		queryKey: ["libraryView", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

	const fetchLibItems = async (libraryId) => {
		console.log(libraryId);
		const result = await getItemsApi(window.api).getItems({
			userId: user.data.Id,
			parentId: libraryId,
		});
		return result.data;
	};

	const fetchLib = async (libraryId) => {
		const result = await getItemsApi(window.api).getItems({
			userId: user.data.Id,
			ids: [libraryId],
		});
		return result.data;
	};

	const currentLib = useQuery({
		queryKey: ["libraryView", "currentLib", id],
		queryFn: () => fetchLib(id),
		enabled: !!user.data,
	});

	if (currentLib.isSuccess) {
		// console.log(currentLib.data.)
		dispatch(showBackButton());
	}

	const items = useQuery({
		queryKey: ["libraryView", "currentLibItems", id],
		queryFn: () => fetchLibItems(id),
		enabled: !!user.data,
	});

	useEffect(() => {
		dispatch(setBackdrop(true));
	}, [trigger]);

	// if (currentLib.isLoading || items.isLoading) {
	// 	return <h1>Loading...</h1>;
	// }

	return (
		<Box
			sx={{
				display: "flex",
			}}
		>
			<Box
				component="main"
				className="scrollY"
				sx={{
					flexGrow: 1,
					pt: 19,
					px: 3,
					pb: 3,
					position: "relative",
				}}
				ref={(node) => {
					if (node) {
						setScrollTarget(node);
					}
				}}
			>
				<AppBar
					position="fixed"
					elevation={0}
					sx={{
						width: `calc(100vw - ${theme.spacing(7)} - 10px)`,
						mt: 8,
					}}
				>
					<Divider />
					<Toolbar>
						<Typography variant="h5" sx={{ mr: 2 }}>
							{currentLib.isLoading ? (
								<CircularProgress sx={{ p: 1 }} />
							) : (
								currentLib.data.Items[0].Name
							)}
						</Typography>
						<Chip
							label={
								items.isLoading ? (
									<CircularProgress sx={{ p: 1 }} />
								) : (
									items.data.TotalRecordCount
								)
							}
						/>
					</Toolbar>
				</AppBar>
				<Grid2 container columns={{ xs: 3, sm: 5, md: 8 }}>
					{items.isSuccess &&
						items.data.Items.map((item, index) => {
							return (
								<Grid2 key={index} xs={1} sm={1} md={1}>
									<Card
										itemName={item.Name}
										itemId={item.Id}
										imageTags={!!item.ImageTags}
										subText={item.ProductionYear}
										iconType={item.Type}
										playedPercent={
											item.UserData
												.PlayedPercentage
										}
										cardOrientation={
											item.Type ==
											"MusicArtist"
												? "square"
												: "portait"
										}
									></Card>
								</Grid2>
							);
						})}
				</Grid2>
			</Box>
		</Box>
	);
};

export default LibraryView;
