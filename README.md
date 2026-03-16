## Suggestions bot

### Setup
- **Install**: `npm i`
- **Config**: copy `config.example.json` to `config.json` and fill values.
- **Register commands**: `npm run register`
- **Run**: `npm start`

### What it does
- Use `/suggestions` to set the suggestions channel (requires **Manage Messages** = `32768`).
- Any user message sent in that channel gets deleted and reposted as a **Container Builder** message with **Like / Dislike** buttons.
- Votes are stored in `data/suggestions.json` so counts persist.

