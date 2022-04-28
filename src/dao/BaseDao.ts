//# sourceMappingURL=dist/src/dao/BaseDao.js.map
import { MikroORM, IDatabaseDriver, Connection } from '@mikro-orm/core';
import ormOpts from '../mikro-orm.config';

export abstract class BaseDao {
    protected orm: MikroORM<IDatabaseDriver<Connection>>;
    async connect() {
        this.orm = await MikroORM.init(ormOpts);
    }
    async isConnected(): Promise<boolean> {
        return this.orm.isConnected();
    }
    async disconnect() {
        await this.orm.close();
    }
}
