![CI](https://github.com/clementvidon/devbarometer/actions/workflows/ci.yml/badge.svg)
![Coverage](https://codecov.io/gh/clementvidon/devbarometer/branch/main/graph/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-✓-blue)
![Last commit](https://img.shields.io/github/last-commit/clementvidon/devbarometer)

# DevBarometer

The dev job market barometer — powered by Reddit sentiment.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Automation](#automation)
4. [Contributing](#contributing)
5. [License](#license)

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

## Contributing

We welcome contributions to **improve the reliability and scalability of DevBarometer!**

### Focus Areas for Contribution

- **Data Quality and Sources**
  Help expand beyond Reddit by integrating other relevant communities or platforms.
  The goal is to reduce sampling bias and improve the richness and diversity of the dataset.

- **Model Improvement**
  Help refine emotion and relevance analysis by proposing or integrating better LLM models,
  for more precise and reliable sentiment detection.

- **Scalability**
  Help extend DevBarometer beyond the developer market.
  The methodology can be adapted into a broader **WorkBarometer** (or other domain-specific barometers)
  to assess sentiment trends in different professions or industries.

We are especially looking for contributions that make DevBarometer more **truthful, diverse, and extensible**.

Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

---

## License

[MIT](LICENSE)

This project is open source and freely available under the MIT License.
You are free to use, modify, and distribute it with attribution.
