import { IPostData, IPostMetaData, IVendorMetadata, IPostDataIndex } from '../types';
import ScrapeRequest from './ScrapeRequest';
import mongoose from 'mongoose';

/**
 * Entity Implementation -
 * This class has a long running life cycle.
 * - first we will have a shell w/ directURL and metadata
 * - after fetching data we will update/populate metadata and top level attributes
 * @see {IPostData}
 * {@inheritDoc IPostData}
 *
 * swagger specific markup - i dislike the cross cut dependency
 * @typedef {object} PostData
 * @property {string} _id - unique identifier
 * @property {boolean} userModified - lock for automation to not alter user updated records
 * @property {string} captureTime - record creation time
 * @property {string} postedTime - captured posting date, will need to parse this into a date object
 * @property {string} directURL
 * @property {string} title - Main label from source
 * @property {string} organization - Job Poster
 * @property {string} location
 * @property {string} description
 * @property {string} salary
 * @property {IVendorMetadata} vendorMetadata - vendor specific raw metadata for manual comparison
 * @property {IPostDataIndex} indexMetadata - this should default to not provided unless requested
 * @property {IScrapeRequest} activeRequest - the active scrape request
 */
export default class PostData implements IPostData, IPostMetaData {
    _id: mongoose.Types.ObjectId;
    activeRequest: ScrapeRequest;
    vendorMetadata: IVendorMetadata;
    indexMetadata: IPostDataIndex;

    // top level data
    /** the direct url is required as a unique reference */
    directURL!: string;
    title: string;
    organization: string;
    location: string;
    description: string;
    salary: string;
    postedTime: string;
    captureTime: Date;
    userModified:boolean;

    constructor ( opts?: IPostData ) {
        if ( opts !== undefined )
            for ( const key in opts ) {
                const val = ( opts as any )[key];
                if ( val !== undefined && val !== null )
                    ( this as any )[key] = val;
            }


        if ( this.vendorMetadata === undefined || this.vendorMetadata === null )
            this.vendorMetadata = {
                metadata: {},
                rawdata : {}
            };


        if ( this.indexMetadata === undefined || this.indexMetadata === null )
            this.indexMetadata = {
                pageIndex: 0,
                pageSize : 0,
                postIndex: 0,
                completed: false
            };


        if ( this.captureTime === undefined || this.captureTime === null )
            this.captureTime = new Date();


        this.userModified = false;
    }

    /**
     * Utility method for managing many to many association
     */
    setActiveRequest ( req:ScrapeRequest ):void {
        this.activeRequest = req;
    }

    /**
     * Update top level data with respect to user modifications
     * @param applyToObj - Post Data Object to be updated
     * @param applyFromObj - Reference Post Data object
     */
    public static apply ( applyToObj: IPostData&IPostMetaData, applyFromObj: IPostData&IPostMetaData ): void {
        applyToObj.activeRequest = applyFromObj.activeRequest;
        applyToObj.captureTime = applyFromObj.captureTime;
        applyToObj.indexMetadata = applyFromObj.indexMetadata;
        applyToObj.vendorMetadata = applyFromObj.vendorMetadata;
        if ( !applyToObj.userModified ) {
            applyToObj.title = applyFromObj.title;
            applyToObj.location = applyFromObj.location;
            applyToObj.organization = applyFromObj.organization;
            applyToObj.description = applyFromObj.description;
            applyToObj.salary = applyFromObj.salary;
            applyToObj.captureTime = applyFromObj.captureTime;
            applyToObj.postedTime = applyFromObj.postedTime;
        }
    }
}
