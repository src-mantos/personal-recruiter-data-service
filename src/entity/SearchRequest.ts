import type { ISearchQuery } from '..';
import { v4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * {@inheritDoc ISearchQuery}
 */
export default class SearchRequest implements ISearchQuery {
    _id: mongoose.Types.ObjectId;

    uuid: string = v4();
    requestTime?: Date;
    keywords: string;
    location?: string;

    constructor (opts?: ISearchQuery) {
        this.requestTime = new Date();
        if (opts) {
            this.keywords = opts.keywords;
            this.location = opts.location;
        }
    }
}
