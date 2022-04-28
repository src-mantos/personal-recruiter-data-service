//# sourceMappingURL=dist/src/scrape/PostScraper.js.map
import * as types from '../types';
import { IPostDataScrapeRequest, IPostData } from '../types';
import { chromium, Browser, Page, Locator } from 'playwright';
import { LocalEventing } from './LocalEventing';
import path from 'path';

/**
 * (abstract) PostScraper -
 * Polymorphic container for Scrape implementations
 */
export abstract class PostScraper extends LocalEventing {
    /** @type {number} related to {@link IPostDataScrapeRequest.pageDepth} */
    currentPage: number;
    /** @type {number} */
    elementCount: number;
    /** @private @type {Browser} Playwright Scrape browser window*/
    browser?: Browser;
    /** @private @type {Page} Playwright Scrape Page*/
    page?: Page;
    /** @type {string} */
    baseUrl: string;
    /** @type {string} */
    locUri: string;
    postFixUri: string;

    constructor() {
        super();
        this.currentPage = 0;
        this.elementCount = 0;
    }

    /**
     * Initialize the Playwright Browser & Page Objects
     */
    async init(): Promise<PostScraper> {
        if (this.browser == undefined) {
            this.browser = await chromium.launch();
        }
        if (this.page == undefined) {
            this.page = await this.createNewPage();
        }
        console.log('Scrape Init Complete.');
        return this;
    }
    /**
     * a general purpose page/tab for scrape usage. also initializes networking short cuts.
     * @returns playwright.Page
     */
    async createNewPage(): Promise<Page> {
        if (this.browser == undefined) {
            throw new Error('Scrape Browsers need to be defined to generate a new page');
        }

        const page = await this.browser.newPage();
        await page.route('/**', (route, request) => {
            // document, script, texttrack, xhr, fetch, eventsource, websocket
            if (['stylesheet', 'image', 'media', 'font', 'manifest', 'other'].indexOf(request.resourceType())) {
                route.abort();
            } else {
                route.continue();
            }
        });

        return page;
    }
    /**
     * Playwright Object Destruction
     */
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
     * @param IPostDataScrapeRequest
     */
    abstract searchPostings(search: IPostDataScrapeRequest): Promise<IPostData[]>;
    abstract nextPage(): void;
    abstract getPageData(): IPostData[];

    /** Common Abstraction Layer*/
    private async navigateToPrimarySearch(search: IPostDataScrapeRequest) {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        let url = this.baseUrl + encodeURIComponent(search.keyword);
        if (search.location) {
            url += this.locUri + encodeURIComponent(search.location);
        }
        url += this.postFixUri;
        await this.page.goto(url);
    }

    /** Utility Methods that would be useful in all scrapers */
    async getAttributes(domItem: Locator, attributes: string[]): Promise<{ [key: string]: any }> {
        const retVal: any = {};
        for (const key of attributes) {
            retVal[key] = await domItem.getAttribute(key);
        }
        return retVal;
    }

    async captureError() {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const errTime = new Date();
        await this.page.screenshot({
            path: path.join(__dirname, '../../../dist', 'failure-' + errTime.getTime() + '.png'),
        });
    }
}
