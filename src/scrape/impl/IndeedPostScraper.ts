//# sourceMappingURL=dist/src/scrape/impl/IndeedPostScraper.js.map
import type { IPostDataScrapeRequest, IPostData } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { FrameLocator, Locator } from 'playwright';
import { injectable } from 'tsyringe';

@injectable()
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

    async searchPostings(search: IPostDataScrapeRequest): Promise<IPostData[]> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        let url = 'https://www.indeed.com/jobs?q=' + encodeURIComponent(search.keyword);
        if (search.location) {
            url += '&l=' + encodeURIComponent(search.location);
        }
        console.log(url);
        await this.page.goto(url);

        const pageData: IPostData[] = [];

        for (let currpage = 1; currpage <= search.pageDepth; currpage++) {
            await this.page.waitForEvent('frameattached').catch(this.captureError.bind(this));
            console.log('page ' + currpage + ' out of ' + search.pageDepth);

            const locator = this.page.locator('a.tapItem');
            const cardCount = await locator.count();

            console.log('card count %s', cardCount);
            if (cardCount <= 0) {
                throw new Error('unable to find postings');
            }

            for (let index = 0; index < cardCount; index++) {
                const li = locator.nth(index);
                await li.click();
                const postData: IPostData = await this._scrapePostData(li, index);

                this.fire('Log', postData);
                console.log('[INDEED] ' + JSON.stringify(postData));
                pageData.push(postData);
                this.fire('Status', { message: 'captured ' + (index + 1) + ' out of ' + (cardCount + 1) });
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
    private async _scrapePostData(linkItem: Locator, index: number): Promise<IPostData> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const indeedAttrs = ['id', 'data-mobtk', 'data-jk', 'data-ci', 'data-empn', 'data-hiring-event', 'href'];
        const linkData = await this.getAttributes(linkItem, indeedAttrs);
        const postMetadata: { [key: string]: any } = {
            index: {
                tick: index,
                page: this.currentPage,
            },
            directURL: this.page.url(),
            linkData: linkData,
        };

        const postData: IPostData = new PostData();
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

    getPageData(): IPostData[] {
        throw new Error('Method not implemented.');
    }
}
