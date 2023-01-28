import { ComponentError, NavigationError, IScrapeRequest, IPostData, IRunMetric } from '../types';
import { chromium, Browser, Page, Locator } from 'playwright';
import { inject } from 'tsyringe';
import PostData from '../entity/PostData';
import { PostDao } from '../dao/PostDao';
import ScrapeRequest from '../entity/ScrapeRequest';
import { ScrapeDao } from '../dao/ScrapeDao';

function IgnoreFactory (page: Page | undefined) {
    return () => {};
}

/**
 * Common base class for scrape implementations.
 * the primary workflow for all implementations:
 * - await init();
 * - await run();
 *   - buildDataTree() // get a width first index of job post links & metadata
 *   - fetchPostDataSet() // get full post data from the index
 */
export abstract class PostScraper {
    /** @type {number} related to {@link IScrapeRequest.pageDepth} */
    currentPage: number;
    /** @type {number} */
    elementCount: number;
    /** @private @type {Browser} Playwright Scrape browser window */
    browser?: Browser;
    /** @private @type {Page} Playwright Scrape Page */
    page?: Page;
    templateVars: string[];
    urlTemplate: string;
    linkSelector: string;
    linkAttributes: string[];
    vendorDesc: string;
    runData: PostData[];
    postDao: PostDao;
    scrapeDao: ScrapeDao;

    /**
     * auto injected dependency @see tsyringe
     * @param variables
     * @param postDao
     */
    constructor (@inject('scrape_template_vars') variables: string,
                 @inject('PostDao') postDao: PostDao,
                 @inject('ScrapeDao') scrapeDao: ScrapeDao) {
        this.currentPage = 0;
        this.elementCount = 0;
        this.templateVars = variables.split(',');
        this.urlTemplate = '';
        this.runData = [];
        this.postDao = postDao;
        this.scrapeDao = scrapeDao;
    }

    /**
     * Initialize the Playwright Browser & Page Objects
     */
    public async init (): Promise<PostScraper> {
        if (this.browser === undefined) {
            this.browser = await chromium.launch({ headless: this.vendorDesc !== 'INDEED' });
        }
        if (this.page === undefined) {
            this.page = await this.createNewPage();
        }
        console.log(this.vendorDesc + ' Init Complete.');
        return this;
    }

