import type { Api } from "@jellyfin/sdk";
import { ImageUrlsApi } from "@jellyfin/sdk/lib/utils/api/image-urls-api";

const getImageUrlsApi = (api: Api) => new ImageUrlsApi(api.configuration);

export default getImageUrlsApi;