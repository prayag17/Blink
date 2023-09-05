/** @format */

import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { Card } from "../../card/card";
import Typography from "@mui/material/Typography";

const Hero = ({ item, queryKey, userId }) => {
	return (
		<div className="item-detail-hero">
			<div className="item-detail-primaryImage">
				<Card
					item={item}
					seriesId={item.SeriesId}
					imageType={"Primary"}
					cardType={
						item.Type == BaseItemKind.MusicAlbum ||
						item.Type == BaseItemKind.Audio
							? "square"
							: "portrait"
					}
					queryKey={queryKey}
					userId={userId}
					imageBlurhash={
						item.ImageBlurHashes?.Primary[
							Object.keys(item.ImageBlurHashes.Primary)[0]
						]
					}
					hideText
					disablePadding
				/>
			</div>
			<div className="item-detail-hero-info-container">
				<div className="item-name">
					<Typography
						variant="h3"
						noWrap={true}
						fontWeight={600}
					>
						{item.Name}
					</Typography>
				</div>
				<div
					style={{
						marginTop: "1em",
					}}
				>
					<Typography
						variant="subtitle1"
						style={{ opacity: "0.7" }}
					>
						{item.Overview}
					</Typography>
				</div>
			</div>
		</div>
	);
};

export default Hero;