    /**
     * a general purpose page/window for scrape usage. also initializes networking short cuts.
     * @returns {Page}
     */
    protected async createNewPage (): Promise<Page> {
        if (this.browser === undefined) {
            const err: ComponentError = new Error('Scrape Browsers need to be defined to generate a new page');
            throw err;
        }

        const page = await this.browser.newPage();
        page.setDefaultNavigationTimeout(1000 * 60 * 3);
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
    public async clearInstanceData (): Promise<void> {
        this.currentPage = 0;
        this.elementCount = 0;
        if (this.page !== undefined) {
            await this.page.close();
            this.page = undefined;
        }
        if (this.browser !== undefined) {
            await this.browser.close();
            this.browser = undefined;
        }
    }

    /**
     * @deprecated
     */
    public getPageData (): PostData[] {
        return this.runData;
    }

    /**
     * main iteration method for all search scrapers
     * Implemented by children
     * @param {IScrapeRequest} search
     */
    protected abstract nextPage(search?: IScrapeRequest): Promise<void>;
    /**
     * implementation specific direct url scraping capabilities. add to the post data supplied
     * Implemented by children
     * @param post
     * @param page
     */
    protected abstract scrapePostData(post: PostData, page: Page): Promise<PostData>;
    /**
     * any implementation specific "index" transformations before in-depth data collection
     * @param post
     * @returns
     */
    protected transformMeta (post: PostData): PostData {
        return post;
    }

    /**
     * populating main fields to the PostData object
     * Implemented by children
     * @param {PostData} post
     */
    protected abstract transformData(post: PostData): void;

    /**
     * Primary Entry Point for scraping post data.
     * - verify argument object
     * - fetch search index <primary failure pt>
     * - track index page data (width first)
     * - fetch post data by local index
     * @param {IScrapeRequest} search
     */
    public async run (search: ScrapeRequest): Promise<void> {
        if (!search.uuid) {
            const err: ComponentError = new Error('No Search UUID to associate results');
            throw err;
        }
        /** Reset Run State Data */
        this.runData = [];
        let _runData: PostData[] = [];

        await this.navigateToPrimarySearch(search);
        const metric: IRunMetric = {
            vendorDesc: this.vendorDesc,
            numTotal: -1,
            numComplete: 0,
            pageSize: -1
        };

        let indexCt = 0;
        for (let i = 1; i <= search.pageDepth; i++) {
            const pageIndex: PostData[] = await this.buildDataTree(search, metric);
            search.posts = search.posts.concat(pageIndex);
            await this.scrapeDao.upsert(search);

            _runData = _runData.concat(pageIndex);
            this.runData = _runData;
            indexCt += pageIndex.length;

            if (i < search.pageDepth) {
                await this.nextPage(search);
            }
        }
        metric.numTotal = metric.pageSize * search.pageDepth;
        search.metrics.push(metric);
        console.log('[Index] ' + indexCt);
        try {
            await this.fetchPostDataSet(_runData, metric);
        } catch (ex) {
            console.error('Runtime Exception', ex);
        }
    }

    /**
     * URL generation method
     */
    protected buildPrimaryURL (search: IScrapeRequest): string {
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

    /**
     * long running navigation method to load scrape data
     * @param {IScrapeRequest} search
     */
    protected async navigateToPrimarySearch (search: IScrapeRequest) {
        if (this.page === undefined) {
            throw new ComponentError('Page Object Undefined', '[PostScraper]');
        }
        const url = this.buildPrimaryURL(search);
        console.log('[Primary URL] ' + url);
        await this.page.goto(url, { timeout: 1000 * 60, waitUntil: 'commit' });
        await this.page
            .waitForNavigation({ waitUntil: 'networkidle', timeout: 120000 })
            .catch(IgnoreFactory(this.page));
    }

    /**
     * navigate to the primary job post index (ie. search results) and store placeholders of the full post data
     * @param {ScrapeRequest} request - user requested operation w/uuid
     * @param {IRunMetric} metric - simple process metrics (internal use only)
     * @returns {PostData[]}
     */
    protected async buildDataTree (request: ScrapeRequest, metric: IRunMetric): Promise<PostData[]> {
        if (this.page === undefined) {
            throw new ComponentError('Page Object Undefined', '[PostScraper]');
        }
        let retries = 3;
        let linkCt = 0;
        let links: Locator | undefined;
        while (linkCt === 0 && retries > 0) {
            try {
                links = this.page.locator(this.linkSelector);
                linkCt = await links.count();
            } catch (ex) {
                // Catching
                linkCt = 0;
            }
            retries--;
            if (linkCt === 0) {
                // Prettier Math Fail
                let to = 3000 * Math.random();
                to += 500;
                await this.page
                    .waitForNavigation({ waitUntil: 'networkidle', timeout: to })
                    .catch(IgnoreFactory(this.page));
            }
        }
        if (linkCt <= 0 || links === undefined) {
            const content = await this.page.content();
            console.error(
                JSON.stringify({
                    url: this.page.url(),
                    retries,
                    content
                })
            );
            const err: NavigationError = new Error(
                'No job post data found with primary link selector [' + this.linkSelector + ']'
            );
            throw err;
        }

        metric.pageSize = linkCt;
        const dataSet: PostData[] = [];
        for (let index = 0; index < linkCt; index++) {
            const link = links.nth(index);
            const linkData = await this.getAttributes(link, this.linkAttributes);
            const shell = new PostData();

            // shell.addUserRequest(request);
            // shell.setActiveRequest(request);
            shell.indexMetadata = {
                postIndex: index,
                pageIndex: this.currentPage,
                pageSize: linkCt,
                completed: false
            };

            shell.directURL = linkData.href;
            if (shell.directURL === undefined) {
                const err: ComponentError = new Error('No direct URL has been captured');
                throw err;
            }

            shell.vendorMetadata.metadata = {
                linkData,
                vendor: this.vendorDesc
            };

            this.transformMeta(shell);
            await this.postDao.upsert(shell);

            dataSet.push(shell);
        }
        return dataSet;
    }

    /**
     * Primary orchestration method. based on partial PostData:
     * - navigate to page
     * - scrape the raw data
     * - preforme any implementation specific transform @see {PostScraper.transform}
     * @param dataSet
     * @returns
     */
    protected async fetchPostDataSet (dataSet: PostData[], metric: IRunMetric): Promise<PostData[]> {
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
                    this.transformData(post);
                    complete = true;
                    post.indexMetadata.completed = true;
                    metric.numComplete += 1;
                    // TODO: update post with status-ing
                } catch (ex) {
                    console.error('Failed to retrieve Job Post, reattempting:', JSON.stringify(post));
                    retries--;
                }
            }

            await page.close();
            await this.postDao.upsert(post);
        }
        return dataSet;
    }

    /** Utility Methods that would be useful in all scrapers */
    protected async getAttributes (domItem: Locator, attributes: string[]): Promise<{ [key: string]: any }> {
        const retVal: any = {};
        for (const key of attributes) {
            retVal[key] = await domItem.getAttribute(key);
        }
        return retVal;
    }
}
