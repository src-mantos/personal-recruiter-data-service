//# sourceMappingURL=dist/src/scrape/impl/DicePostScraper.js.map
import type { IPostDataScrapeRequest, IPostData } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { FrameLocator, Locator, Page } from 'playwright';
import { inject, injectable } from 'tsyringe';
import { PostDao } from '../../dao/PostDao';

@injectable()
export class DicePostScraper extends PostScraper {
    constructor(
        @inject('scrape_template_vars') variables: string,
        @inject('scrape_dice_url_template') urlTemplate: string,
        @inject('PostDao') postDao: PostDao
    ) {
        super(variables, postDao);
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

    protected transform(post: PostData) {
        const rawData = post.vendorMetadata.rawdata;
        // const regex = "[s|S]alary[:\-\s]*\$?([\d,\.])+[:\-\s\$]*([\d,\.])+"
        post.title = rawData.title;
        post.location = rawData.location;
        post.organization = rawData.org;
        post.postedTime = rawData.postDate;
        post.description = rawData.detail;
        // const res = regex.exec(post.description);
        // console.log('Salary', res?.groups);
    }
}
