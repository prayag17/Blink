/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showAppBar, setBackdrop } from "../../utils/slice/appBar";
import { useParams } from "react-router-dom";

import Box from "@mui/material/Box";
import useScrollTrigger from "@mui/material/useScrollTrigger";

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
