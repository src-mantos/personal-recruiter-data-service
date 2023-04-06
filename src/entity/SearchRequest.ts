import type { ISearchQuery } from '../types';
import { v4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * @class
 * @see {@link ISearchQuery}
 */
export default class SearchRequest implements ISearchQuery {
    _id: mongoose.Types.ObjectId;

    uuid: string = v4();
    requestTime?: Date;
    keywords: string;

    constructor ( opts?: ISearchQuery ) {
        this.requestTime = new Date();
        if ( opts )
            this.keywords = ( opts.keywords !== undefined ) ? opts.keywords : '*';
    }
}
