//# sourceMappingURL=dist/scrape/impl/IndeedPostScraper.js.map
import { PostScraper } from '../PostScraper';
import { chromium, FrameLocator, Locator, Page } from 'playwright';
import * as types from '../../types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class IndeedPostScraper extends PostScraper {
    async clearPopup() {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const found = await this.page.locator('#popover-x').count();
        if (found > 0) {
            await this.page.click('#popover-x [aria-label="Close"]');
        }
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

    async searchPostings(search: types.IPostDataScrapeRequest): Promise<types.IPostData[]> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        let url = 'https://www.indeed.com/jobs?q=' + encodeURIComponent(search.keyword);
        if (search.location) {
            url += '&l=' + encodeURIComponent(search.location);
        }
        await this.page.goto(url);
        uuidv4();

        const pageData = [];

        for (let currpage = 1; currpage <= search.pageDepth; currpage++) {
            //add the page scraping

            await this.page.waitForEvent('frameattached').catch(this.captureError.bind(this));
            console.log('page ' + currpage + ' out of ' + search.pageDepth);

            const errTime = new Date();
            await this.page.screenshot({
                path: path.join(__dirname, '../../../dist', 'pageload-' + errTime.getTime() + '.png'),
            });

            const locator = this.page.locator('a.tapItem.result');
            const cardCount = await locator.count();

            for (let index = 0; index < cardCount; index++) {
                const li = locator.nth(index);
                await li.click();
                const postData: types.IPostData = await this._scrapePostData(li, index);

                this.fire('Log', postData);
                pageData.push(postData);
                this.fire('Status', { message: 'captured ' + (index + 1) + ' out of ' + (cardCount + 1) });
                /*
                await this.page.screenshot({
                        path: path.join(__dirname, '../../../dist', 'job-index-' + currpage + '-' + index + '.png'),
                    });
                     */
            }
            if (currpage < search.pageDepth) {
                await this.nextPage();
            }
        }
        return pageData;
    }

    /**
     * Preliminary complexity warning refactoring
     * @param linkItem
     * @returns
     */
    async _scrapePostData(linkItem: Locator, index: number): Promise<types.IPostData> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const indeedAttrs = ['id', 'data-mobtk', 'data-jk', 'data-ci', 'data-empn', 'data-hiring-event', 'href'];
        const postMetadata: { [key: string]: any } = {
            index: {
                tick: index,
                page: this.currentPage,
            },
            directURL: this.page.url(),
        };
        const postData: types.IPostData = new types.PostData();
        for (const key of indeedAttrs) {
            postMetadata[key] = await linkItem.getAttribute(key);
        }
        postData.vendorMetadata.metadata = postMetadata;

        await Promise.all([this.page.waitForEvent('frameattached'), this.page.waitForEvent('framenavigated')]).catch(
            this.captureError.bind(this)
        );

        const frame = this.page.frameLocator('#vjs-container-iframe');

        if (frame) {
            const getAllTextContents = async (frm: FrameLocator, selector: string): Promise<string[]> => {
                return frm.locator(selector).allInnerTexts();
            };
            const title = await getAllTextContents(frame, '.jobsearch-JobInfoHeader-title');
            const subTitle = await getAllTextContents(frame, '.jobsearch-JobInfoHeader-subtitle');
            const metadata = await getAllTextContents(frame, '.jobsearch-JobMetadataHeader-item');
            const description = await getAllTextContents(frame, '#jobDescriptionText');
            const qualifications = await getAllTextContents(frame, '#qualificationsSection');
            const highlights = await getAllTextContents(frame, '#mosaic-jobHighlights');
            const aboveDescription = await getAllTextContents(frame, '#mosaic-aboveFullJobDescription');
            const belowDescription = await getAllTextContents(frame, '#mosaic-belowFullJobDescription');
            const sectionItems = await getAllTextContents(
                frame,
                '.jobsearch-JobDescriptionSection .jobsearch-JobDescriptionSection-sectionItem'
            );

            postData.vendorMetadata.rawdata = {
                title: title,
                subTitle: subTitle,
                metadata: metadata,
                description: description,
                sectionItems: sectionItems,
                qualifications: qualifications,
                highlights: highlights,
                aboveDescription: aboveDescription,
                belowDescription: belowDescription,
            };
        }
        return postData;
    }

    async nextPage(): Promise<void> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        await Promise.all([this.page.click('[aria-label="Next"] svg'), this.page.waitForNavigation()]).catch(
            this.captureError.bind(this)
        );
        this.currentPage++;

        await this.clearPopup();
    }

    getPageData(): types.IPostData[] {
        throw new Error('Method not implemented.');
    }
}
