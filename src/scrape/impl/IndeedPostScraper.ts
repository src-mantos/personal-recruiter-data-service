//# sourceMappingURL=dist/scrape/impl/IndeedPostScraper.js.map
import { PostScraper } from '../PostScraper';
import { chromium, FrameLocator, Locator, Page } from 'playwright';
import * as types from '../../types';
import path from 'path';

export class IndeedPostScraper extends PostScraper {

    async searchPostings(search: types.IPostDataScrapeRequest): Promise<types.IPostData[]> {

        if(this.page == undefined){
            throw new Error('Scrape Browser must be initialized and ready.')
        }

        let url = 'https://www.indeed.com/jobs?q='+encodeURIComponent(search.keyword);
        if(search.location){
            url+= '&l='+encodeURIComponent(search.location);
        }

        await this.page.goto(url);

        const locator = this.page.locator('a.tapItem.result');
        const cardCount = await locator.count();
        const indeedAttrs = ["id","data-mobtk","data-jk","data-ci","data-empn","data-hiring-event","href"];
        const stripAttribute = (obj:any, attr:string, elem:Locator)=>{
            elem.getAttribute(attr).then((val)=>{
                obj[attr] = val;
            }).catch((ex)=>{
                console.error("Failed to get attribute",ex);
                obj[attr] = "Not Found"
            });
        };

        for (let index = 0; index < cardCount; index++) {
            const li = locator.nth(index);

            let postData = {};
            for(const key of indeedAttrs){
                stripAttribute(postData,key,locator);
            }


            await Promise.all([
                li.click(),
                this.page.waitForNavigation({
                    waitUntil: 'domcontentloaded',
                }),
                this.page.waitForEvent('framenavigated')
            ]);

            const frame = this.page.frameLocator('#vjs-container-iframe');
            
            await this.page.screenshot({ path: path.join(__dirname, 'job-index-' + index + '.png') });

            console.log("-------------------------");
            console.log(postData);
        }

        /**
  await page.frame({
    name: 'vjs-container-iframe'
  })
  await Promise.all([
    ..wait..
    page.click('button:has-text("Find jobs")')
  ]);
         */
        //page.waitForNavigation(/*{ url: 'https://www.indeed.com/jobs?q=software%20developer&l=Silver%20Spring%2C%20MD&vjk=05afd49ab690b070' }*/),

        return [];
    }

    nextPage(): void {
        throw new Error('Method not implemented.');
    }

    getPageData(): types.IPostData[] {
        throw new Error('Method not implemented.');
    }
}
