import { putFile } from "@mongez/fs";
import { clone, ltrim } from "@mongez/reinforcements";

export type SitemapPath = {
  /**
   * The relative path to the website
   */
  path: string;
  /**
   * Last modification date
   */
  lastModified?: Date | string;
  /**
   * Change frequency
   */
  changeFrequency?: string;
  /**
   * Priority
   */
  priority?: number;
  /**
   * Hreflang
   * If you have multiple languages, you can add the hreflang, it will be used automatically if locale codes are set
   */
  hreflang?: {
    [localeCOde: string]: string;
  };
};

export class Sitemap {
  /**
   * Paths list
   */
  protected paths: SitemapPath[] = [];

  /**
   * Whether to split the sitemap into multiple files
   */
  protected _split = false;

  /**
   * Max number of URLs per sitemap
   */
  protected _maxURLsPerSitemap = 50000;

  /**
   * Whether to split the sitemap based on the languages
   */
  protected _splitByLanguages = true;

  /**
   * Constructor
   */
  public constructor(
    protected baseUrl: string,
    protected localeCodes: string[] = []
  ) {
    //
  }

  /**
   * Set locale codes
   */
  public setLocales(localeCodes: string[]) {
    this.localeCodes = localeCodes;

    return this;
  }

  /**
   * Whether to split the sitemap into multiple files
   */
  public split(split = true) {
    this._split = split;

    return this;
  }

  /**
   * Max number of URLs per sitemap
   */
  public maxURLsPerSitemap(maxURLsPerSitemap: number) {
    this._maxURLsPerSitemap = maxURLsPerSitemap;

    return this;
  }

  /**
   * Whether to split the sitemap based on the languages
   */
  public splitByLanguages(splitByLanguages = true) {
    this._splitByLanguages = splitByLanguages;

    return this;
  }

  /**
   * Add new route
   */
  public add(path: SitemapPath | string) {
    this.paths.push(this.parsePath(path));
  }

  /**
   * Parse route
   */
  protected parsePath(path: SitemapPath | string) {
    if (typeof path === "string") {
      path = { path };
    }

    const internalRoute = clone(path);

    if (!internalRoute.priority) {
      internalRoute.priority = 1;
    }

    // now check for the locale codes
    if (this.localeCodes.length) {
      // now add to the internalRoute the hreflang
      internalRoute.hreflang = {};

      // now loop through the locale codes
      for (const localeCode of this.localeCodes) {
        // now add the hreflang
        internalRoute.hreflang[localeCode] = `${
          this.baseUrl
        }/${localeCode}/${ltrim(internalRoute.path, "/")}`;
      }
    }

    internalRoute.path = `${this.baseUrl}/${ltrim(internalRoute.path, "/")}`;

    return internalRoute;
  }

  /**
   * Save the sitemap to the given path
   */
  public async saveTo(path: string) {
    //
    const content = await this.generate();

    putFile(path, content);

    return this;
  }

  /**
   * Get the sitemap paths length
   */
  public get length() {
    return this.paths.length;
  }

  /**
   * Make it iterable
   */
  public [Symbol.iterator]() {
    return this.paths[Symbol.iterator]();
  }

  /**
   * Generate the sitemap XML string
   */
  public async generate(limit?: number) {
    return new SiteMapGenerator().add(...this.paths).generate(limit);
  }

  /**
   * Generate sitemaps list
   */
  public async generateSitemapsList() {
    return new SiteMapGenerator().add(...this.paths).generateSitemapsList();
  }

  /**
   * Generate a sitemap index and generate sitemap for each locale code and merge them in one file
   */
  public async generateMultiLanguage() {
    // now generate the sitemap index
    const sitemapIndex = new Sitemap(this.baseUrl);

    for (const localeCode of this.localeCodes) {
      const sitemap = new Sitemap(`${this.baseUrl}/${localeCode}`);

      for (const route of this.paths) {
        sitemap.add(route);
      }

      await sitemap.toXML();

      sitemapIndex.add(`/sitemap-${localeCode}.xml`);
    }

    return sitemapIndex.generateSitemapsList();
  }

  /**
   * Return as xml
   */
  public async toXML() {
    return await this.generate();
  }
}

class SiteMapGenerator {
  /**
   * urls list
   */
  protected urls: SitemapPath[] = [];

  /**
   * Constructor
   */
  public add(...urls: SitemapPath[]) {
    for (const url of urls) {
      this.urls.push(url);
    }
    return this;
  }

  /**
   * Generate the sitemap XML string
   */
  public async generate(limit?: number) {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlNamespace = `http://www.sitemaps.org/schemas/sitemap/0.9`;
    const xhtmlNamespace = `http://www.w3.org/1999/xhtml`;

    let xml = `${xmlHeader}\n<urlset xmlns="${xmlNamespace}" xmlns:xhtml="${xhtmlNamespace}">\n`;

    const routesList = limit
      ? clone(this.urls).slice(0, limit)
      : clone(this.urls);

    for (const route of routesList) {
      xml += `  <url>\n`;
      xml += `    <loc>${route.path}</loc>\n`;

      if (route.lastModified) {
        const lastModified =
          typeof route.lastModified === "string"
            ? route.lastModified
            : route.lastModified.toISOString();
        xml += `    <lastmod>${lastModified}</lastmod>\n`;
      }

      if (route.changeFrequency) {
        xml += `    <changefreq>${route.changeFrequency}</changefreq>\n`;
      }

      if (route.priority) {
        xml += `    <priority>${route.priority}</priority>\n`;
      }

      if (route.hreflang) {
        for (const [key, value] of Object.entries(route.hreflang)) {
          xml += `    <xhtml:link rel="alternate" hreflang="${key}" href="${value}" />\n`;
        }
      }

      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    return xml;
  }

  /**
   * Generate sitemaps list
   */
  public async generateSitemapsList() {
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
    const xmlNamespace = `http://www.sitemaps.org/schemas/sitemap/0.9`;

    let xml = `${xmlHeader}\n<sitemapindex xmlns="${xmlNamespace}">\n`;

    const routesList = clone(this.urls);

    for (const route of routesList) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>${route.path}</loc>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += `</sitemapindex>\n`;

    return xml;
  }
}
