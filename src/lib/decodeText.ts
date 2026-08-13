/**
 * GPT-2 / TinyStories BPE uses U+0120 (Ġ) as a leading-space marker in token
 * strings. Some decode paths leave it visible — normalize to real spaces.
 */
export const cleanupBpeText = (text: string): string => {
	return text
		.replace(/\u0120/g, ' ')
		.replace(/Ġ/g, ' ')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n[ \t]+/g, '\n')
		.replace(/ {2,}/g, ' ')
		.trim();
};
