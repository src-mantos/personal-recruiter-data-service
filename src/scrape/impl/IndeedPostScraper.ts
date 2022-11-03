import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { Page } from 'playwright';
import { inject, injectable } from 'tsyringe';
import path from 'path';
import { PostDao } from '../../dao/PostDao';
import { ScrapeDao } from '../../dao/ScrapeDao';

/**
 * This is the Indeed specific implementation
 * @see {PostScraper} for common implementation.
 * {@inheritDoc PostScraper}
 */
@injectable()
export class IndeedPostScraper extends PostScraper {
    constructor (
        @inject('scrape_template_vars') variables: string,
        @inject('scrape_ind_url_template') urlTemplate: string,
        @inject('PostDao') postDao: PostDao,
        @inject('ScrapeDao') scrapeDao: ScrapeDao
    ) {
        super(variables, postDao, scrapeDao);
        this.urlTemplate = urlTemplate;
        this.linkSelector = 'a.jcs-JobTitle';
        this.linkAttributes = ['id', 'data-mobtk', 'data-jk', 'data-ci', 'data-empn', 'data-hiring-event', 'href'];
        this.vendorDesc = 'INDEED';
    }

    async scrapePostData (post: PostData, page: Page): Promise<PostData> {
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
            title,
            subTitle,
            metadata,
            description,
            sectionItems,
            qualifications,
            highlights,
            aboveDescription,
            belowDescription,
            hireInsights
        };
        return post;
    }

    protected transformMeta (post: PostData): PostData {
        post.directURL = 'https://www.indeed.com' + post.directURL;
        return post;
    }

    protected transformData (post: PostData) {
        const rawData = post.vendorMetadata.rawdata;
        post.title = rawData.title.join(' ');
        post.location = rawData.subTitle.join(' ').replace(/([\r\n]|\\r|\\n)+/, '');
        post.organization = rawData.subTitle.join(' ').replace(/([\r\n]|\\r|\\n)+/, '');
        post.postedTime = rawData.hireInsights.join(' ');
        post.description = rawData.description.join(' ').replace(/([\r\n]|\\r|\\n)+/, '');
        post.salary = rawData.metadata.join(' ');
    }

    async clearPopup () {
        if (this.page === undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }
        const found = await this.page.locator('#popover-x').count();
        if (found > 0) {
            await this.page.click('[aria-label="Close"]').catch(() => {
                // noop as long as the other data is scrape-able
                if (this.page) {
                    this.page.screenshot({
                        path: path.join(__dirname, '../../../dist', 'NEXT-failure-' + new Date().getTime() + '.png')
                    });
                }
            });
        }
    }

    async nextPage (): Promise<void> {
        if (this.page === undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        await Promise.all([this.page.click('[aria-label="Next"] svg'), this.page.waitForNavigation()]).catch(
            (err) => { console.error(err); }
        );
        this.currentPage++;

        await this.clearPopup();
    }
}
