import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import useSearchStore from "@/utils/store/search";
import { getTypeIcon } from "../utils/iconsCollection";
import { getItemLinkOptions } from "@/utils/navigation/itemLink";

type SearchItemProps = {
	itemName: string;
	imageUrl?: string | null;
	itemYear?: string;
	itemType?: BaseItemKind;
	itemId: string;
};

const SearchItem = (props: SearchItemProps) => {
	const { itemName, imageUrl, itemYear, itemType, itemId } = props;
	const toggleSearchDialog = useSearchStore(
		useShallow((s) => s.toggleSearchDialog),
	);
	const navigate = useNavigate();
	const handleOnClick = () => {
		toggleSearchDialog();
		navigate(getItemLinkOptions(itemId, itemType));
	};

	return (
		<Button
			onClick={handleOnClick}
			fullWidth
			sx={{
				justifyContent: "flex-start",
				textAlign: "left",
				p: 1,
				borderRadius: 2,
				textTransform: "none",
				color: "text.primary",
				"&:hover": {
					bgcolor: "action.hover",
				},
			}}
		>
			<Box
				sx={{
					width: 50,
					height: 75,
					mr: 2,
					borderRadius: 1,
					overflow: "hidden",
					bgcolor: "action.selected",
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{imageUrl ? (
					<Box
						component="img"
						src={imageUrl}
						alt={itemName}
						sx={{
							height: "100%",
							width: "100%",
							objectFit: "cover",
						}}
					/>
				) : (
					<span
						className="material-symbols-rounded"
						style={{
							fontSize: "2rem",
							color: "var(--mui-palette-text-secondary)",
						}}
					>
						{getTypeIcon(itemType ?? "unknown")}
					</span>
				)}
			</Box>
			<Stack sx={{ minWidth: 0, flex: 1 }}>
				<Typography
					variant="body1"
					noWrap
					sx={{
						fontWeight: 500,
					}}
				>
					{itemName}
				</Typography>
				<Stack
					direction="row"
					spacing={1}
					sx={{
						alignItems: "center",
					}}
				>
					{itemYear && (
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
							}}
						>
							{itemYear}
						</Typography>
					)}
					{itemYear && itemType && (
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
							}}
						>
							•
						</Typography>
					)}
					{itemType && (
						<Typography
							variant="caption"
							sx={{
								color: "text.secondary",
							}}
						>
							{itemType}
						</Typography>
					)}
				</Stack>
			</Stack>
		</Button>
	);
};

export default SearchItem;
