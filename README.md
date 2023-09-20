# Sitemap Generator

A simple yet powerful sitemap generator written for Node.js.

## Installation

Yarn

```bash
yarn add @mongez/sitemap
```

NPM

```bash
npm i @mongez/sitemap
```

PNPM

```bash
pnpm i @mongez/sitemap
```

BUN

```bash
bun add @mongez/sitemap
```

## Usage

Import the sitemap class, pass the base url and locale codes to it, then add the pages to the sitemap.

```ts
import { Sitemap } from "@mongez/sitemap";

const sitemap = new Sitemap("https://example.com", ["en", "ar"]);

sitemap.add("/").add("/about-us").add("/contact-us");

await sitemap.saveTo("/path/to/sitemap.xml");
```

And that's it

This will create a sitemap with links, each link will have the original path along with the locale code as well.

## Generate Only

If you want just the xml sitemap without saving it to a file, you can use the `generate` method.

```ts
const xml = await sitemap.generate();
```

Alternatively, you can use the `toXml` method.

```ts
const xml = await sitemap.toXml();
```
