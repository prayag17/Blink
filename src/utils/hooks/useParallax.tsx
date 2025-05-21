import { type MotionValue, useTransform } from "motion/react";

export default function useParallax(
	value: MotionValue<number>,
	distance: number,
) {
	return useTransform(value, [0, 1], [-distance, distance]);
}
