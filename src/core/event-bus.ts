import { EventEmitter } from "events";

export type EventPayload = Record<string, any>;
export type EventHandler<T = EventPayload> = (payload: T) => void | Promise<void>;

export class EventBus {
    private emitter = new EventEmitter();

    on<T = EventPayload>(event: string, handler: EventHandler<T>) {
        this.emitter.on(event, handler);
    }

    off(event: string, handler: EventHandler) {
        this.emitter.off(event, handler);
    }

    once<T = EventPayload>(event: string, handler: EventHandler<T>) {
        this.emitter.once(event, handler);
    }

    emit<T = EventPayload>(event: string, payload: T) {
        this.emitter.emit(event, payload);
    }
}
