---
name: add-pokemon-card
description: Research, verify, prepare, and add Pokemon TCG card records for the ptcg-tracker split JSON collection. Use when a user names a card or printing, asks for its metadata or a high-quality image URL, wants a proposed collection record, or asks to add a card to public/data/collections/*.json.
---

# Add Pokemon Card

Research the exact printing, prefer an official high-resolution image, map the result to this repository's schema, and edit collection data only when requested.

## Inspect the repository

1. Read `AGENTS.md` before acting.
2. Run `git status --short`; treat existing collection changes as user data.
3. Read `src/types.ts`, `public/data/collection.json`, and representative records in the relevant `public/data/collections/*.json` file.
4. Search existing data for the Pokemon name and printing before proposing a duplicate.

The split card files omit `listId`. Each stored record normally has:

```json
{
  "id": "source-or-set-specific-id",
  "name": "Slakoth",
  "set": "Super Electric Breaker (SV8)",
  "pokedexNumber": 287,
  "number": "117/106",
  "count": 1,
  "language": "JP",
  "imageUrl": "https://example.com/direct-card-image.jpg",
  "notes": ""
}
```

Format `set` as `<set name> (<set code>)`, for example `Super Electric Breaker (SV8)`. Keep the card's collector number separately in `number`. Include `subgroupId` only when the destination collection defines that subgroup in the manifest. Do not add a separate rarity property: the current `CollectionCard` type does not contain one. Treat `count: 0` as wishlisted and use `count: 1` for one owned copy unless the user specifies otherwise.

## Identify the exact printing

1. Search the web because card catalogs and image assets are external and may change.
2. Resolve shorthand such as `AR`, `SAR`, language, set code, and collector number. Do not confuse Japanese Art Rare with an English Illustration Rare or similarly named Pokemon TCG Pocket card.
3. Cross-check at least two catalog sources when the request is ambiguous. Useful sources include the official Pokemon card database, TCG Collector, Bulbapedia, Serebii, and Pokellector.
4. Confirm the English Pokemon name, set name and code, full collector number, Pokédex number, language, and printing/rarity. Store the set name and code together using `<set name> (<set code>)`.
5. Ask for clarification only when multiple plausible printings remain after research.

Rarity helps identify the printing but is not persisted in this app.

## Find a high-quality direct image

Prefer sources in this order:

1. The official Japanese Pokemon Card Game database at `pokemon-card.com` for Japanese cards.
2. A reputable card database CDN with a clean scan.
3. Serebii or a retailer only when no better database asset exists.

Open the exact official card detail page and extract its card image path from the HTML. Official Japanese assets commonly resemble:

```text
https://www.pokemon-card.com/assets/images/card_images/large/<SET>/<ASSET>.jpg
```

Do not guess `<ASSET>`: extract it from the matching detail page. For example, Slakoth AR 117/106 from SV8 resolves to:

```text
https://www.pokemon-card.com/assets/images/card_images/large/SV8/046640_P_NAMAKERO.jpg
```

Validate every proposed URL:

- Follow redirects and require an HTTP success response.
- Require an image content type rather than an HTML product page.
- Inspect intrinsic dimensions with `file` or ImageMagick `identify` after downloading to `/tmp`.
- Prefer an original clean scan over a marketplace photo, thumbnail, or enlarged low-resolution copy.
- Compare alternatives by visible sharpness as well as dimensions; larger pixel dimensions alone do not guarantee quality.

The verified official Slakoth image is 868 x 1212 JPEG. The 570 x 796 Pokellector image, 640 x 892 pkmn.gg image, and Serebii image were visibly softer and should not be preferred.

## Prepare or add the record

Choose the destination from `public/data/collection.json` and the user's intent. A species' Pokédex collection generally holds its primary representative; alternate arts or additional printings generally belong in the corresponding `*-others` collection. Preserve the destination file's ordering and ID conventions.

Before editing, show or internally verify the complete proposed values. Use `apply_patch` for the smallest possible JSON change. Do not reformat or regenerate a collection file. Never change `public/data/collection.json` unless the request requires a manifest change.

If the user requests research or a URL only, report the verified result without modifying files. If the user requests the addition, make the edit and run `npm run build`. Report the destination, record added, image source, and verification result.
