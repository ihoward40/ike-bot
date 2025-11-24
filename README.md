# IKE BOT – Trust Automation Engine

This repo powers affidavit generation, UCC lien automation, IRS rebuttals, FOIA requests, and trust logging with:
- Notion logging + archiving
- Gmail PDF delivery
- Google Drive uploads
- Daily email digest
- Form intake + webhook endpoint

## Setup

For detailed setup instructions including the Trust Navigator API dependency, see [SETUP.md](SETUP.md).

### Quick Start
1. Clone this repo
2. Add `.env` file from `.env.example`
3. Install dependencies: `pip install -r requirements.txt`
4. Run locally: `python main.py`

**Note**: For full functionality, you'll also need to set up the [trust-navigator-api](https://gitlab.com/howard-trust-systems/trust-navigator-api) as documented in [SETUP.md](SETUP.md).
