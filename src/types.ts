import "reflect-metadata"
import { Entity } from "typeorm";
/**
 * IPostDataScrapeRequest - 
 * The standard job post data request object
 * 
 */
 export interface IPostDataScrapeRequest{
    /** @type {string} Primary Search Term*/
    keyword: string;
    /** @type {string} Optional Location Parameter*/
    location?: string;
    /** @type {number} Number of pages to scrape*/
    pageDepth: number;
}

/**
 * IPostDataSearchRequest - 
 * The job post data primary filter query object
 * 
 */
 export interface IPostDataSearchRequest{
    /** @type {object} Descriptive Search/Query Interface*/
    keywords: {
        "must-have":string;
        "must-not-have":string;
        "should-have":string;
        "should-not-have":string;
    };
    /** @type {string} Optional Location Parameter*/
    location?: string;
}

/**
 * IPostData - 
 * The Standard Job Post Data that will be scraped from underlying services
 * 
 */
 export interface IPostData{
    /** @type {string} scraped service identifier*/
    identifier: string;
    /** @type {string} */
    directURL: string;
    /** @type {number} the ranking from [1 - ({@link IPostDataScrapeRequest.pageDepth} x service page size)*/
    searchIndex: number;
    /** @type {Date} */
    captureTime: Date;
    
    /** @type {string} Main label from source*/
    title: string;
    /** @type {string} Job Poster*/
    organization: string;
    /** @type {string} location data*/
    location: string;
    /** @type {string} */
    description: string;
    /** @type {string} optional salary information*/
    salary?: string;
    /** @type {string} captured posting date, will need to parse this into a date object*/
    postedTime: string;
}

/**
 * TypeORM research. not entirely sure this would be for the best considering the analytic data goals
 */
@Entity()
export class PostData implements IPostData{
    identifier: string;
    directURL: string;
    searchIndex: number;
    captureTime: Date;
    title: string;
    organization: string;
    location: string;
    description: string;
    salary?: string;
    postedTime: string;

    constructor(){
        this.captureTime = new Date();
    }
}