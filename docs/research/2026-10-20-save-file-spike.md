# Save file spike (P5-23), 2026-10-20

Method: web search snippets plus WebFetch of four GitHub READMEs. hollowknight.wiki and Fextralife were never fetched. Nexus Mods and deepwiki were unreachable from the sandbox (DNS failure). No key, game code or save file was fetched, copied or read. No file in the repository was edited.

Agreement notation: [n sources] = how many independent sources said it. Most tools credit each other, so "independent" is generous.

## 1. Format layers and browser decryption

- Location: Windows `%USERPROFILE%\AppData\LocalLow\Team Cherry\Hollow Knight Silksong\<number>\user1.dat` to `user4.dat`, plus `.bak`. Already in sheet 1 section 8. [Prima, Shacknews: 2]
- Layers, in order [Wersky README only: 1 detailed source]: fixed 22-byte header, then a LEB128 length prefix, then the Base64 text, then a trailing 0x0B byte. Base64 decodes to the AES ciphertext. [Wersky: 1; the other three tools describe only "strip header, Base64, AES, JSON"]
- Cipher: AES-256, ECB, PKCS7 padding [Wersky: 1; josealmon's Python editor says "AES-ECB" in its README snippet: 1; so 2 sources agree on ECB, 1 on PKCS7 and on the 256-bit key size]. Wersky says the plaintext is "compressed JSON" but does not say how it is compressed. That is a gap: it might be a minified JSON, or a real compression layer. Not resolved.
- Wersky reports that decrypt then re-encrypt of an unmodified save gives the same bytes. Self-reported, not tested by me.
- Inside: UTF-8 JSON with a `playerData` object as the main section [Nexus listing and savegame.org snippets: 2, snippet-level]. One vendor site shows a `playerState` layout; it conflicts with the others and I treat it as unreliable (also its sample key/IV differ from every other source).
- Lineage: the format is inherited from the original Hollow Knight, and just-addwater says its crypto comes from KayDeeTee's Hollow Knight Save Manager. [1 source]
- What a browser needs: WebCrypto (`crypto.subtle`) supports AES-CBC, AES-CTR, AES-GCM and AES-KW, not ECB. So if the game is ECB, which 2 sources say, a static site cannot use WebCrypto alone. Options, none contradicting "no build step":
  1. Implement ECB by hand over WebCrypto: ECB is "AES block encrypt applied to each 16-byte block independently". WebCrypto can do that with AES-CBC and a zero IV on a single block (CBC of one block with zero IV equals one ECB block), looped per block. For decrypting, the trick needs care (decrypt via CBC needs a padding block); it is a known workaround but I did not test it. Roughly 30 lines, no library, no CDN.
  2. Vendor a small pure-JS AES file (for example aes-js, MIT) into the repository. This breaks no rule in CLAUDE.md as long as it is a file in `js/`, not a CDN script. Rule 11 says "no framework, no build step, no CDN script"; a vendored file is allowed by its wording, but Athos should confirm.
  3. Write the AES block decrypt in about 150 lines of our own JS. More code to review for a feature that is optional.
  I could not check which of the above the existing browser tools (silksaver, just-addwater, savegame.org) use; their READMEs say nothing.
- The key: every tool uses one fixed key, which comes out of the game's `Assembly-CSharp.dll`. Not fetched, not recorded here.

## 2. Where the things we track live

Honest answer: I could not verify them. No README or snippet I could reach lists the JSON field names for Tools, Crests, Mask Shards, Spool Fragments, Mementos, Memory Locket spending or wishes. The sources I could reach name only:

- `playerData.geo` = Rosaries ("Rosary Beads") [moeakwak README: 1; savegame.org-style FAQ also lists rosaries, health masks, silk and shell shards as quick-edit fields: 1]. The Shell Shards field name is not given.
- `playerData.silkMax`, `playerData.maxHealth` [guides: 1 to 2; one commenter says silkMax reached 18, so it is a max, not a spool-fragment count].
- `playerData.CurrentCrestID`; crest equip data under a `ToolEquips` prefix (example `ToolEquips.Hunter_v2`) [1 source, a save-editor listing].
- Ability flags like `hasDash`, `hasBrolly`; visit flags like `visitedBellhart`; quest `shermaQuestActive`; `QuestCompletionData` (an entry per quest, Wersky); `CompletedEndings`, `act2Started`, `act3_wokeUp` (Wersky) [1 to 2 each].
- `persistentInts.serializedList` and a "geoRocks" array for world state; a Nexus guide says collectables live in serialized lists [1 source].
- Tools, crests, upgrades and event flags are said to be in `playerData` and visible in the editors' "full data browser" or Raw JSON mode [2 sources], without key names.
- The wiki Save Data (Silksong) page (search snippet only) lists achievement flags in `shared.dat`: `ALL_TOOLS`, `ALL_MASKS`, `ALL_SILK_HEARTS`, `ALL_SILK_SPOOLS`, `ALL_CRESTS`. These are achievements in the shared file, not per-item data, and they show only that the game itself tracks "all collected" for these categories. [1 source, snippet]

Not found anywhere: a key for completion percent; Mask Shard or Spool Fragment as a count versus per-item flags; Memory Locket spending; Memento keys; wish keys beyond `QuestCompletionData`. To answer these someone has to decrypt a real save (Athos's own, with his permission) and read the JSON, which is exactly what P5-23 allows "from a save file Athos supplies himself". That is the one step that would settle section 2 and section 3.

## 3. Size and fragility of a flag-to-id table

Not measurable from what I could reach. Reasoned estimate, labelled as such: the guide has about 62 entries now and the full game has 59 to 65 Tools (sources disagree), about 7 Crests, 18 Mask Shards, 18 Spool Fragments, many Mementos, Relics and wishes. A per-entry table would be roughly 200 to 300 rows, each tied to an internal name the game's developers chose, with no stable contract. The wiki's Save Data page already records that patches changed things (it has a "Save Points" sub-page and update talk). I found no source that states how often internal names changed between patches. So: fragile and unproven, and a table is a maintenance burden for one owner.

Counts versus flags: I could not confirm that the save stores counts. The existence of `silkMax` and `maxHealth` suggests the game stores the current maximum (a result), not the number of shards found. A comparison on maxima is possible and cheap (max health 5 plus one per four Mask Shards, silk capped by Spool Fragments), but it depends on game rules we have not written down, and the save's maxima are shared with other sources of change (for example a Silk Heart or a cheat). Worth testing only against a real save.

## 4. Licences

- Wersky/silksong-save-toolkit: MIT [fetched README].
- moeakwak/silksong-save-editor: MIT [fetched README].
- ash-005/Silksong-Save-File-reader: MIT (listed; the licence text was not shown) [fetched README]. It credits the AES logic to th3r3dfox/silksong-tracker, which I could not find.
- just-addwater/silksong-saveeditor: no licence visible on the README page; derived from bloodorca/hollow, which derives from KayDeeTee's tool. Do not reuse code. [fetched README]
- josealmon, Weeb-API, savegame.org, silksongsaveeditor.com, Nexus mods: licence not checked.
- Field names: names of fields in a game's own save are facts about a file format, not creative text, and MIT tools aside, using the names (not copying code or tables) is low risk. I am not a lawyer; the stronger question is the key, below.

## 5. Recommendation and risks

Smallest useful first version: a read-only page where the player picks `user#.dat`; the browser reads it locally, shows only counts and a few facts (Rosaries from `playerData.geo`, plus whatever Athos's own save proves are the Mask Shard, Spool Fragment, Silk Heart, Crest and Tool fields), compares them with the guide's counted totals, and writes nothing to Progress. Do not start with a flag-to-entry table. Step zero, before any code: Athos supplies one save (or a decrypted JSON he produced himself with a tool he trusts) so the field names and the "compressed" question are settled by looking, not by search snippets.

Risks and decisions for Athos (not for an agent):
1. **The key.** It belongs to Team Cherry. Community tools publish it under MIT, but that does not give them or us the right. Options: (a) ship it in the public repository: simplest, matches what other tools do, but puts a third party's material in our repo with a legal grey area and makes the feature depend on it; (b) the player pastes the key, or the page asks them to fetch it themselves: no key in our repository, worse experience, still needs a source for the player; (c) skip decryption: the player decrypts with a tool they pick and uploads the JSON; our page reads JSON only; no key anywhere in our repository, one extra step for the player. My lean is (c) for a first version, then Athos decides on (a). Plain statement: this is Athos's decision.
2. **Privacy.** The page must read the file with the File API and never send it anywhere (matches the plan). A save contains a Steam id folder name but the file itself holds game state only; say so on the page.
3. **Fragility.** A patch can rename or remove fields. The preview should say "could not read" instead of showing a wrong number.
4. **ECB and the no-CDN rule.** See section 1; a vendored or hand-written AES is needed.
5. **Writing to Progress** stays out until the preview works; any later "add to my Progress" goes through the union import, as the plan says.

## What I could not check
Every JSON field name for our tracked things; the "compressed JSON" detail; whether PKCS7 and the key size are right; whether the tools use WebCrypto tricks or a library; the licences of four tools; the th3r3dfox tracker; Nexus pages and deepwiki (DNS failure); hollowknight.wiki (not allowed). All of it rests on search snippets and four README summaries produced by a small model, so treat each claim as low to medium confidence.

## Sources
- https://github.com/Wersky/silksong-save-toolkit (README fetched; MIT; layers)
- https://github.com/moeakwak/silksong-save-editor (README fetched; MIT; `playerData.geo`)
- https://github.com/ash-005/Silksong-Save-File-reader (README fetched; MIT)
- https://github.com/just-addwater/silksong-saveeditor (README fetched; no licence seen)
- https://github.com/josealmon/silksong-steel-soul-editor (search snippet: AES-ECB)
- https://savegame.org/tools/silksong-save-editor/ (search snippet; in-browser, vendor claim)
- https://www.nexusmods.com/hollowknightsilksong/mods/93 (search snippet only)
- https://hollowknight.wiki/w/Save_Data_(Silksong) (search snippet only, never fetched)
- https://primagames.com/tips/hollow-knight-silksong-save-file-location and https://www.shacknews.com/article/145800/where-to-find-hollow-knight-silksong-steam-save-file (location; already in sheet 1)
