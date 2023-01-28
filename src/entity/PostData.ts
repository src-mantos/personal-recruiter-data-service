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
                const val = ( <any>opts )[key];
                if ( val !== undefined && val !== null )
                    ( <any> this )[key] = val;
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
