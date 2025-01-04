# InkIt

InkIt is an innovative AI-powered platform that revolutionizes real estate contract generation. This prototype focuses on demonstrating the core contract generation functionality, enabling users to create residential sales contracts through natural conversation.

## Features

- Conversational contract generation
- Property information retrieval via MLS integration
- PDF contract generation with customizable templates
- Real-time contract preview and modification
- Future support for voice interactions

## Getting Started

### Prerequisites

- Python 3.9+
- Virtual environment (recommended)
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/labsdao/InkIt.git
cd InkIt
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your Groq API key
```

## Usage

1. Start the Streamlit interface:
```bash
streamlit run src/main.py
```

2. Follow the conversational prompts to:
   - Provide property details
   - Specify contract terms
   - Review and modify the generated contract
   - Download the final contract

### Project Structure
```
src/
├── main.py                # Graph setup and application entry point
├── tools.py               # Tool implementations (MLS + Contract Generation)
├── config.py              # Settings and system prompt
├── voice.py              # Future voice integrations
├── templates/            # Contract Templates
└── tests/               # Test Suite
```

A minimalistic frontend for interacting with [LiveKit Agents](https://docs.livekit.io/agents).

![Screenshot of the frontend application.](/.github/assets/frontent-screenshot.jpeg)

> [!TIP]
> The best way to test this application along with many others is to use [LiveKit Sandbox](https://cloud.livekit.io/projects/p_/sandbox). Spin up your sandbox in a matter of seconds and test and share your local agents without having to worry about hosting your front end.

## Development setup

- Copy and rename `.env.example` to `.env.local`, then add the required environment variables to connect to your LiveKit server.

> [!TIP]
> If you are using **LiveKit Cloud**, you can find your project environment variables [here](https://cloud.livekit.io/projects/p_/settings/keys).

```shell
# Make sure dependencies are installed (only required once).
pnpm install
# Run den local development server.
pnpm dev
# Open http://localhost:3000 in your browser.
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
