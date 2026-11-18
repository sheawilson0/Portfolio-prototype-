# Tile copy: outcome-led options

Branch `portfolio-polish-r1`, 18 Nov 2026. Not deployed (`/review` is in `.vercelignore`).

The tiles are the captions under each picture on the homepage: the name, then one short line. Every option below uses only facts already on the site or its case study pages. No numbers are invented. Where a line needs Shea to confirm it, it says so.

Built as a variant: `?caps=b` shows the Designer's lines for Brain Dump, Cipher and Amp. The other tiles keep today's line in that variant.

## Facts the lines draw on

| Project | Fact | Where it is |
|---|---|---|
| Smoking Snapshot | 1,000+ snapshots completed | homepage card, snapshot.html |
| | 41,904 clicks from paid social | homepage card, snapshot.html |
| | 50% said it made them want to smoke less; 46% were surprised by their total | snapshot.html |
| | 52% said they'd rethink how much they smoke | homepage card (see the flag at the end) |
| Quit28 | Launched 19 October; 40 quit dates saved in its first week | homepage card, quit28.html |
| | 17 smoke-free days logged; 5 clicked through to a stop smoking service or the NHS finder | quit28.html |
| JumpStart | In pilot with the National Football Museum; early feedback "really positive" | homepage card, jumpstart.html |
| | Reports open with one sentence and are checked by the account lead before they go out | jumpstart.html |
| Brain Dump | Personal project, in beta; built because Shea kept losing track across too many apps | homepage, braindump.html |
| Cipher | Concept at Ulster University; brand, website and app designed from scratch | cipher.html |
| Amp | Concept at Ulster University; one button for volume and for picking a nearby speaker | amp.html |
| Shipped | 38 things since August (counted live from shipped.json), updated weekly | homepage |

## Options per tile

The recommendation for each tile is marked **(pick)**.

**Smoking Snapshot.** Today: "Used 1,000+ times for the NHS"
1. Used 1,000+ times for the NHS **(pick: keep it)**
2. 1,000+ snapshots, and half wanted to smoke less
3. 41,904 clicks from paid social, 1,000+ finished

**Quit28.** Today: "A 28-day quit plan, live now"
1. 40 quit dates saved in its first week **(pick)**
2. Live for the NHS, 40 quit dates in week one
3. A 28-day quit plan, 40 starts in its first week

**JumpStart.** Today: "Paid media reporting, in pilot with the National Football Museum"
1. In pilot with the National Football Museum **(pick)**
2. Reports that lead with the answer, in pilot
3. Paid media reports in plain English, in pilot with the National Football Museum

