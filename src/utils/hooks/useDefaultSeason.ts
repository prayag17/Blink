import type { BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client";
import type { UseQueryResult, useQuery } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";

/**
 * Custom hook for selecting and managing the default season for a TV series.
 * Handles season selection logic including:
 * - Restoring previously selected season from sessionStorage
 * - Auto-selecting the first unwatched regular season (prioritizes regular seasons over specials)
 * - Only falls back to special seasons if no regular seasons exist
 * - Properly handles the case where some episodes in special seasons are watched
 */

function useDefaultSeason(
	seasons: UseQueryResult<BaseItemDtoQueryResult | null, unknown>,
	itemId: string | undefined,
): [number, React.Dispatch<React.SetStateAction<number>>] {
	const [currentSeason, setCurrentSeason] = useState<number>(() => {
		const result = sessionStorage.getItem(`season-${itemId}`);
		return result ? Number(result) : 0;
	});

	// Track if this is the initial load to avoid switching during episode updates
	const [hasInitialized, setHasInitialized] = useState(false);
	useEffect(() => {
		if (seasons.isSuccess && seasons.data?.Items) {
			const savedSeason = sessionStorage.getItem(`season-${itemId}`);

			// Always re-evaluate the best season based on viewing progress
			let defaultSeasonIndex = 0;

			// Map all seasons with their original index
			const allSeasonsWithIndex = seasons.data.Items.map(
				(season, index: number) => ({
					...season,
					originalIndex: index,
				}),
			);

			// Separate regular seasons (not specials) and special seasons
			const regularSeasons = allSeasonsWithIndex.filter(
				(season) => season.IndexNumber !== 0 && season.IndexNumber != null,
			);
			const specialSeasons = allSeasonsWithIndex.filter(
				(season) => season.IndexNumber === 0,
			);

			// Find the optimal season based on viewing progress
			if (regularSeasons.length > 0) {
				let targetSeason = regularSeasons[0];

				// Look for the first season that isn't fully watched
				for (const season of regularSeasons) {
					// A season is considered "unwatched" if:
					// 1. The season itself isn't marked as played, AND
					// 2. The season has a play percentage less than 100%
					const isSeasonFullyWatched =
						season.UserData?.Played ||
						(season.UserData?.PlayedPercentage &&
							season.UserData.PlayedPercentage >= 100);

					if (!isSeasonFullyWatched) {
						targetSeason = season;
						break;
					}
				}

				// If the selected season is still fully watched, try to move to the next one
				const isTargetFullyWatched =
					targetSeason.UserData?.Played ||
					(targetSeason.UserData?.PlayedPercentage &&
						targetSeason.UserData.PlayedPercentage >= 100);

				if (isTargetFullyWatched) {
					const currentIndex = regularSeasons.findIndex(
						(s) => s.Id === targetSeason.Id,
					);
					const nextSeasonIndex = currentIndex + 1;
					if (nextSeasonIndex < regularSeasons.length) {
						targetSeason = regularSeasons[nextSeasonIndex];
					}
					// If we're at the last season and it's fully watched, stay on it
				}

				defaultSeasonIndex = targetSeason.originalIndex;
			}
			// Only fall back to special seasons if no regular seasons exist
			else if (specialSeasons.length > 0) {
				// For special seasons, just pick the first one
				defaultSeasonIndex = specialSeasons[0].originalIndex;
			}

			// Smart season selection logic
			if (savedSeason) {
				const savedSeasonNumber = Number(savedSeason);
				const currentSeasonData = allSeasonsWithIndex[savedSeasonNumber];

				// Check if user is currently in a special season
				const isInSpecialSeason = currentSeasonData?.IndexNumber === 0;

				// Check if current season is fully complete
				const isCurrentSeasonComplete =
					currentSeasonData?.UserData?.Played ||
					(currentSeasonData?.UserData?.PlayedPercentage &&
						currentSeasonData.UserData.PlayedPercentage >= 100);

				if (isInSpecialSeason) {
					// For special seasons: advance to regular seasons if specials are complete
					if (isCurrentSeasonComplete && regularSeasons.length > 0) {
						// Special season is done, move to optimal regular season
						setCurrentSeason(defaultSeasonIndex);
						sessionStorage.setItem(
							`season-${itemId}`,
							defaultSeasonIndex.toString(),
						);
					} else if (!hasInitialized && regularSeasons.length > 0) {
						// Initial load: prioritize regular seasons over specials
						setCurrentSeason(defaultSeasonIndex);
						sessionStorage.setItem(
							`season-${itemId}`,
							defaultSeasonIndex.toString(),
						);
					} else {
						// Stay in specials (either no regular seasons or specials not complete)
						setCurrentSeason(savedSeasonNumber);
					}
				} else {
					// For regular seasons: advance to next season if current is complete
					if (isCurrentSeasonComplete) {
						// Find next season after current
						const currentRegularIndex = regularSeasons.findIndex(
							(s: { originalIndex: number }) =>
								s.originalIndex === savedSeasonNumber,
						);
						if (
							currentRegularIndex >= 0 &&
							currentRegularIndex < regularSeasons.length - 1
						) {
							// Move to next regular season
							const nextSeason = regularSeasons[currentRegularIndex + 1];
							setCurrentSeason(nextSeason.originalIndex);
							sessionStorage.setItem(
								`season-${itemId}`,
								nextSeason.originalIndex.toString(),
							);
						} else {
							// At last season or use calculated optimal
							setCurrentSeason(defaultSeasonIndex);
							sessionStorage.setItem(
								`season-${itemId}`,
								defaultSeasonIndex.toString(),
							);
						}
					} else if (
						!hasInitialized &&
						savedSeasonNumber !== defaultSeasonIndex
					) {
						// Initial load: use calculated optimal season
						setCurrentSeason(defaultSeasonIndex);
						sessionStorage.setItem(
							`season-${itemId}`,
							defaultSeasonIndex.toString(),
						);
					} else {
						// Stay in current season
						setCurrentSeason(savedSeasonNumber);
					}
				}
			} else {
				// No saved season, use the calculated default
				setCurrentSeason(defaultSeasonIndex);
				sessionStorage.setItem(
					`season-${itemId}`,
					defaultSeasonIndex.toString(),
				);
			}

			// Mark as initialized after first run
			if (!hasInitialized) {
				setHasInitialized(true);
			}
		}
	}, [seasons.isSuccess, seasons.data?.Items, itemId, hasInitialized]);
	return [currentSeason, setCurrentSeason];
}

export default useDefaultSeason;
