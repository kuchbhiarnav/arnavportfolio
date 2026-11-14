# 01 — Content audit

Date: 2026-11-07. Baseline: `Arnav Patnaik CV.pdf` (created 30 Oct 2026). Statuses: **verified** (checked against a primary source), **owner-supplied** (your CV or text you supplied, consistent), **held** (not published or given to the assistant until you decide).

## Priorities

| # | Item | Status |
|---|---|---|
| 1 | The old public `resume.pdf` published two referees' email addresses and a phone number | Not carried over. The new site serves only the October 2026 CV. **Remove the old file from the live site.** |
| 2 | `Degree.jpg` showed your university ID, serial number, QR code, photo and **your parents' names** | Replaced by a redacted copy (bars applied at full resolution before export; checked by eye). **Remove the original from the live site.** |
| 3 | Article bylines and dates were wrong | Fixed: second author on both GSA papers, real presentation dates, presenting author stated |
| 4 | Google Analytics loaded unconditionally, twice on 7 pages, and the Privacy Policy didn't mention it | Consent-gated, loaded once, privacy page rewritten |
| 5 | Project covers are AI-style illustrations with invented figures (e.g. the CodeX cover says 4,447 respondents; your README says 10,000); the Ad-Hoc cover carries a stock "PREMIUM" mark | Kept (you like them) but labelled as illustrations everywhere. **Replace with real screenshots; check the licence of the Ad-Hoc cover** |
| 6 | `introvid.mp4` (9.7 MB) shows an unidentified person at a website-creation whiteboard | Kept as an ambient band (compressed to 0.9 MB, muted, pausable). **Confirm who appears in it and that you may use it** |
| 7 | Article photos (children at a hand pump; a face with a wireframe) have unknown licence | Not carried over |
| 8 | Skills marquee showed 42 tools loaded from two third-party CDNs, most with no evidence (Django, Docker, Flask…) | Replaced by 19 evidence-linked tiles with self-hosted icons |

## Existing issues you asked me to investigate

| # | Question | Finding | Handling |
|---|---|---|---|
| 1 | Is the featured work your strongest? | No. The four featured projects are practice/challenge work; your strongest evidenced work is the groundwater research and Plutas Insure | Two case studies lead; the four projects are labelled supporting work |
| 2 | CV vs résumé | 13 differences found (`_planning/01-source-and-claims-register.md`) | Table below |
| 3 | Brussels vs Pune | CV: Brussels, +32. Old résumé and site: Pune, +91 | Site says Brussels (CV is the baseline); **no phone number in any page or in the assistant** (the CV PDF still contains one) |
| 4 | Climate pipelines: Plutas or DigiSafe | CV says Plutas, old résumé says DigiSafe | **Held.** Case study 3 is a draft that is never built for production; the bullet is held from the résumé page and the assistant |
| 5 | Event names, dates, authorship | Verified on the GSA pages: second author on both; Bhattacharya presented 2025; 2024 page names no presenter | Fixed everywhere |
| 6 | Are the "January 1" dates real? | No. Real dates: 22 Sep 2024 and 22 Oct 2025 | Placeholders removed; JSON-LD never emits `datePublished` |
| 7 | Rounded grades | CV 8/10, old résumé 7.91. **Degree certificate says CGPA 8.00** | Resolved: 8.00, first division with distinction |
| 8 | Overlapping roles | DigiSafe 08/2024–04/2025 overlaps Plutas 09/2024–present | Timeline draws parallel bars with a note |
| 9 | Accessibility | Old: no skip link, click-handled `div` cards, modals without roles/focus management, no `aria-expanded`, no reduced-motion rules | New: semantic landmarks, real links/buttons, native `<dialog>`, ARIA tabs, `inert` flip-card faces, reduced-motion fallbacks. axe-core: 0 violations on every page |
| 10 | Images, fonts, metadata, duplicated code | Old: 46 MB assets, 6–7 MB covers, Google Fonts at runtime, relative `og:image`, copy-pasted inline scripts | New: 4.1 MB site, WebP/AVIF-ready pipeline, self-hosted fonts, one layout |

## Conflicts and how the site handles them

| # | Conflict | Decision in the build | Needs from you |
|---|---|---|---|
| C1 | Location/phone | Brussels; email only | Confirm location; decide whether the CV PDF should keep the phone |
| C2 | CGPA | **Resolved**: 8.00 (certificate) | — |
| C3 | Pipelines employer | Held | Tell me which employer |
| C4 | Wix site (old résumé only) | Omitted | Confirm |
| C5 | HDFC Ergo in CV only | Kept as "materials for" (CV baseline); no outcome claimed | Confirm |
| C6 | Feynn Labs (old résumé only) | Kept, marked "from an earlier résumé" | Confirm it should appear |
| C7 | "DigiSafe Insurance Broking" vs "Insurance" | CV name | — |
| C9, C10 | Bylines/dates | Fixed from primary sources | — |
| C11 | "As India 2024, Best Oral" | **Not published** | Proof (programme page or certificate) |
| C12 | Deepfake paper | Listed with title, "co-authored" and the IEEE link; venue/date/authors "being confirmed" | Open the IEEE page and send title, authors, date |
| C13 | Referees on the old résumé | Not carried over | — |

## Claims on the new site

| Claim | Source | Status |
|---|---|---|
| Second author, GSA Connects 2025 (22 Oct 2025, abstract 235-11); Bhattacharya presenting | GSA programme page | verified |
| Second author, GSA Connects 2024 (22 Sep 2024, Paper 62-8) | GSA programme page | verified |
| BE CSE (Hons.), AI & ML with IBM, CGPA 8.00, first division with distinction, issued 20 Aug 2024 | Degree certificate (viewed) | verified |
| 2nd prize, Codebasics resume project challenge, 10 Jul 2023 (Telangana) | Certificate image (viewed) | verified |
| 6.37M records, ETL, classification, Power BI, Figma wireframes | CV; consistent with the abstracts | owner-supplied |
| 279 + 61 bore logs, 13 soil textures, 19 sensors, WHO 10 / Bangladesh 50 µg/L | Abstract text you supplied | owner-supplied |
| Plutas Insure research, wireframes, investor materials | CV | owner-supplied |
| +20% / +25% / −40% figures | CV | owner-reported, no stated basis: shown only on the Résumé page, flagged, never in case studies or the assistant |
| Power BI, SQL, Excel certificates | Links you supplied | not opened by me |
| Deepfake paper details | Résumé; IEEE page could not be fetched | unconfirmed (minimal listing) |
