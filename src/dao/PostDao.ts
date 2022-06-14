//# sourceMappingURL=dist/src/dao/PostDao.js.map
import { EntityManager, EntityRepository, MongoDriver } from '@mikro-orm/mongodb';
import { MikroORM, IDatabaseDriver, Connection, Loaded } from '@mikro-orm/core';
import type { IPostDataScrapeRequest, IPostData, IVendorMetadata, IPostDataSearchRequest } from '../types';
import PostData from '../entity/PostData';
import { BaseDao } from './BaseDao';

type DbProxy = Loaded<PostData, never> | null;

export class PostDao extends BaseDao {
    private repository: EntityRepository<PostData>;
    constructor() {
        super();
    }

    public async connect(): Promise<any> {
        await super.connect();
        if (!this.repository) {
            this.repository = this.orm.em.getRepository(PostData);
        }
    }

    async upsert(post: PostData | IPostData): Promise<void> {
        const existing: DbProxy = await this.repository.findOne({ directURL: post.directURL });
        if (existing != null) {
            console.log('Existing', JSON.stringify(existing));
            console.log('Incomming', JSON.stringify(post));
            existing.update(post);
            this.repository.persist(existing);
        } else {
            this.repository.persist(post);
        }
    }
    async flush() {
        this.repository.flush();
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
