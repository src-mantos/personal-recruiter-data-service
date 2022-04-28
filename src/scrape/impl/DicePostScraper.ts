//# sourceMappingURL=dist/src/scrape/impl/DicePostScraper.js.map
import type { IPostDataScrapeRequest, IPostData } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { FrameLocator, Locator, Page } from 'playwright';
import { injectable } from 'tsyringe';

@injectable()
export class DicePostScraper extends PostScraper {
    constructor() {
        super();
        this.currentPage = 1;
    }

    async searchPostings(search: IPostDataScrapeRequest): Promise<IPostData[]> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        let url = 'https://www.dice.com/jobs?q=' + encodeURIComponent(search.keyword);
        if (search.location) {
            url += '&location=' + encodeURIComponent(search.location);
        }
        url += '&radius=30&radiusUnit=mi&page=' + this.currentPage + '&pageSize=20';
        await this.page.goto(url);
        await this.page.waitForTimeout(500); //TODO Confirm this was just testing

        const pageData: IPostData[] = [];

        for (let currpage = this.currentPage; currpage <= search.pageDepth; currpage++) {
            const links = this.page.locator('a.card-title-link');
            const companies = this.page.locator('div.card-company');
            const bodies = this.page.locator('div.card-body');

            const linkCt = await links.count();
            const compCt = await companies.count();
            const bodyCt = await bodies.count();

            if (linkCt != compCt || compCt != bodyCt) {
                console.error(
                    'component counts off.',
                    JSON.stringify({
                        linkCt: linkCt,
                        compCt: compCt,
                        bodyCt: bodyCt,
                    })
                );
                throw new Error('Bad CSS selector/assumption');
            }

            for (let index = 0; index < linkCt; index++) {
                const link = links.nth(index);
                const company = companies.nth(index);
                const body = bodies.nth(index);

                const linkData = await this.getAttributes(link, ['href', 'id']);
                const companyData = await company.allInnerTexts();
                const bodyData = await body.allInnerTexts();

                const postData: IPostData = new PostData();
                const postMetadata: { [key: string]: any } = {
                    index: {
                        tick: index,
                        page: this.currentPage,
                    },
                    directURL: linkData['href'],
                    linkData: linkData,
                    companyData: companyData,
                    bodyData: bodyData,
                };
                postData.vendorMetadata.metadata = postMetadata;

                const tab = await this.createNewPage();
                await tab.goto(postMetadata.directURL);
                //const container = await tab.locator('.container.job-details').allInnerTexts();
                const listInfo = await tab.locator('.row.job-info .iconsiblings').allInnerTexts();

                const title = await tab.locator('.jobTitle').allInnerTexts();
                const org = await tab.locator('.employer.hiringOrganization').allInnerTexts();
                const location = await tab.locator('.location').allInnerTexts();
                const postDate = await tab.locator('.posted').allInnerTexts();
                const detail = await tab.locator('#jobdescSec').allInnerTexts();

                const rawdata = {
                    listInfo: listInfo,
                    title: title,
                    org: org,
                    location: location,
                    postDate: postDate,
                    detail: detail,
                };
                postData.vendorMetadata.rawdata = rawdata;
                console.log('[DICE] ' + JSON.stringify(postData));
                pageData.push(postData);

                await tab.close();
            }

            if (currpage < search.pageDepth) {
                this.currentPage++;
            }
        }
        return pageData;
    }

    private async _scrapePostData(url: string): Promise<any> {
        const tab = await this.createNewPage();
        await tab.goto(url);

        const listInfo = await tab.locator('.row.job-info .iconsiblings').allInnerTexts();

        const title = await tab.locator('.jobTitle').allInnerTexts();
        const org = await tab.locator('.employer.hiringOrganization').allInnerTexts();
        const location = await tab.locator('.location').allInnerTexts();
        const postDate = await tab.locator('.posted').allInnerTexts();
        const detail = await tab.locator('#jobdescSec').allInnerTexts();

        await tab.close();

        return {
            listInfo: listInfo,
            title: title,
            org: org,
            location: location,
            postDate: postDate,
            detail: detail,
        };
    }

    async nextPage(): Promise<void> {
        if (this.page == undefined) {
            throw new Error('Scrape Browser must be initialized and ready.');
        }

        await Promise.all([this.page.click('[aria-label="Next"] svg'), this.page.waitForNavigation()]).catch(
            this.captureError.bind(this)
        );
        this.currentPage++;
    }

    getPageData(): IPostData[] {
        throw new Error('Method not implemented.');
    }
}
