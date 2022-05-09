//# sourceMappingURL=dist/src/scrape/impl/IndeedPostScraper.js.map
import type { IPostDataScrapeRequest, IPostData } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { FrameLocator, Locator, Page } from 'playwright';
import { inject, injectable } from 'tsyringe';
import path from 'path';

@injectable()
export class IndeedPostScraper extends PostScraper {
    constructor(
        @inject('scrape_template_vars') variables: string,
        @inject('scrape_ind_url_template') urlTemplate: string
    ) {
        super(variables);
        this.urlTemplate = urlTemplate;
        this.linkSelector = 'a.jcs-JobTitle';
        this.linkAttributes = ['id', 'data-mobtk', 'data-jk', 'data-ci', 'data-empn', 'data-hiring-event', 'href'];
        this.vendorDesc = 'INDEED';
    }

    async scrapePostData(post: PostData, page: Page): Promise<PostData> {
        const title = await page.locator('.jobsearch-JobInfoHeader-title').allInnerTexts();
        const subTitle = await page.locator('.jobsearch-JobInfoHeader-subtitle').allInnerTexts();
        const metadata = await page.locator('.jobsearch-JobMetadataHeader-item').allInnerTexts();
        const description = await page.locator('#jobDescriptionText').allInnerTexts();
        const qualifications = await page.locator('.jobsearch-ReqAndQualSection-item--wrapper').allInnerTexts();
        const highlights = await page.locator('#mosaic-jobHighlights').allInnerTexts();
        const aboveDescription = await page.locator('#mosaic-aboveFullJobDescription').allInnerTexts();
        const belowDescription = await page.locator('#mosaic-belowFullJobDescription').allInnerTexts();
        const hireInsights = await page.locator('#hiringInsightsSectionRoot').allInnerTexts();
        const sectionItems = await page
            .locator('.jobsearch-JobDescriptionSection .jobsearch-JobDescriptionSection-sectionItem')
            .allInnerTexts();

        post.vendorMetadata.rawdata = {
            title: title,
            subTitle: subTitle,
            metadata: metadata,
            description: description,
            sectionItems: sectionItems,
            qualifications: qualifications,
            highlights: highlights,
            aboveDescription: aboveDescription,
            belowDescription: belowDescription,
            hireInsights: hireInsights,
        };
        return post;
    }
    protected decorateMetaData(post: PostData): PostData {
        post.directURL = 'https://www.indeed.com' + post.directURL;
        return post;
    }

    async clearPopup() {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const found = await this.page.locator('#popover-x').count();
        if (found > 0) {
            await this.page.click('[aria-label="Close"]').catch(() => {
                //noop as long as the other data is scrape-able
                if (this.page) {
                    this.page.screenshot({
                        path: path.join(__dirname, '../../../dist', 'NEXT-failure-' + new Date().getTime() + '.png'),
                    });
                }
            });
        }
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
}
