/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAppBar, setBackdrop } from "../../utils/slice/appBar";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import Box from "@mui/material/Box";
import Grid2 from "@mui/material/Unstable_Grid2";
import useScrollTrigger from "@mui/material/useScrollTrigger";

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

	const items = useQuery({
		queryKey: ["libraryView", id],
		queryFn: () => fetchLibItems(id),
		enabled: !!user.data,
	});

	useEffect(() => {
		dispatch(setBackdrop(trigger));
	}, [trigger]);

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
					pt: 11,
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
