/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAppBar, setBackdrop } from "../../utils/slice/appBar";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import Box from "@mui/material/Box";
import useScrollTrigger from "@mui/material/useScrollTrigger";

import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";

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
			ids: [libraryId],
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
				{id}
			</Box>
		</Box>
	);
};

export default LibraryView;
