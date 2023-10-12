/** @format */
import React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MdiEmoticonDead } from "../icons/mdiEmoticonDead";

import slideBackground from "../../assets/errorbg.png";

const CarouselSlideError = ({ itemName }) => {
	return (
		<Paper className="hero-carousel-slide">
			<Stack
				justifyContent="center"
				alignItems="center"
				sx={{
					width: "100%",
					height: "100%",
					background: `url(${slideBackground})`,
					backgroundSize: "cover",
				}}
			>
				<MdiEmoticonDead
					sx={{ fontSize: "10em", opacity: "0.8" }}
				/>
				<Typography mb={2} variant="h4" sx={{ opacity: "0.5" }}>
					Error caused by
				</Typography>
				<Typography
					mt={2}
					variant="h3"
					sx={{
						background: "rgb(255 255 255 /0.1)",
						padding: 1,
						borderRadius: 3,
					}}
				>
					{itemName}
				</Typography>
			</Stack>
		</Paper>
	);
};

export default CarouselSlideError;
