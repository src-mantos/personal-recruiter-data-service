//# sourceMappingURL=dist/src/dao/BaseDao.js.map
import { MikroORM, IDatabaseDriver, Connection, Options } from '@mikro-orm/core';
import MikroConnection from './MikroConnection';

const NULL = null || undefined;
export abstract class BaseDao {
    protected orm: MikroORM<IDatabaseDriver<Connection>>;
    async connect(): Promise<any> {
        const connection = MikroConnection.getInstance();
        await connection.connect();
        if (!this.orm) {
            this.orm = connection.getORM();
        }
    }
    async isConnected(): Promise<boolean> {
        if (this.orm != undefined) return this.orm.isConnected();
        return false;
    }
    async disconnect() {
        if (this.orm != undefined) await this.orm.close();
    }
    async transaction(fn: () => Promise<void>): Promise<void> {
        await this.orm.em.begin();

        try {
            await fn();
            await this.orm.em.commit(); // will flush before making the actual commit query
        } catch (e) {
            await this.orm.em.rollback();
            throw e;
        }
    }
}
