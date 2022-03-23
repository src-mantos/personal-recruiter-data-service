//# sourceMappingURL=dist/dao/PostDao.js.map
import { EntityManager, MongoDriver } from '@mikro-orm/mongodb';
import { MikroORM, EntityRepository, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { PostData } from '../types';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';
import { BaseDao } from './BaseDao';

export class PostDao extends BaseDao {
    private repository: EntityRepository<PostData>;
    constructor() {
        super();
    }

    async connect() {
        super.connect();
        this.repository = this.orm.em.getRepository(PostData);
    }
    /**
     * Primary data input from scrapers/transformers
     * @param input
     */
    async importPostData(input: IPostData[]) {
        throw new Error('Method not implemented.');
    }

    /**
     * Primary Search interface for the Primary UI
     * @param searchQuery
     */
    async searchStoredData(searchQuery: IPostDataSearchRequest): Promise<IPostData[]> {
        throw new Error('Method not implemented.');
    }

    /**
     * basic update post data
     * @param input
     */
    async updatePostData(input: IPostData): Promise<IPostData> {
        throw new Error('Method not implemented.');
    }

    /**
     * basic get post daa
     * @param input
     */
    async getPostData(id: any): Promise<IPostData> {
        throw new Error('Method not implemented.');
    }
}
