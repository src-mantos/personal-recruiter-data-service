//# sourceMappingURL=dist/src/scrape/PostScraper.js.map
import { ComponentError, NavigationError, IPostDataScrapeRequest, IPostData } from '../types';
import { chromium, Browser, Page, Locator } from 'playwright';
import { LocalEventing } from './LocalEventing';
import path from 'path';
import { inject } from 'tsyringe';
import PostData from '../entity/PostData';

function IgnoreFactory(page: Page | undefined) {
    return function (ex: any) {
        const err: Error = ex;
        //console.log('Ignore: %s', err.message);
        if (page)
            page.screenshot({
                path: path.join(__dirname, '../../dist', 'IF-failure-' + new Date().getTime() + '.png'),
            });
    };
}

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
    templateVars: string[];
    urlTemplate: string;
    linkSelector: string;
    linkAttributes: string[];
    vendorDesc: string;
    runData: PostData[];

    constructor(@inject('scrape_template_vars') variables: string) {
        super();
        this.currentPage = 0;
        this.elementCount = 0;
        this.templateVars = variables.split(',');
        this.urlTemplate = '';
        this.runData = [];
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
            const err: ComponentError = new Error('Scrape Browsers need to be defined to generate a new page');
            throw err;
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

    public getPageData(): IPostData[] {
        return this.runData;
    }
    protected abstract nextPage(search?: IPostDataScrapeRequest): Promise<void>;
    /**
     * implementation specific direct url scraping capabilities. add to the post data supplied
     * @param post
     * @param page
     */
    protected abstract scrapePostData(post: PostData, page: Page): Promise<PostData>;
    /**
     * Stubb implementation for decorating/transforming post data from primary search index
     * @param post
     * @returns
     */
    protected decorateMetaData(post: PostData): PostData {
        return post;
    }

    /**
     * Primary Entry Point for scraping post data.
     * - verify argument object
     * - fetch search index <primary failure pt>
     * - track index page data (width first)
     * - fetch post data by local index
     * @param IPostDataScrapeRequest
     */
    public async run(search: IPostDataScrapeRequest): Promise<string> {
        if (!search.uuid) {
            const err: ComponentError = new Error('No Search UUID to associate results');
            throw err;
        }

        //let dataSet: PostData[] = [];
        await this.navigateToPrimarySearch(search);

        let indexCt = 0;
        for (let i = 1; i <= search.pageDepth; i++) {
            const pageIndex: PostData[] = await this.buildDataTree();
            this.runData = this.runData.concat(pageIndex);
            indexCt += pageIndex.length;

            if (i < search.pageDepth) {
                await this.nextPage(search);
            }
        }
        console.log('[Index] ' + indexCt);
        try {
            await this.fetchPostDataSet(this.runData);
        } catch (ex) {
            console.error('Runtime Exception', ex);
        }

        return 'FAIL';
    }

    /** Common Abstraction Layer*/
    protected buildPrimaryURL(search: IPostDataScrapeRequest): string {
        let url = '' + this.urlTemplate;

        url = url.replace('@{searchTerm}', encodeURIComponent(search.keyword));

        if (search.location) {
            url = url.replace('@{location}', encodeURIComponent(search.location));
        } else {
            url = url.replace('@{location}', '');
        }

        url = url.replace('@{pageIndex}', '' + this.currentPage);
        url = url.replace('@{pageSize}', '20');

        return url;
    }

    protected async navigateToPrimarySearch(search: IPostDataScrapeRequest) {
        if (this.page == undefined) {
            throw new ComponentError('Page Object Undefined', '[PostScraper]');
        }
        const url = this.buildPrimaryURL(search);
        console.log('[Primary URL] ' + url);
        await this.page.goto(url);
        await this.page
            .waitForNavigation({ waitUntil: 'networkidle', timeout: 120000 })
            .catch(IgnoreFactory(this.page));
    }

    protected async buildDataTree(): Promise<PostData[]> {
        if (this.page == undefined) {
            throw new ComponentError('Page Object Undefined', '[PostScraper]');
        }
        let retries = 3;
        let linkCt = 0;
        let links: Locator | undefined = undefined;
        while (linkCt == 0 && retries > 0) {
            try {
                links = this.page.locator(this.linkSelector);
                linkCt = await links.count();
            } catch (ex) {
                //Catching
                linkCt = 0;
            }
            retries--;
            if (linkCt == 0) {
                //Prettier Math Fail
                let to = 3000 * Math.random();
                to += 500;
                await this.page
                    .waitForNavigation({ waitUntil: 'networkidle', timeout: to })
                    .catch(IgnoreFactory(this.page));
            }
        }
        if (linkCt <= 0 || links == undefined) {
            console.error(
                JSON.stringify({
                    url: this.page.url(),
                    retries: retries,
                })
            );
            const err: NavigationError = new Error(
                'No job post data found with primary link selector [' + this.linkSelector + ']'
            );
            throw err;
        }

        const dataSet: PostData[] = [];
        for (let index = 0; index < linkCt; index++) {
            const link = links.nth(index);
            const linkData = await this.getAttributes(link, this.linkAttributes);

            const shell = new PostData();
            shell.indexMetadata = {
                postIndex: index,
                pageIndex: this.currentPage,
                pageSize: linkCt,
                completed: false,
            };

            shell.directURL = linkData['href'];
            if (shell.directURL == undefined) {
                const err: ComponentError = new Error('No direct URL has been captured');
                throw err;
            }

            shell.vendorMetadata.metadata = {
                linkData: linkData,
                vendor: this.vendorDesc,
            };

            this.decorateMetaData(shell);

            dataSet.push(shell);
        }
        return dataSet;
    }
    /**
     * Primariy handling fetches let sub-classes handle specifics
     * @param dataSet
     * @returns
     */
    async fetchPostDataSet(dataSet: PostData[]): Promise<PostData[]> {
        for (const post of dataSet) {
            const page = await this.createNewPage();
            let complete = post.indexMetadata.completed;
            let retries = 5;
            while (!complete && retries > 0) {
                try {
                    await page.goto(post.directURL);
                    await page
                        .waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 })
                        .catch(IgnoreFactory(this.page));
                    await this.scrapePostData(post, page);
                    complete = true;
                    post.indexMetadata.completed = true;
                    //TODO: update post with status-ing
                } catch (ex) {
                    console.error('Failed to retrieve Job Post, reattempting:', JSON.stringify(post));
                    retries--;
                }
            }
            await page.close();
        }
        return dataSet;
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
