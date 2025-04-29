[![codecov](https://codecov.io/gh/clementvidon/devbarometer/branch/main/graph/badge.svg)](https://codecov.io/gh/clementvidon/devbarometer)

# DevBarometer

The dev job market barometer — powered by Reddit sentiment.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Automation](#automation)
4. [License](#license)

---

## Overview

DevBarometer is a daily snapshot of the French dev job market’s mood — powered by Reddit sentiment.

By analyzing fresh posts from r/developpeur, it reveals if the vibe is gold rush or hiring freeze.

Curious if it’s a good time to apply or complain? Let the devs tell you.

## Quick Start

### Requirements

1. Clone the repository:

```
git clone https://github.com/clementvidon/devbarometer.git
cd devbarometer
```

2. Install **NodeJS**: <https://nodejs.org/en/download>

> _NOTE: Ensure your Node version matches the one specified in the `engines` field of `package.json`._

3. Get an OpenAI API key: <https://platform.openai.com/>

> _NOTE: Make sure your OpenAI account has billing enabled and some credit — a few dollars are enough for testing._

### Run the app

Copy the `.env.example` file to `.env` in each subdirectory where it exists, and activate direnv.

1. **Set up environment variables**:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder with your actual API key:

```env
OPENAI_API_KEY=sk-...
```

2. **Install dependencies**:

```bash
npm install
```

3. **Run the project**:

```bash
npm start
```

## Automation

This runs daily via GitHub Actions and pushes public/index.html to GitHub Pages.

---

## License

[MIT](https://opensource.org/licenses/MIT)

This project is open source and freely available under the MIT License.
You are free to use, modify, and distribute it with attribution.
