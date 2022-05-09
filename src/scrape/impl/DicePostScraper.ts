//# sourceMappingURL=dist/src/scrape/impl/DicePostScraper.js.map
import type { IPostDataScrapeRequest, IPostData } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { FrameLocator, Locator, Page } from 'playwright';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DicePostScraper extends PostScraper {
    constructor(
        @inject('scrape_template_vars') variables: string,
        @inject('scrape_dice_url_template') urlTemplate: string
    ) {
        super(variables);
        this.currentPage = 1;
        this.urlTemplate = urlTemplate;
        this.linkSelector = 'a.card-title-link';
        this.linkAttributes = ['href', 'id'];
        this.vendorDesc = 'DICE';
    }

    async scrapePostData(post: PostData, page: Page): Promise<PostData> {
        const listInfo = await page.locator('.row.job-info .iconsiblings').allInnerTexts();

        const title = await page.locator('.jobTitle').allInnerTexts();
        const org = await page.locator('.employer.hiringOrganization').allInnerTexts();
        const location = await page.locator('.location').allInnerTexts();
        const postDate = await page.locator('.posted').allInnerTexts();
        const detail = await page.locator('#jobdescSec').allInnerTexts();

        post.vendorMetadata.rawdata = {
            listInfo: listInfo,
            title: title,
            org: org,
            location: location,
            postDate: postDate,
            detail: detail,
        };

        return post;
    }

    async nextPage(search: IPostDataScrapeRequest): Promise<void> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        this.currentPage++;
        return this.navigateToPrimarySearch(search);
    }

    getPageData(): IPostData[] {
        throw new Error('Method not implemented.');
    }
}
