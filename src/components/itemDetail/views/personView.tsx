import {
	type BaseItemDto,
	BaseItemKind,
} from "@jellyfin/sdk/lib/generated-client";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import { Card } from "@/components/card/card";
import {
	getPersonItemsQueryOptions,
	personTabs,
} from "@/utils/queries/itemDetail";
import { useApiInContext } from "@/utils/store/api";
import { useCentralStore } from "@/utils/store/central";
import ItemDetailLayout, { ExternalLinks } from "../itemDetailLayout";
import { getItemCardCaption, getItemCardTitle } from "../similarItems";

const PersonView = ({ item }: { item: BaseItemDto }) => {
	const api = useApiInContext((s) => s.api);
	const user = useCentralStore((s) => s.currentUser);
	const id = item.Id ?? "";

	const tabQueries = useQueries({
		queries: personTabs.map((tab) =>
			getPersonItemsQueryOptions(api, user?.Id, id, tab),
		),
	});

	// Until the user picks a tab, show the first one that has items.
	const [pickedTab, setPickedTab] = useState<number | null>(null);
	const allLoaded = tabQueries.every((query) => query.isSuccess);
	const firstNonEmptyTab = tabQueries.findIndex(
		(query) => (query.data?.TotalRecordCount ?? 0) > 0,
	);
	const activeTab =
		pickedTab ?? (allLoaded ? Math.max(firstNonEmptyTab, 0) : 0);
	const [animationDirection, setAnimationDirection] = useState<
		"forward" | "backwards"
	>("forward");

	return (
		<ItemDetailLayout
			item={item}
			variant="person"
			showTrailer={false}
			showMarkPlayed={false}
			main={<ExternalLinks item={item} />}
			aside={
				<>
					{item.PremiereDate && (
						<div>
							<Typography variant="h6">Birth</Typography>
							<Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
								{new Date(item.PremiereDate).toDateString()}
							</Typography>
						</div>
					)}
					{item.EndDate && (
						<div>
							<Typography variant="h6" sx={{ mt: 2 }}>
								Death
							</Typography>
							<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
								{new Date(item.EndDate).toDateString()}
							</Typography>
						</div>
					)}
				</>
			}
		>
			<div className="item-detail-person-container">
				<div className="item-detail-person-header">
					<Tabs
						variant="scrollable"
						value={activeTab}
						onChange={(_, newTab: number) => {
							setAnimationDirection(
								newTab > activeTab ? "forward" : "backwards",
							);
							setPickedTab(newTab);
						}}
					>
						{personTabs.map((tab, index) => (
							<Tab
								key={tab.key}
								label={tab.title}
								disabled={tabQueries[index].data?.TotalRecordCount === 0}
							/>
						))}
					</Tabs>
					<Divider />
				</div>
				<AnimatePresence>
					{personTabs.map((tab, index) => {
						if (index !== activeTab) return null;
						const query = tabQueries[index];
						const isWide =
							tab.kind === BaseItemKind.Photo ||
							tab.kind === BaseItemKind.Episode;
						return (
							<motion.div
								role="tabpanel"
								style={{ marginTop: "1em" }}
								className={`item-detail-person-cards ${isWide ? "col-4" : "col-7"}`}
								key={tab.key}
								initial={{
									opacity: 0,
									transform:
										animationDirection === "forward"
											? "translate(30px)"
											: "translate(-30px)",
								}}
								animate={{ opacity: 1, transform: "translate(0px)" }}
								transition={{ duration: 0.2, ease: "anticipate" }}
							>
								{query.data?.Items?.map((tabItem) => (
									<Card
										key={tabItem.Id}
										item={tabItem}
										cardTitle={getItemCardTitle(tabItem)}
										imageType="Primary"
										cardCaption={getItemCardCaption(tabItem)}
										cardType={
											tabItem.Type === BaseItemKind.Episode
												? "thumb"
												: "portrait"
										}
										queryKey={["item", id, tab.key]}
										userId={user?.Id}
									/>
								))}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</ItemDetailLayout>
	);
};

export default PersonView;
