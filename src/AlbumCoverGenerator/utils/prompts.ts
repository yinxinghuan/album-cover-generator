// ─── Album text — name + title chats ─────────────────────────────────

export const BAND_NAME_SYSTEM = `You generate band names for an indie album-cover game.

Given three theme words, output exactly ONE made-up band name that feels like it could plausibly press a real record — could be any genre, not just indie. Match the vibe of the words.

Style guidance:
• 1 to 4 words. Most often 2.
• Mix concrete nouns with abstract or emotional words. Sometimes "The X", sometimes just one evocative word.
• Genre flexibility: if the words feel punk, name like a punk band; if they feel ambient, name like an ambient artist; if hip-hop, name like a hip-hop act.
• The name should not literally repeat the three input words — let them inspire mood, not dictate the words.
• Title case OR all lowercase OR mixed — pick whatever a real artist would.

Output the band name ONLY. No quotes. No explanation. No trailing punctuation.`;

export const TITLE_SYSTEM = `You generate album titles for an indie album-cover game.

Given three theme words, output ONE evocative album title — 1 to 5 words, may incorporate one of the input words but does not have to. Should feel like a real LP title in any genre, with a memorable shape. Examples of vibe: "Slow Hours", "Burnt Map", "Cathedral", "Closer to Empty", "Glow.", "All Tomorrow's Parties".

Output the album title ONLY. No quotes. No explanation. No trailing punctuation.`;

// ─── Cover style — chat picks genre + writes the image prompt ─────────

export const COVER_STYLE_SYSTEM = `You are an art director for an indie record label. Given three theme words plus the album's band name and title, decide what musical genre this record is and design its cover art.

Output exactly ONE JSON object with these three fields:

{
  "style": "<short genre slug, kebab-case, e.g. 'shoegaze' | 'vaporwave' | 'folk-revival' | 'minimal-techno' | 'post-punk-xerox' | 'noise-rock' | 'ambient-newage' | 'boom-bap-hiphop' | 'country-americana' | 'jazz-bluenote' | 'synthwave' | 'death-metal' | 'k-pop' | 'classical' | 'psych-folk' | 'industrial' | 'no-wave' | 'glitch-pop' | 'reggae-dub' | 'experimental-noise' — invent your own if none of these fits>",
  "subtitle": "<2-4 word descriptor shown in the UI's genre field, like 'dreamy lo-fi haze', 'neon highway nostalgia', 'desert sunset folk', 'underground tape culture'>",
  "imagePrompt": "<complete prompt for an AI image generator>"
}

The imagePrompt must:
- Be vivid and specific about the cover's visual subject (derived from the theme words),
- Specify medium (photograph / illustration / collage / 3D render / painting / mixed media), lighting, color palette, era / decade aesthetic,
- Include this exact text-rendering block: "Render the album title '{{TITLE}}' as the primary cover text — pick a typographic style that fits the genre. Render the band name '{{BAND}}' as secondary text. Both must be legible.",
  (Replace {{TITLE}} and {{BAND}} with the literal album title and band name strings the user provides — do not leave the placeholders.)
- End with: "Square 1:1 vinyl LP cover format. No watermarks, no border, no frame, no extraneous text."

Output ONLY the JSON object. No markdown fences, no explanation, no trailing commentary.`;

export interface ParsedCoverSpec {
  style: string;
  subtitle: string;
  imagePrompt: string;
}

const FALLBACK_COVER_SPEC = (
  words: [string, string, string],
  title: string,
  band: string,
): ParsedCoverSpec => ({
  style: 'shoegaze',
  subtitle: 'dreamy lo-fi haze',
  imagePrompt: `Indie shoegaze / dream-pop album cover artwork. Theme keywords (subject matter): ${words[0]}, ${words[1]}, ${words[2]}. Aesthetic: hazy soft-focus 35mm photograph, heavy motion blur, washed-out muted color palette with one bruised accent color, vintage film grain, gentle bloom, dreamy melancholic atmosphere, slightly overexposed window light. Loveless / Slowdive / Cocteau Twins vibe. Render the album title '${title}' as the primary cover text — handwritten serif, cream off-white, slightly faded. Render the band name '${band}' as secondary text below in small italic lowercase. Both must be legible. Square 1:1 vinyl LP cover format. No watermarks, no border, no frame.`,
});

/** Parse a chat response into a CoverSpec. Tolerates fences + prose. */
export function parseCoverSpec(
  raw: string,
  words: [string, string, string],
  title: string,
  band: string,
): ParsedCoverSpec {
  if (!raw) return FALLBACK_COVER_SPEC(words, title, band);
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return FALLBACK_COVER_SPEC(words, title, band);
  try {
    const obj = JSON.parse(m[0]);
    const style = typeof obj.style === 'string' && obj.style.trim()
      ? obj.style.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'indie';
    const subtitle = typeof obj.subtitle === 'string' && obj.subtitle.trim()
      ? obj.subtitle.trim()
      : style.replace(/-/g, ' ');
    const imagePrompt = typeof obj.imagePrompt === 'string' && obj.imagePrompt.length > 40
      ? obj.imagePrompt
      : FALLBACK_COVER_SPEC(words, title, band).imagePrompt;
    return { style, subtitle, imagePrompt };
  } catch {
    return FALLBACK_COVER_SPEC(words, title, band);
  }
}
