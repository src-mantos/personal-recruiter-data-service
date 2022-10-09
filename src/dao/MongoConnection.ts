import mongoose, { Mongoose, ObjectId } from 'mongoose';
import { ComponentError } from '..';
import { injectAll, singleton, inject } from 'tsyringe';
import PostData from '../entity/PostData';

@singleton()
export class MongoConnection {
    conn: Mongoose;
    connected: boolean;
    clientUrl: string;

    constructor (@inject('db_clientUrl') db_clientUrl: string) {
        this.init();
        this.connected = false;
        this.clientUrl = db_clientUrl;
    }

    private setConnectedListener (state: boolean) {
        return () => {
            this.connected = state;
        };
    }

    protected init () {
        mongoose.connection.on('error', (err) => {
            console.error(err);
        });
        mongoose.connection.on('disconnected', console.log);
        mongoose.connection.on('connected', this.setConnectedListener(true));
        mongoose.connection.on('open', this.setConnectedListener(true));
        mongoose.connection.on('disconnecting', this.setConnectedListener(false));
        mongoose.connection.on('disconnected', this.setConnectedListener(false));
        mongoose.connection.once('open', console.log);
    }

    async connect (onConnected?:{():Promise<void>}): Promise<void> {
        const connectionOpts = {
            user: 'root',
            pass: 'example',
            dbName: 'WIP'
        };
        if (this.conn !== undefined) {
            await this.conn.connect(this.clientUrl, connectionOpts);
        } else {
            this.conn = await mongoose.connect(this.clientUrl, connectionOpts);
        }
        if (onConnected !== undefined) {
            await onConnected();
        }
    }

    isConnected (): boolean {
        return this.connected;
    }

    disconnect (): Promise<void> {
        return mongoose.disconnect();
    }
}

export type MongoID = string | ObjectId;// | ObjectIdLike | number | Buffer | Uint8Array | undefined

export interface Dao<T> {
    insert(entity:T) :Promise<void>
    update(entity:T) :Promise<void>
    upsert(entity:T) :Promise<void>
}
