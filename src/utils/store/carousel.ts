import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type CarouselStore = {
	direction: "left" | "right";
	setDirection: (dir: "left" | "right") => void;
};
export const useCarouselStore = createWithEqualityFn<CarouselStore>(
	(set) => ({
		direction: "right",
		setDirection: (dir) => set(() => ({ direction: dir })),
	}),
	shallow,
);
