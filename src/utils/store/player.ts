import { create } from "zustand";
import { getRuntimeMusic, secToTicks } from "../date/time";

const usePlayer = create(() => ({
	timeString: 0,
}));

export const setTime = (sec: number) => {
	const a = getRuntimeMusic(secToTicks(sec));
	console.log(a);
	usePlayer.setState(() => ({ timeString: a }));
};

export default usePlayer;
