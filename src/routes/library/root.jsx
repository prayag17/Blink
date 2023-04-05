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
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { theme } from "../../theme";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getArtistsApi } from "@jellyfin/sdk/lib/utils/api/artists-api";
import { getGenresApi } from "@jellyfin/sdk/lib/utils/api/genres-api";
import { getMusicGenresApi } from "@jellyfin/sdk/lib/utils/api/music-genres-api";
import { getStudiosApi } from "@jellyfin/sdk/lib/utils/api/studios-api";
import { getPersonsApi } from "@jellyfin/sdk/lib/utils/api/persons-api";

import { Card } from "../../components/card/card";
import { EmptyNotice } from "../../components/emptyNotice/emptyNoticee";

const LibraryView = () => {
	const dispatch = useDispatch();
	const appBarVisiblity = useSelector((state) => state.appBar.visible);

	if (!appBarVisiblity) {
		dispatch(showAppBar());
	}
	const { id } = useParams();

	const user = useQuery({
		queryKey: ["libraryView", "user"],
		queryFn: async () => {
			let usr = await getUserApi(window.api).getCurrentUser();
			return usr.data;
		},
	});

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

	const [currentViewType, setCurrentViewType] = useState(undefined);
	const [viewType, setViewType] = useState([]);
	useEffect(() => {
		if (currentLib.isSuccess) {
			if (currentLib.data.Items[0].CollectionType == "movies") {
				setViewType([
					{ title: "movies", value: "Movie" },
					{ title: "collections", value: "BoxSet" },
					{ title: "actors", value: "Person" },
					{ title: "genres", value: "Genre" },
					{ title: "studios", value: "Studio" },
				]);
			} else if (currentLib.data.Items[0].CollectionType == "music") {
				setViewType([
					{ title: "albums", value: "MusicAlbum" },
					{ title: "artists", value: "MusicArtist" },
					{ title: "genres", value: "MusicGenre" },
				]);
			} else if (
				currentLib.data.Items[0].CollectionType == "tvshows"
			) {
				setViewType([
					{ title: "series", value: "Series" },
					{ title: "actors", value: "Person" },
					{ title: "genres", value: "Genre" },
					{ title: "networks", value: "Studio" },
				]);
			} else {
				setViewType([]);
			}
		}
	}, [currentLib.isSuccess]);

	const fetchLibItems = async (libraryId) => {
		console.log(libraryId);
		let result;
		if (currentViewType == "MusicArtist") {
			result = await getArtistsApi(window.api).getAlbumArtists({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "Person") {
			result = await getPersonsApi(window.api).getPersons({
				userId: user.data.Id,
				personTypes: ["Actor"],
			});
		} else if (currentViewType == "Genre") {
			result = await getGenresApi(window.api).getGenres({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "MusicGenre") {
			result = await getMusicGenresApi(window.api).getMusicGenres({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else if (currentViewType == "Studio") {
			result = await getStudiosApi(window.api).getStudios({
				userId: user.data.Id,
				parentId: libraryId,
			});
		} else {
			result = await getItemsApi(window.api).getItems({
				userId: user.data.Id,
				parentId: libraryId,
				recursive: true,
				includeItemTypes: [currentViewType],
			});
		}
		return result.data;
	};

	const items = useQuery({
		queryKey: ["libraryView", "currentLibItems", id, currentViewType],
		queryFn: () => fetchLibItems(id),
		enabled: !!user.data,
	});

	dispatch(setBackdrop(true));

	const handleCurrentViewType = (e) => {
		setCurrentViewType(e.target.value);
		console.log(e.target.value);
	};

	useEffect(() => {
		if (viewType.length != 0) setCurrentViewType(viewType[0].value);
	}, [viewType]);

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
						<Typography
							variant="h5"
							sx={{ mr: 2, flexShrink: 0 }}
							noWrap
						>
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

						{/* <InputLabel id="demo-simple-select-label">
								Age
							</InputLabel> */}
						{viewType.length != 0 && (
							<TextField
								select
								hiddenLabel
								defaultValue={viewType[0].value}
								size="small"
								variant="filled"
								fullWidth
								sx={{ ml: "75%" }}
								onChange={handleCurrentViewType}
							>
								{viewType.map((item, index) => {
									return (
										<MenuItem
											key={item.value}
											value={item.value}
										>
											{item.title}
										</MenuItem>
									);
								})}
							</TextField>
						)}
					</Toolbar>
				</AppBar>
				<Grid2 container columns={{ xs: 3, sm: 5, md: 8 }}>
					{items.isSuccess &&
						(items.data.TotalRecordCount == 0 ? (
							<EmptyNotice />
						) : (
							items.data.Items.map((item, index) => {
								return (
									<Grid2
										key={index}
										xs={1}
										sm={1}
										md={1}
									>
										<Card
											itemName={item.Name}
											itemId={item.Id}
											imageTags={
												!!item.ImageTags
													.Primary
											}
											subText={
												item.ProductionYear
											}
											iconType={item.Type}
											playedPercent={
												!!item.UserData
													? item.UserData
															.PlayedPercentage
													: 0
											}
											cardOrientation={
												item.Type ==
													"MusicArtist" ||
												item.Type ==
													"MusicAlbum" ||
												item.Type ==
													"MusicGenre"
													? "square"
													: "portait"
											}
										></Card>
									</Grid2>
								);
							})
						))}
				</Grid2>
			</Box>
		</Box>
	);
};

export default LibraryView;
