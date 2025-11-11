import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import "./libraryItemsGrid.scss";
import { useShallow } from "zustand/shallow";
import { getLibraryQueryOptions } from "@/utils/queries/library";
import { getLibraryItemsQueryOptions } from "@/utils/queries/libraryItems";
import { useApiInContext } from "@/utils/store/api";
import { useBackdropStore } from "@/utils/store/backdrop";
import { useCentralStore } from "@/utils/store/central";
import { useLibraryStateStore } from "@/utils/store/libraryState";
import { Card } from "../card/card";

const libraryRoute = getRouteApi("/_api/library/$id");

/**
 * Virtualized library items grid.
 * Virtualizes vertical scrolling only; items are arranged into responsive columns.
 * Assumptions:
 *  - Card aspect ratio handled by CSS; we approximate a fixed height for virtualization.
 *  - Width changes trigger re-measure via ResizeObserver.
 * Future improvements:
 *  - Dynamic row height based on item type.
 *  - Horizontal virtualization for extremely wide displays.
 */
const LibraryItemsGrid = () => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const { id: currentLibraryId } = libraryRoute.useParams();
	const {
		currentViewType,
		sortAscending,
		sortBy,
		filters,
		videoTypesState,
		nameStartsWith,
		genreIds,
	} = useLibraryStateStore(
		useShallow((s) => {
			const slice = s.libraries[currentLibraryId || ""];
			return {
				currentViewType: slice?.currentViewType,
				sortAscending: slice?.sortAscending ?? true,
				sortBy: slice?.sortBy ?? "Name",
				filters: slice?.filters,
				videoTypesState: slice?.videoTypesState,
				nameStartsWith: slice?.nameStartsWith,
				genreIds: slice?.genreIds,
			};
		}),
	);
	const updateLibrary = useLibraryStateStore((s) => s.updateLibrary);
	const currentLibrary = useSuspenseQuery(
		getLibraryQueryOptions(api, user?.Id, currentLibraryId),
	);
	const items = useSuspenseQuery(
		getLibraryItemsQueryOptions(api, user?.Id, currentLibraryId, {
			currentViewType,
			sortAscending,
			sortBy,
			filters,
			videoTypesState,
			nameStartsWith,
			genreIds,
			collectionType: currentLibrary.data.CollectionType as any,
		}),
	);
	// --- Backdrop ---
	const setBackdrop = useBackdropStore(useShallow((s) => s.setBackdrop));
	const backdropIndexRef = useRef(0);
	const backdropItems = useMemo<BaseItemDto[]>(() => {
		if (!items.isSuccess || !items.data?.Items) return [];
		return items.data.Items.filter(
			(item) => Object.keys(item.ImageBlurHashes?.Backdrop ?? {}).length > 0,
		);
	}, [items.isSuccess, items.data?.Items]);
	useEffect(() => {
		if (!api || !backdropItems || backdropItems.length === 0) return;
		// Set initial backdrop once when items change
		const firstBackdrop = backdropItems[0];
		const firstKey = Object.keys(
			firstBackdrop?.ImageBlurHashes?.Backdrop ?? {},
		)[0];
		const initialHash = firstBackdrop?.ImageBlurHashes?.Backdrop?.[firstKey];
		if (initialHash) setBackdrop(initialHash);
		backdropIndexRef.current = 0;

		const intervalId = setInterval(() => {
			backdropIndexRef.current =
				(backdropIndexRef.current + 1) % backdropItems.length;
			const idx = backdropIndexRef.current;
			const keys = Object.keys(
				backdropItems[idx]?.ImageBlurHashes?.Backdrop ?? {},
			);
			const nextHash = backdropItems[idx]?.ImageBlurHashes?.Backdrop?.[keys[0]];
			if (nextHash) {
				// Defer backdrop update to idle/raf to avoid blocking UI
				const schedule =
					(window as any).requestIdleCallback || window.requestAnimationFrame;
				schedule(() => setBackdrop(nextHash));
			}
		}, 10_000); // Update backdrop every 10s
		return () => clearInterval(intervalId);
	}, [api, backdropItems, setBackdrop]);
	// --- Virtualization setup ---
	const parentRef = useRef<HTMLDivElement | null>(null);
	const scrollParentRef = useRef<HTMLElement | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>(0);

	// Determine column count based on container width (simple heuristic)
	const [columns, setColumns] = useState(1);
	const measureColumns = useCallback(() => {
		if (!parentRef.current) return;
		const width = parentRef.current.clientWidth;
		setContainerWidth(width);
		// Base desired approximate card width (including gap) 180px
		const ideal = Math.max(1, Math.floor(width / 180));
		setColumns(ideal);
	}, []);

	useEffect(() => {
		measureColumns();
		if (!parentRef.current) return;
		// Find the page's scroll container ('.scrollY') to avoid nested scrolling
		scrollParentRef.current = parentRef.current.closest(
			".scrollY",
		) as HTMLElement | null;
		const ro = new ResizeObserver(() => measureColumns());
		ro.observe(parentRef.current);
		return () => ro.disconnect();
	}, [measureColumns]);

	const itemCount = items.data?.Items?.length ?? 0;
	// Compute number of virtual rows
	const rowCount = Math.ceil(itemCount / columns);

	// Estimated row height (depends on card type). Using 260px as base (portrait taller)
	// Compute card width minus gaps
	const cardGap = 16; // px gap between cards
	const cardWidth = useMemo(() => {
		if (columns <= 0) return 180;
		const totalGap = (columns - 1) * cardGap;
		return Math.floor((containerWidth - totalGap) / columns);
	}, [columns, containerWidth]);

	// Approximate tallest card height (portrait ratio ~ 2:3 => height ≈ width / 0.666) + text/footer area
	// We add a small buffer (20px) for hover overlays and progress bars
	const estimatedTallCardHeight = useMemo(
		() => Math.round(cardWidth / 0.666666 + 90),
		[cardWidth],
	);

	const estimateRowHeight = useCallback(
		() => estimatedTallCardHeight,
		[estimatedTallCardHeight],
	);

	const virtualizer = useVirtualizer({
		count: rowCount,
		getScrollElement: () => scrollParentRef.current,
		estimateSize: estimateRowHeight,
		overscan: 2,
	});

	const virtualItems = virtualizer.getVirtualItems();

	// Update count in Zustand so header can display it without extra fetches
	useEffect(() => {
		const total = items.data?.TotalRecordCount;
		if (currentLibraryId && typeof total === "number") {
			updateLibrary(currentLibraryId, { itemsTotalCount: total });
		}
	}, [items.data?.TotalRecordCount, currentLibraryId, updateLibrary]);

	return (
		<div
			ref={parentRef}
			className="library-items-container virtualized"
			style={{ position: "relative" }}
		>
			{items.isSuccess && itemCount === 0 ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						minHeight: 240,
						width: "100%",
						opacity: 0.8,
					}}
				>
					<div style={{ textAlign: "center" }}>
						<div
							className="material-symbols-rounded"
							style={{ fontSize: 48, marginBottom: 8 }}
						>
							sentiment_dissatisfied
						</div>
						<div style={{ fontSize: 16 }}>No items to show</div>
						<div style={{ fontSize: 13, marginTop: 6 }}>
							Try adjusting filters, sort, or the A–Z selector.
						</div>
					</div>
				</div>
			) : (
				<div
					style={{
						position: "relative",
						height: virtualizer.getTotalSize(),
						width: "100%",
					}}
				>
					{virtualItems.map((row) => {
						const startIndex = row.index * columns;
						const endIndex = Math.min(startIndex + columns, itemCount);
						return (
							<div
								key={row.key}
								style={{
									position: "absolute",
									transform: `translateY(${row.start}px)`,
									left: 0,
									width: "100%",
									display: "flex",
									flexDirection: "row",
									alignItems: "flex-start",
									gap: `${cardGap}px`,
									// Allow natural height; virtualizer will update size after measurement.
									paddingBottom: "0.6em",
								}}
								data-index={row.index}
								ref={(el) => {
									if (el) virtualizer.measureElement(el);
								}}
							>
								{items.data?.Items?.slice(startIndex, endIndex).map(
									(item: BaseItemDto, localIndex: number) => {
										return (
											<div
												key={item?.Id ?? localIndex}
												style={{
													width: `${cardWidth}px`,
													flex: "0 0 auto",
													// Override default card margins to avoid compounding with gaps
													margin: 0,
												}}
											>
												<Card
													item={item}
													seriesId={item?.SeriesId}
													skipInView
													cardTitle={
														item?.Type === BaseItemKind.Episode
															? item.SeriesName
															: item?.Name
													}
													imageType={"Primary"}
													cardCaption={
														item?.Type === BaseItemKind.Episode
															? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
															: item?.Type === BaseItemKind.Series
																? `${item.ProductionYear} - ${
																		item.EndDate
																			? new Date(item.EndDate).toLocaleString(
																					[],
																					{
																						year: "numeric",
																					},
																				)
																			: "Present"
																	}`
																: item?.ProductionYear
													}
													disableOverlay={
														item?.Type === BaseItemKind.Person ||
														item?.Type === BaseItemKind.Genre ||
														item?.Type === BaseItemKind.MusicGenre ||
														item?.Type === BaseItemKind.Studio
													}
													cardType={
														item?.Type === BaseItemKind.MusicAlbum ||
														item?.Type === BaseItemKind.Audio ||
														item?.Type === BaseItemKind.Genre ||
														item?.Type === BaseItemKind.MusicGenre ||
														item?.Type === BaseItemKind.Studio ||
														item?.Type === BaseItemKind.Playlist
															? "square"
															: "portrait"
													}
													userId={user?.Id}
													// Inline style overrides to neutralize original margins for virtualization
												/>
											</div>
										);
									},
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};
export default LibraryItemsGrid;
