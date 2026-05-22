#!/usr/bin/env python3
"""
Compose the Album Cover Generator launch poster — 1080×1080 PNG.

Style: A24-style ticket. Orange field with a black scalloped-edge
ticket card centered, massive bold grotesque type, real AI cover panel
inside, bottom hero footer text.

Run:
  ~/miniconda3/bin/python3 gen_poster.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1080
HERE = os.path.dirname(__file__)
PUBLIC = os.path.join(HERE, "public")
OUTPUT_PATH = "/Users/yin/code/games/games/posters/album-cover-generator.png"

BG       = (255, 106, 0)       # orange
INK      = (10, 10, 10)
LIGHT    = (255, 226, 201)
ORANGE   = (255, 106, 0)


def pick(cands, default="/System/Library/Fonts/Helvetica.ttc"):
    return next((p for p in cands if os.path.exists(p)), default)


DISPLAY_CANDS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/HelveticaNeue.ttc",
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
]
MONO_CANDS = [
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
]


def make_ticket_mask(size, r=14, period=36):
    """Build an alpha mask matching the scalloped-edge ticket shape.

    Top and bottom edges have repeated circular cutouts. Sides are flat.
    """
    w, h = size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    # Fill the body, leaving rotation room.
    d.rectangle((0, r, w, h - r), fill=255)
    # Fill middle column for the parts of the scallop strip that aren't notches.
    # We draw filled top + bottom strips, then knock out semicircles.
    d.rectangle((0, 0, w, r), fill=255)
    d.rectangle((0, h - r, w, h), fill=255)
    # Knock out top notches
    n = w // period
    pad = (w - n * period) // 2
    for i in range(n + 1):
        cx = pad + i * period + period // 2
        d.ellipse((cx - r, -r, cx + r, r), fill=0)
        d.ellipse((cx - r, h - r, cx + r, h + r), fill=0)
    return mask


def draw_ticket(canvas, x, y, w, h, angle=0):
    """Draw a ticket card at (x, y), rotated by angle deg. Returns the
    composited canvas. Card is black with cream + orange typography."""
    # Build the ticket as its own RGBA tile
    tile = Image.new("RGBA", (w, h), INK + (255,))
    td = ImageDraw.Draw(tile)
    margin = 56

    # ── Top header
    head_font = ImageFont.truetype(pick(DISPLAY_CANDS), 22)
    head_text = "RELEASE TICKET"
    td.text((margin + 30, 60), head_text, font=head_font, fill=LIGHT)
    # tiny ticket pictogram
    td.polygon([(margin, 64), (margin + 22, 64), (margin + 22, 82),
                (margin + 18, 82), (margin + 16, 78),
                (margin + 6, 78), (margin + 4, 82),
                (margin, 82)], fill=LIGHT)
    # cat pill top right
    cat_text = "ALT-024"
    cat_font = ImageFont.truetype(pick(MONO_CANDS), 18)
    cw = td.textlength(cat_text, font=cat_font)
    pill_x2 = w - margin
    pill_x1 = pill_x2 - cw - 28
    td.rounded_rectangle((pill_x1, 52, pill_x2, 90), radius=19,
                         fill=(255, 226, 201, 30))
    td.text((pill_x1 + 14, 60), cat_text, font=cat_font, fill=LIGHT)

    # bottom border under header
    td.line((margin, 110, w - margin, 110), fill=(255, 226, 201, 60), width=1)

    # ── Cover panel (full-bleed within margins)
    cover_path = os.path.join(PUBLIC, "demo_cover.jpg")
    cover_y = 130
    cover_size = w - margin * 2
    if os.path.exists(cover_path):
        cover = Image.open(cover_path).convert("RGBA").resize((cover_size, cover_size), Image.LANCZOS)
        tile.alpha_composite(cover, (margin, cover_y))
        # Chip on the cover top-left
        chip_text = "RELEASE TICKET"
        chip_font = ImageFont.truetype(pick(DISPLAY_CANDS), 17)
        chip_w = td.textlength(chip_text, font=chip_font) + 50
        chip_y = cover_y + 22
        chip_x = margin + 22
        td.rounded_rectangle((chip_x, chip_y, chip_x + chip_w, chip_y + 34),
                             radius=17, fill=(10, 10, 10, 180))
        # tiny ticket pictogram inside chip
        td.polygon([(chip_x + 12, chip_y + 11), (chip_x + 26, chip_y + 11),
                    (chip_x + 26, chip_y + 25), (chip_x + 22, chip_y + 25),
                    (chip_x + 21, chip_y + 22), (chip_x + 17, chip_y + 22),
                    (chip_x + 16, chip_y + 25), (chip_x + 12, chip_y + 25)],
                   fill=LIGHT)
        td.text((chip_x + 32, chip_y + 8), chip_text, font=chip_font, fill=LIGHT)
        # Cat pill on cover bottom-right
        cat_pill_text = "ALT-024"
        cat_pill_font = ImageFont.truetype(pick(DISPLAY_CANDS), 19)
        cpw = td.textlength(cat_pill_text, font=cat_pill_font)
        cpx = margin + cover_size - cpw - 32
        cpy = cover_y + cover_size - 46
        td.rounded_rectangle((cpx, cpy, cpx + cpw + 22, cpy + 32),
                             radius=16, fill=ORANGE + (255,))
        td.text((cpx + 11, cpy + 5), cat_pill_text, font=cat_pill_font, fill=INK)

    # ── Title block under the cover
    title_y = cover_y + cover_size + 36
    band_font  = ImageFont.truetype(pick(DISPLAY_CANDS), 80)
    title_font = ImageFont.truetype(pick(DISPLAY_CANDS), 60)
    band_text = "The Fading"
    band2_text = "Stations"
    title_text = "Slow Hours"
    td.text((margin, title_y), band_text, font=band_font, fill=LIGHT)
    td.text((margin, title_y + 78), band2_text, font=band_font, fill=LIGHT)
    td.text((margin, title_y + 168), title_text, font=title_font, fill=ORANGE)

    # ── Bottom hero footer
    foot_y = h - 170
    # Top border line of the footer
    td.line((margin, foot_y, w - margin, foot_y), fill=(255, 226, 201, 70), width=1)
    hero_font = ImageFont.truetype(pick(DISPLAY_CANDS), 56)
    td.text((margin, foot_y + 24), "Limited Pressing", font=hero_font, fill=ORANGE)
    foot_meta_font = ImageFont.truetype(pick(DISPLAY_CANDS), 16)
    td.text((margin, h - 60), "ALTERU RECORDS", font=foot_meta_font, fill=LIGHT)
    alt24_text = "ALT24"
    aw = td.textlength(alt24_text, font=foot_meta_font)
    td.text((w - margin - aw, h - 60), alt24_text, font=foot_meta_font, fill=LIGHT)

    # Apply ticket scallop mask
    mask = make_ticket_mask(tile.size, r=14, period=38)
    tile.putalpha(mask)

    # Drop shadow then rotate + paste
    if angle != 0:
        tile = tile.rotate(angle, resample=Image.BICUBIC, expand=True)
    rw, rh = tile.size
    # Shadow
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    # approximate the rotated card with its bounding box
    sd.rectangle((x - rw // 2 + 10, y - rh // 2 + 24,
                  x + rw // 2 + 10, y + rh // 2 + 24),
                 fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(tile, (x - rw // 2, y - rh // 2))
    return canvas


def main():
    canvas = Image.new("RGBA", (W, H), BG + (255,))

    # A few rotated "background" tickets to telegraph the multi-LP wall.
    draw_ticket(canvas, x=int(W * 0.18), y=int(H * 0.20), w=600, h=900, angle=-14)
    draw_ticket(canvas, x=int(W * 0.86), y=int(H * 0.22), w=600, h=900, angle=12)
    draw_ticket(canvas, x=int(W * 0.20), y=int(H * 0.85), w=600, h=900, angle=10)
    draw_ticket(canvas, x=int(W * 0.84), y=int(H * 0.86), w=600, h=900, angle=-12)

    # Hero ticket front and center.
    draw_ticket(canvas, x=W // 2, y=H // 2, w=680, h=1020, angle=-3)

    out = canvas.convert("RGB")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    out.save(OUTPUT_PATH, optimize=True)
    in_game = out.resize((1024, 1024), Image.LANCZOS)
    in_game.save(os.path.join(PUBLIC, "poster.png"), optimize=True)
    print(f"saved {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH) // 1024} KB)")
    print(f"saved {os.path.join(PUBLIC, 'poster.png')}")


if __name__ == "__main__":
    main()
