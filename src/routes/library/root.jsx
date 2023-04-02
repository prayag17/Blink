/** @format */
import { useParams } from "react-router-dom";

const LibraryView = () => {
	const { id } = useParams();
	return <h1>{id}</h1>;
};

export default LibraryView;
