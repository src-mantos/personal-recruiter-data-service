//# sourceMappingURL=dist/scrape/LocalEventing.js.map
/* eslint-disable @typescript-eslint/ban-types */

export enum Events {
    Status,
    Error,
    Warn,
    Log,
    Any,
}
type EventTypes = keyof typeof Events;
/**
 * some local eventing that seemed like a reasonable way to get information out of the long running scrape process
 */
export class LocalEventing {
    registry: { [key: string]: any };

    constructor() {
        this.registry = {};
    }

    /**
     * convenience method
     * @param event
     * @private
     */
    _checkOrSetRegistry(event: EventTypes): void {
        if (!this.registry[event]) {
            this.registry[event] = [];
        }
    }

    /**
     * Register any needed callbacks for appropriate events, or listen for all events
     * @param event
     * @param callback
     */
    on(event: EventTypes, callback: Function): void {
        this._checkOrSetRegistry(event);
        this.registry[event].push(callback);
    }

    /**
     * fire and forget eventing
     * @param event
     * @param payload
     */
    fire(event: EventTypes, payload: any): void {
        this._checkOrSetRegistry(event);
        payload.event = event;
        for (const cb of this.registry[event]) {
            cb(payload);
        }
    }
}
