import type { IPostData, IVendorMetadata, IPostDataIndex } from '..';
import ScrapeRequest from './ScrapeRequest';
import mongoose from 'mongoose';

/**
 * {@inheritDoc IPostData}
 */
export default class PostData implements IPostData {
    _id: mongoose.Types.ObjectId;

    request: ScrapeRequest;

    directURL!: string;
    vendorMetadata: IVendorMetadata;
    indexMetadata: IPostDataIndex;
    captureTime: Date;

    title: string;
    organization: string;
    location: string;
    description: string;
    salary: string;
    postedTime: string;

    constructor (opts?: IPostData) {
        // this._id = new mongoose.Types.ObjectId();
        if (opts) {
            this.directURL = opts.directURL;
            this.captureTime = opts.captureTime;
            this.title = opts.title;
            this.organization = opts.organization;
            this.location = opts.location;
            this.description = opts.description;
            this.postedTime = opts.postedTime;
            if (opts.salary) this.salary = opts.salary;
            if (opts.vendorMetadata) this.vendorMetadata = opts.vendorMetadata;
            if (opts.indexMetadata) this.indexMetadata = opts.indexMetadata;
        } else {
            this.captureTime = new Date();
            this.vendorMetadata = {
                metadata: {},
                rawdata: {}
            };
            this.indexMetadata = {
                pageIndex: 0,
                pageSize: 0,
                postIndex: 0,
                completed: false
            };
        }
    }

    public update (newValue: IPostData): boolean {
        if (this.directURL === newValue.directURL) {
            for (const key in newValue) {
                (<any> this)[key] = (<any>newValue)[key];
            }
            return true;
        } else {
            console.warn("attempting to update a post that failed 'unique' check");
        }
        return false;
    }
}