**Brain Dump.** Today: "Sorts what you type or say"
1. Personal tool, in daily use (Designer's line, in `?caps=b`). **Shea to confirm "daily use" is true.** The site doesn't say this anywhere yet.
2. Built for me, in beta: talk and it files the lot **(pick, if daily use isn't confirmed)**
3. One place for what I kept losing across apps

**Cipher.** Today: "A concept AI-first bank"
1. Concept · Brand, web and app (Designer's line, in `?caps=b`) **(pick)**
2. Concept · An AI-first bank, brand to app
3. Concept · A bank brand built from scratch

**Amp.** Today: "A concept music player"
1. Concept · Music player (Designer's line, in `?caps=b`)
2. Concept · One button for volume and speakers **(pick)**
3. Concept · Rethinking volume on a phone

**Shipped.** Today: "38 things since August"
1. 38 things since August **(pick: keep it, the number stays live)**
2. 38 things shipped since August, updated weekly

## Should concept tiles get a small "Concept" tag?

Yes. Cipher and Amp are uni concepts sitting next to client work that's live for the NHS. A tag stops anyone mistaking them for client launches. It also frees the line to say what the idea is instead of spending its first word on "concept". The full cards already carry a "Concept" label at the top, but the current caption layout hides it.

The lightest version is the Designer's "Concept ·" prefix, which needs no new styling. A tag drawn in the existing `.label` style would read as a tag rather than as words, but it's a new element on the tiles, so it's for Shea to choose. It's not built yet.

## Flags for Shea

- **Brain Dump "in daily use"**: only use it if it's true.
- **Snapshot 52% vs 50%**: the homepage card says "52% said they'd rethink how much they smoke". The case study says "50% said it made them want to smoke less" and "46% were surprised by their total". One of them should change so they match.
- **Hero A subline** ("Smoking Snapshot and Quit28 for the NHS, used 1,000+ times") reads as if both tools were used 1,000+ times. The 1,000+ figure is Snapshot's. Built word for word as supplied; a fix would be "Smoking Snapshot and Quit28 for the NHS. Snapshot alone was used 1,000+ times."

## Fable's critique

A separate review on Claude Fable 5.2 checked every option against the pages. Its critique, as written:

**1. Not supported by the pages**

- Snapshot 2, "1,000+ snapshots, and half wanted to smoke less": reads as half of the 1,000+. snapshot.html says "50% said it made them want to smoke less" with no base given; it comes from the optional last screen ("Answer while it's fresh"). Drop it.
- Quit28 3, "40 starts in its first week": quit28.html has "Clicked Start 55" and "Saved a start date 40". "Starts" points at the wrong number.
- Amp 2 (the pick), "volume and speakers": amp.html says it "shows every nearby device". "Speaker" is not on the page.
- Brain Dump 1, "in daily use": unsupported, as flagged, but the line is already in index.html markup. Remove it until confirmed.
- Brain Dump 3: the page says "losing track of things", not losing things.
- "For the NHS" (Snapshot 1, Quit28 2): the pages say "Smoking Ends Here, for Champs and the NHS" and "an NHS campaign". Defensible shorthand; Shea should know it is shorthand.

**2. Weak or too long**

- Snapshot 3 puts 41,904 beside 1,000+ and advertises a 2% finish rate.
- Quit28 1 never says what Quit28 is, and 40 looks small under Snapshot's 1,000+. "First week" also dates fast.
- JumpStart 3 is longer than today's line, which is already too long. JumpStart 1 is the right length but drops what the product is.
- Brain Dump 2 is two clauses and a colon; "files the lot" misquotes the site's "sorts the lot".
- Shipped 2 adds nothing to the number.
- "Concept ·" is awkward aloud and for screen readers.

**3. Better options**

- Snapshot: keep today's.
- Quit28: "A 28-day quit plan, 40 quit dates in week one"
- JumpStart: "Paid media reports, in pilot with the National Football Museum" if it fits one line, otherwise option 1.
- Brain Dump: "Type or talk, and it sorts the lot"
- Cipher: "Concept · An AI-first bank" (option 1 never says bank)
- Amp: "Concept · One button for volume and nearby devices"

**4. Concept tag**

Agree. Use the prefix, not a new element. The homepage text also has an "Earlier concepts" label above Cipher and Amp; if that shows beside the tiles, the prefix is redundant.

**5. Missed**

- Every case page's "Next" links repeat these captions (snapshot.html shows "Quit28 / A 28-day quit plan, live now"). Changes must land on all seven pages.
- Snapshot ran "May to September 2026" and Quit28 says "live now"; time-bound lines need a review date.
- quit28.html notes counts are "per phone, not per person", so never write "40 people".
- I did not check that 38 matches shipped.json.

## Where that leaves the picks

Fable is right on the facts. Snapshot 2, Quit28 3, Amp 2 and Brain Dump 3 come out, and Fable's lines replace them:

| Tile | Pick now |
|---|---|
| Smoking Snapshot | Used 1,000+ times for the NHS (keep) |
| Quit28 | A 28-day quit plan, 40 quit dates in week one |
| JumpStart | Paid media reports, in pilot with the National Football Museum |
| Brain Dump | Type or talk, and it sorts the lot (or the Designer's line once "daily use" is confirmed) |
| Cipher | Concept · An AI-first bank |
| Amp | Concept · One button for volume and nearby devices |
| Shipped | 38 things since August (keep) |

On Fable's other points:
- **"Earlier concepts"**: that label is hidden on the live homepage, so the prefix isn't doubled up.
- **"Concept ·" read aloud**: a screen reader says "Concept dot". If the prefix ships, put the dot in a span with `aria-hidden="true"` and add a comma for the screen reader.
- **38**: checked. shipped.json has 38 published entries (42 with drafts). The page counts them live, and the static fallback in the HTML now says 38 too.
- **"In daily use"**: it's only in the `?caps=b` variant, which is hidden by default. It shouldn't ship until Shea confirms it.
- **Next tiles**: whichever lines ship need copying to the Next links on all seven case pages.
