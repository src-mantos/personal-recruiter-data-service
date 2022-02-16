//# sourceMappingURL=dist/scrape/PostScraper.js.map
import * as types from '../types';
import { chromium, Browser, Page } from 'playwright';
import { LocalEventing } from './LocalEventing';

/**
 * (abstract) PostScraper -
 * Polymorphic container for Scrape implementations
 */
export abstract class PostScraper extends LocalEventing {
    /** @type {number} related to {@link types.IPostDataScrapeRequest.pageDepth} */
    currentPage: number;
    /** @type {number} */
    elementCount: number;
    /** @private @type {Browser} Playwright Scrape browser window*/
    browser?: Browser;
    /** @private @type {Page} Playwright Scrape Page*/
    page?: Page;

    constructor() {
        super();
        this.currentPage = 0;
        this.elementCount = 0;
    }

    async init(): Promise<void> {
        if (this.browser == undefined) {
            this.browser = await chromium.launch();
        }
        if (this.page == undefined) {
            this.page = await this.browser.newPage();
            await this.page.route('/**', (route) => {
                if ([`stylesheet`, `image`, `media`, `font`].indexOf(route.request().resourceType())) {
                    route.abort();
                } else {
                    route.continue();
                }
            });
        }
    }
    async clearInstanceData(): Promise<void> {
        this.currentPage = 0;
        this.elementCount = 0;
        if (this.page != undefined) {
            await this.page.close();
            this.page = undefined;
        }
        if (this.browser != undefined) {
            await this.browser.close();
            this.browser = undefined;
        }
    }

    /**
     * Primary Entry Point for scraping post data. <br/>
     * Working under the assumption that these sites will maintain some kind of 508c compliance,
     * it will make sense to parse the anchor tags that relate to a posting.
     * @param search
     */
    abstract searchPostings(search: types.IPostDataScrapeRequest): Promise<types.IPostData[]>;
    abstract nextPage(): void;
    abstract getPageData(): types.IPostData[];
}
