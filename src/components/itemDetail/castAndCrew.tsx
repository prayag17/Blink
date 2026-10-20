import type { Api } from "@jellyfin/sdk";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import React, { useMemo } from "react";
import { getTypeIcon } from "@/components/utils/iconsCollection";
import getImageUrlsApi from "@/utils/methods/getImageUrlsApi";

const groups = [
	{ type: "Actor", title: "Actors" },
	{ type: "Writer", title: "Writers" },
	{ type: "Director", title: "Directors" },
	{ type: "Producer", title: "Producers" },
] as const;

type CastAndCrewProps = {
	people: BaseItemPerson[] | null | undefined;
	api: Api | undefined;
};

const CastAndCrew = ({ people, api }: CastAndCrewProps) => {
	const grouped = useMemo(
		() =>
			groups.map((group) => ({
				...group,
				people: people?.filter((person) => person.Type === group.type) ?? [],
			})),
		[people],
	);

	if (!people?.length) return null;

	return (
		<div className="item-detail-cast">
			<Typography variant="h5" sx={{ mb: 2 }}>
				Cast & Crew
			</Typography>
			{grouped.map(
				(group) =>
					group.people.length > 0 && (
						<div className="item-detail-cast-container" key={group.type}>
							<Typography variant="h6" className="item-detail-cast-title">
								{group.title}
							</Typography>
							<div className="item-detail-cast-grid">
								{group.people.map((person) => (
									<Link
										className="item-detail-cast-card"
										key={person.Id}
										to="/item/$id"
										params={{ id: person.Id ?? "" }}
										search={{ type: "Person" }}
									>
										{person.PrimaryImageTag ? (
											<img
												alt={person.Name ?? ""}
												src={
													api &&
													getImageUrlsApi(api).getItemImageUrlById(
														person.Id ?? "",
														"Primary",
														{
															quality: 80,
															fillWidth: 200,
															fillHeight: 200,
														},
													)
												}
												className="item-detail-cast-card-image"
											/>
										) : (
											<div className="item-detail-cast-card-icon">
												{getTypeIcon("Person")}
											</div>
										)}
										<div className="item-detail-cast-card-text">
											<Typography variant="subtitle1">{person.Name}</Typography>
											<Typography variant="subtitle2" style={{ opacity: 0.5 }}>
												{person.Role}
											</Typography>
										</div>
									</Link>
								))}
							</div>
						</div>
					),
			)}
		</div>
	);
};

export default CastAndCrew;
