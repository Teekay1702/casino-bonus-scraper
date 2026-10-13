# Casino Bonus Tracker

Scrapes bonus text for three casinos from one public source, uses an LLM to turn the free text into structured fields, and shows the result on a static page.

## Status (read first)

| Part | State |
|---|---|
| Scraper pipeline (robots check, fetch, LLM extraction, validation, JSON output) | Written. Live fetch and LLM call **not yet run**. |
| Source selectors (`SOURCE_CONFIG`) | Set for `https://www.casinomeister.com/casino-bonuses/`. Tested only against a saved copy of that page (returned 3 records); not yet against the live site. |
| `data/casinos.json` | **Not generated.** Needs a run with your API key. |
| Webpage | Written. Not yet viewed in a browser. |
| GitHub Pages workflow | Written. Not deployed. |

The build environment could not reach the site or the Anthropic API, so the live fetch and the LLM step were never run. The selectors were checked against a page you saved from your browser.

## Layout

```
scraper/scraper.py        # the scraper (single command)
scraper/requirements.txt
data/casinos.json         # generated output (commit it so Pages can publish it)
web/index.html, style.css, app.js
.github/workflows/pages.yml
.env.example, .gitignore
```

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r scraper/requirements.txt
cp .env.example .env      # then put your key in .env
```

`.env` holds `ANTHROPIC_API_KEY=...`. It is git-ignored and never read by the website.

## Source notes

- Source: `https://www.casinomeister.com/casino-bonuses/`. The scraper re-checks robots.txt at run time and stops if the URL is disallowed. **Read the site's terms of use yourself before running it**; I have not.
- Each casino is an `li.casino-item`. Name and `source_url` come from the review-page link; the offer and terms come from the listing text.
- The "Visit" and "Terms Apply" links are `/goto/` affiliate redirects. The scraper never uses or follows them.
- Only a few casinos on that page publish their own terms text (the rest show generic "Restrictions Apply" boilerplate). The scraper takes the first three that do, so records are not built from boilerplate. Some terms lack a wagering requirement, which then shows as "Not stated".
- If the site blocks plain HTTP requests, or the live HTML differs from the saved copy, the scraper errors out. Do not bypass blocks; choose another source or update the selectors in `SOURCE_CONFIG`.

## Run

```bash
python scraper/scraper.py
```

It exits with a clear error if robots.txt disallows the URL, the page is blocked, the key is missing, or fewer than three valid records are found. In those cases it writes nothing.

## Test the page locally

```bash
python -m http.server 8000     # run from the project root
# open http://localhost:8000/web/
```

## Deploy to GitHub Pages

1. Create a GitHub repo and push this project to `main` (with `data/casinos.json` committed, `.env` not).
2. Repo Settings, Pages, Source: **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` publishes `web/` and `data/` together. Check the Actions tab, then open `https://<user>.github.io/<repo>/`.

To refresh data: run the scraper locally, then `git add data/casinos.json && git commit -m "Update data" && git push`. The workflow redeploys.

## How it works

1. `scraper.py` checks robots.txt, fetches the page with `requests`, and parses three casino blocks with BeautifulSoup.
2. The Anthropic API is called once per casino with a forced tool call, which returns `bonus_offer`, `max_bonus`, `wagering_requirement` (or null). This is the only LLM step.
3. Validation drops values that are not strings, and any value containing a number that does not appear in the original terms, so nothing is invented.
4. Results are written to `data/casinos.json`; `web/app.js` fetches it and renders the table, showing "Not stated" for nulls.

## Schema (illustrative only, not real scraped data)

```json
{
  "casino_name": "Example Casino",
  "bonus_offer": "string or null",
  "max_bonus": "string or null",
  "wagering_requirement": "string or null",
  "source_url": "https://...",
  "original_terms": "raw text from the source",
  "scraped_at": "ISO-8601 timestamp"
}
```
