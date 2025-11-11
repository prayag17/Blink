import { getRouteApi } from "@tanstack/react-router";
import React, { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useLibraryStateStore } from "@/utils/store/libraryState";
import "./alphaSelector.scss";

const libraryRoute = getRouteApi("/_api/library/$id");

export const AlphaSelector = React.memo(function AlphaSelector() {
	const { id: currentLibraryId } = libraryRoute.useParams();
	const { nameStartsWith } = useLibraryStateStore(
		useShallow((s) => ({
			nameStartsWith: s.libraries[currentLibraryId || ""]?.nameStartsWith,
		})),
	);
	const updateLibrary = useLibraryStateStore((s) => s.updateLibrary);

	const letters = useMemo(() => {
		const arr = Array.from({ length: 26 }, (_, i) =>
			String.fromCharCode(65 + i),
		);
		return ["All", ...arr];
	}, []);

	const handleSelect = (letter: string) => {
		const value = letter === "All" ? undefined : letter;
		if (currentLibraryId)
			updateLibrary(currentLibraryId, { nameStartsWith: value });
	};

	return (
		<div className="alpha-selector">
			{letters.map((l) => {
				const active = (nameStartsWith || "All") === l;
				return (
					<button
						key={l}
						className={active ? "alpha-letter active" : "alpha-letter"}
						onClick={() => handleSelect(l)}
						aria-label={`Filter by ${l}`}
						type="button"
					>
						{l}
					</button>
				);
			})}
		</div>
	);
});

export default AlphaSelector;
