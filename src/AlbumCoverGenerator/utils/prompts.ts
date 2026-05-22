import type { CoverStyle } from '../types';

function shoegazePrompt(words: [string, string, string], title: string, band: string): string {
  return `Indie shoegaze / dream-pop album cover artwork.
Theme keywords (subject matter): ${words[0]}, ${words[1]}, ${words[2]}.
Aesthetic: hazy soft-focus 35mm photograph, heavy motion blur, washed-out muted color palette with one bruised accent color, vintage film grain, gentle bloom, dreamy melancholic atmosphere, slightly overexposed window light. Loveless / Slowdive / Cocteau Twins vibe.
Text rendering — required:
• A handwritten serif phrase reading "${title}" centered at the top, in cream off-white, slightly faded into the photo.
• Below it in small italic lowercase letters: "${band}".
Composition: square 1:1 vinyl format. Wide negative space. No frame, no logos, no watermarks, no extra text artifacts, no border. The photo must occupy the whole square edge to edge.`;
}

function xeroxPrompt(words: [string, string, string], title: string, band: string): string {
  return `DIY zine / post-punk lo-fi album cover.
Theme keywords (subject matter): ${words[0]}, ${words[1]}, ${words[2]}.
Aesthetic: stark high-contrast black-and-white photocopier xerox aesthetic, visible halftone dot pattern, toner streaks, copy machine grain, fingerprint and dust on the platen, cut-and-paste collage feel, raw DIY punk fanzine energy, fifth-generation photocopy degradation. Sonic Youth / Crass / Daydream Nation vibe.
Text rendering — required:
• Ransom-note style headline reading "${title}" at the top — mismatched bold black serif and sans letters of slightly different sizes, glued at random angles onto torn white paper.
• Below the artwork, typewritten small caps reading "${band}" in a single neat line.
Composition: square 1:1 format. White paper background, black ink only — no other colors. No frame, no logos, no watermarks, no extra text artifacts.`;
}

export function coverPrompt(
  style: CoverStyle,
  words: [string, string, string],
  title: string,
  band: string,
): string {
  return style === 'shoegaze'
    ? shoegazePrompt(words, title, band)
    : xeroxPrompt(words, title, band);
}

export const BAND_NAME_SYSTEM = `You generate band names for an indie album-cover game.

Given three theme words, output exactly ONE made-up band name that feels like a real shoegaze, bedroom-pop, dream-pop, post-punk, lo-fi or indie band that might press a real record.

Style guidance:
• 1 to 4 words. Most often 2.
• Mix concrete nouns with abstract or emotional words. Sometimes "The X", sometimes just one evocative word.
• Avoid clichés like "Echo", "Velvet", "Midnight" unless they really fit. Prefer fresh combinations.
• The name should not literally repeat the three input words — let them inspire mood, not dictate the words.
• Title case OR all lowercase OR mixed — pick whatever a real band would pick.

Output the band name ONLY. No quotes. No explanation. No trailing punctuation.`;

export const TITLE_SYSTEM = `You generate poetic short album titles for an indie album-cover game.

Given three theme words, output ONE evocative album title — 1 to 5 words, may incorporate one of the input words but does not have to. It should feel like the name of a real indie LP. Examples of vibe: "Slow Hours", "Burnt Map", "Closer to Empty", "Glow."

Output the album title ONLY. No quotes. No explanation. No trailing punctuation.`;
