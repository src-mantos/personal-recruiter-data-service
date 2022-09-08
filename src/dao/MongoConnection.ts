import mongoose, { Schema, model, Model, connect, Types, Mongoose } from 'mongoose';
import { IPostData, IVendorMetadata, IPostDataIndex, IRunMetric, ISearchQuery } from '..';
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

    init () {
        mongoose.connection.on('error', console.log);
        mongoose.connection.on('disconnected', console.log);
        mongoose.connection.on('connected', this.setConnectedListener(true));
        mongoose.connection.on('open', this.setConnectedListener(true));
        mongoose.connection.on('disconnecting', this.setConnectedListener(false));
        mongoose.connection.on('disconnected', this.setConnectedListener(false));
        mongoose.connection.once('open', console.log);
    }

    async connect (): Promise<void> {
        this.conn = await mongoose.connect(this.clientUrl, {
            user: 'root',
            pass: 'example',
            dbName: 'WIP'
        });
    }

    isConnected (): boolean {
        return this.connected;
    }

    disconnect (): Promise<void> {
        return mongoose.disconnect();
    }
}
