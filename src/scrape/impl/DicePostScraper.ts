import type { IScrapeRequest } from '../../types';
import PostData from '../../entity/PostData';
import { PostScraper } from '../PostScraper';
import { Page } from 'playwright';
import { inject, injectable } from 'tsyringe';
import { PostDao } from '../../dao/PostDao';
import { ScrapeDao } from '../../dao/ScrapeDao';

/**
 * This is the Dice specific implementation
 * @see {PostScraper} for common implementation.
 * {@inheritDoc PostScraper}
 */
@injectable()
export class DicePostScraper extends PostScraper {
    constructor (
        @inject( 'scrape_template_vars' ) variables: string,
        @inject( 'scrape_dice_url_template' ) urlTemplate: string,
        @inject( 'PostDao' ) postDao: PostDao,
        @inject( 'ScrapeDao' ) scrapeDao: ScrapeDao
    ) {
        super( variables, postDao, scrapeDao );
        this.currentPage = 1;
        this.urlTemplate = urlTemplate;
        this.linkSelector = 'a.card-title-link';
        this.linkAttributes = [ 'href', 'id' ];
        this.vendorDesc = 'DICE';
    }

    async scrapePostData ( post: PostData, page: Page ): Promise<PostData> {
        const listInfo = await page.locator( '.job-info p' ).allInnerTexts();

        const title = await page.locator( '.container h1' ).allInnerTexts();
        const description = await page.locator( 'section.job-description' ).allInnerTexts();
        const org = await page.locator( '.job-info .companyInfo li:first-child' ).allInnerTexts();
        const location = await page.locator( '.job-info .companyInfo li:last-child' ).allInnerTexts();
        const postDate = await page.locator( '.date-posted' ).allInnerTexts();

        post.vendorMetadata.rawdata = {
            listInfo,
            title,
            org,
            location,
            postDate,
            description
        };

        return post;
    }

    protected transformData ( post: PostData ) {
        const rawData = post.vendorMetadata.rawdata;
        post.title = rawData.title.join( ' ' );
        post.location = rawData.location.join( ' ' ).replace( /([\r\n]|\\r|\\n)+/, '' );
        post.organization = rawData.org.join( ' ' ).replace( /([\r\n]|\\r|\\n)+/, '' );
        post.postedTime = rawData.postDate.join( ' ' );
        post.description = rawData.description.join( ' ' ).replace( /([\r\n]|\\r|\\n)+/, '' );
        post.salary = rawData.listInfo.join( ' ' );
    }

    async nextPage ( search: IScrapeRequest ): Promise<void> {
        if ( this.page === undefined )
            throw new Error( 'Scrape Browser must be initialized and ready.' );


        this.currentPage++;
        return this.navigateToPrimarySearch( search );
    }
}
