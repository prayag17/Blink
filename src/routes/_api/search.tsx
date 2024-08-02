import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_api/search")({
	validateSearch: (search: Record<string, string>): { query: string } => {
		return {
			query: search?.query as string,
		};
	},
});