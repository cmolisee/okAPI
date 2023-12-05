export const MS_TO_HR_FACTOR: number = 2777777;

export function convertMsToHr(ms: number) {
	return ms / MS_TO_HR_FACTOR;
}