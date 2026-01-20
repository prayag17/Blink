import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";
import {
	Box,
	Button,
	Dialog,
	Grow,
	IconButton,
	InputBase,
	LinearProgress,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { register } from "@tauri-apps/plugin-global-shortcut";
import React, {
	type ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useShallow } from "zustand/shallow";
import useDebounce from "@/utils/hooks/useDebounce";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import useSearchStore from "@/utils/store/search";
import SearchItem from "./item";

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return <Grow ref={ref} {...props} />;
});

const Search = () => {
	const theme = useTheme();
	const { isOpen, handleClose, toggleSearchDialog } = useSearchStore(
		useShallow((s) => ({
			isOpen: s.showSearchDialog,
			handleClose: s.toggleSearchDialog,
			toggleSearchDialog: s.toggleSearchDialog,
		})),
	);
	const api = useApiInContext((s) => s.api);
	const userId = useCentralStore((s) => s.currentUser?.Id || "");
	const suggestions = useQuery({
		queryKey: ["search", "suggestions"],
		queryFn: async () =>
			api &&
			(
				await getItemsApi(api).getItems({
					userId: userId,
					limit: 5,
					sortBy: [ItemSortBy.IsFavoriteOrLiked, ItemSortBy.Random],
					includeItemTypes: ["Movie", "Series", "MusicArtist"],
					enableImages: true,
					recursive: true,
				})
			).data,
	});

	const [searchTerm, setSearchTerm] = useState("");
	const debouncedSearchTerm = useDebounce(searchTerm, 300);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const searchResults = useQuery({
		queryKey: ["search", debouncedSearchTerm],
		queryFn: async () => {
			if (!api) return null;
			if (debouncedSearchTerm.trim() === "") {
				return null;
			}

			return (
				await getSearchApi(api).getSearchHints({
					searchTerm: debouncedSearchTerm,
					userId: userId,
					limit: 10,
					includeItemTypes: [
						"Movie",
						"Series",
						"MusicAlbum",
						"Person",
						"Audio",
						"Photo",
						"PhotoAlbum",
						"Playlist",
					],
					// enableImages: true,
				})
			).data;
		},
	});

	const showSuggestions = useMemo(
		() =>
			(debouncedSearchTerm.length === 0 || searchResults.isLoading) &&
			(suggestions.data?.Items?.length ?? 0) > 0,
		[
			debouncedSearchTerm.length,
			searchResults.isLoading,
			suggestions.data?.Items?.length,
		],
	);

	const navigate = useNavigate();
	const handleClearSearch = useCallback(() => {
		setSearchTerm("");
	}, []);
	const handleAdvancedSearch = useCallback(() => {
		navigate({ to: "/search", search: { query: debouncedSearchTerm } });
		toggleSearchDialog();
	}, [navigate, toggleSearchDialog, debouncedSearchTerm]);

	useEffect(() => {
		async function registerglobalShortcut() {
			await register("CommandOrControl+K", (e) => {
				if (e.state === "Pressed") {
					toggleSearchDialog();
				}
			});
		}
		registerglobalShortcut();
	}, []);

	return (
		<Dialog
			open={isOpen}
			slotProps={{
				transition: Transition,
				paper: {
					sx: {
						backgroundColor: "rgba(20, 20, 30, 0.7)",
						backdropFilter: "blur(24px) saturate(180%)",
						willChange: "opacity, transform, backdrop-filter",
						backgroundImage:
							"linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
						borderRadius: 4,
						overflow: "hidden",
					},
				},
			}}
			onClose={handleClose}
			fullWidth
			maxWidth="sm"
		>
			<Box sx={{ position: "relative" }}>
				<Stack
					direction="row"
					alignItems="center"
					spacing={1.5}
					sx={{
						p: "16px 24px",
					}}
				>
					<span
						className="material-symbols-rounded"
						style={{
							color: "var(--mui-palette-text-secondary)",
							fontSize: "1.75rem",
							opacity: 0.7,
						}}
					>
						search
					</span>
					<InputBase
						inputRef={inputRef}
						placeholder="Search movies, shows, and more..."
						onChange={handleSearchChange}
						value={searchTerm}
						fullWidth
						autoFocus
						sx={{
							fontSize: "1.25rem",
							fontWeight: 400,
							color: "text.primary",
							"& input::placeholder": {
								color: "text.disabled",
								opacity: 1,
							},
						}}
					/>
					{searchTerm && (
						<IconButton
							onClick={handleClearSearch}
							size="small"
							sx={{
								color: "text.secondary",
								bgcolor: "rgba(255,255,255,0.05)",
								"&:hover": {
									bgcolor: "rgba(255,255,255,0.15)",
								},
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{ fontSize: "1.25rem" }}
							>
								close
							</span>
						</IconButton>
					)}
				</Stack>
				{searchResults.isLoading && (
					<LinearProgress
						sx={{
							height: 2,
							backgroundColor: "transparent",
							"& .MuiLinearProgress-bar": {
								backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
							},
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
						}}
					/>
				)}
				<Box
					sx={{
						height: "1px",
						bgcolor: "divider",
						opacity: 0.1,
						mx: 2,
					}}
				/>
			</Box>

			<Stack
				spacing={1}
				sx={{
					p: 1,
					maxHeight: "55vh",
					overflowY: "auto",
					minHeight:
						showSuggestions ||
						(debouncedSearchTerm &&
							searchResults.data?.SearchHints?.length !== 0)
							? "auto"
							: "150px",
					"&::-webkit-scrollbar": {
						width: "8px",
					},
					"&::-webkit-scrollbar-thumb": {
						background: "rgba(255,255,255,0.1)",
						borderRadius: "4px",
					},
				}}
			>
				{debouncedSearchTerm.length > 0 &&
					searchResults.data?.SearchHints &&
					searchResults.data.SearchHints.length > 0 && (
						<Box>
							<Typography
								variant="caption"
								fontWeight={600}
								sx={{
									px: 2,
									py: 1.5,
									color: "text.secondary",
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									display: "block",
								}}
							>
								Results
							</Typography>
							<Stack spacing={0.5} sx={{ px: 1 }}>
								{searchResults.data.SearchHints.map((item) => (
									<SearchItem
										key={item.Id}
										itemName={item.Name || "Untitled"}
										imageUrl={
											api &&
											item.PrimaryImageTag &&
											getImageUrlsApi(api).getItemImageUrl(item, "Primary", {
												maxWidth: 90,
												maxHeight: 140,
												tag: item.PrimaryImageTag,
											})
										}
										itemYear={
											item.Type === "Series"
												? `${item.ProductionYear?.toString()} - ${new Date(item.EndDate ?? "").getFullYear().toString()}`
												: item.ProductionYear?.toString()
										}
										itemType={item.Type}
										itemId={item.Id ?? ""}
									/>
								))}
							</Stack>
						</Box>
					)}

				{showSuggestions && (
					<Box>
						<Typography
							variant="caption"
							fontWeight={600}
							sx={{
								px: 2,
								py: 1.5,
								color: "text.secondary",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
								display: "block",
							}}
						>
							Suggestions
						</Typography>
						<Stack spacing={0.5} sx={{ px: 1 }}>
							{suggestions.data?.Items?.map((item) => (
								<SearchItem
									key={item.Id}
									itemName={item.Name || "Untitled"}
									imageUrl={
										api &&
										item.ImageTags?.Primary &&
										getImageUrlsApi(api).getItemImageUrl(item, "Primary", {
											maxWidth: 90,
											maxHeight: 140,
										})
									}
									itemYear={
										item.Type === "Series"
											? `${item.ProductionYear?.toString()} - ${new Date(item.EndDate ?? "").getFullYear().toString()}`
											: item.ProductionYear?.toString()
									}
									itemType={item.Type}
									itemId={item.Id ?? ""}
								/>
							))}
						</Stack>
					</Box>
				)}

				{searchResults.isSuccess &&
					searchResults.data?.SearchHints?.length === 0 && (
						<Stack
							alignItems="center"
							justifyContent="center"
							sx={{
								height: "100%",
								minHeight: "200px",
								color: "text.secondary",
								gap: 2,
							}}
						>
							<span
								className="material-symbols-rounded"
								style={{ fontSize: "48px", opacity: 0.2 }}
							>
								search_off
							</span>
							<Typography variant="body1">
								No results found for "{debouncedSearchTerm}"
							</Typography>
						</Stack>
					)}
			</Stack>

			<Stack
				direction="row"
				justifyContent="flex-end"
				sx={{
					p: 1.5,
					mt: 1,
					backgroundImage:
						"linear-gradient(to top, rgba(0,0,0,0.2), transparent)",
				}}
			>
				<Button
					onClick={handleAdvancedSearch}
					endIcon={
						<span
							className="material-symbols-rounded"
							style={{ fontSize: "1.25rem" }}
						>
							arrow_forward
						</span>
					}
					sx={{
						color: "text.secondary",
						textTransform: "none",
						fontWeight: 500,
						padding: "6px 16px",
						borderRadius: "8px",
						"&:hover": {
							color: "primary.main",
							backgroundColor: "rgba(255,255,255,0.05)",
						},
					}}
				>
					Advanced Search
				</Button>
			</Stack>
		</Dialog>
	);
};

export default Search;
