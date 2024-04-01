import {ModelQueryOptionsCbArgs} from "@prisma/client/runtime/library"
import {RedisClientType} from "redis"
import SuperJSON from "superjson"
import {createOperations, readOperations} from "./operations.js"
import {AllOperationsCache} from "./options.js"

type RedisClient = RedisClientType<Record<string, any>, Record<string, any>, Record<string, any>>

/** The base configuration of the extension */
export interface ExtensionConfig {
    /** The Redis client connection */
    redisClient: RedisClient
    /** Optional event listeners for cache interaction events */
    eventListeners?: CacheEventListeners
}

/** Event listeners for cache interaction events */
export interface CacheEventListeners<Profiler = any> {
    /**
     * Fired when starting handling a cached operation.
     *
     * @returns The profiler for measuring the operation performance.
     * This profiler is given as a parameter after finishing handling an operation.
     */
    start: () => Profiler
    /**
     * Fired after finishing handling a read operation.
     *
     * @param profiler The profiler returned inside the start event.
     *
     * @param type Whether the cache was hit or miss.
     */
    readEnd: (profiler: Profiler, type: "hit" | "miss") => void
    /**
     * Fired after finishing handling a write operation.
     *
     * @param profiler The profiler returned inside the start event.
     *
     * @param type Whether the cache was created, updated, or evicted as a result of the operation.
     */
    writeEnd: (profiler: Profiler, type: "create" | "update" | "evict") => void
}

/** Handles interaction with the database cache */
export default class RedisCache {
    /** The Redis client */
    #redis: RedisClient

    /** Event listeners for profiling */
    #eventListeners?: CacheEventListeners

    constructor(config: ExtensionConfig) {
        this.#redis = config.redisClient

        this.#eventListeners = config.eventListeners
    }

    /**
     * Handles caching of Prisma operations based on per-query options.
     *
     * @returns The query result (that might have been cached).
     */
    async operation({model, operation, args, query}: ModelQueryOptionsCbArgs) {
        const {cache: cacheOptions, ...queryArgs} = (args as typeof args & AllOperationsCache)

        if (!cacheOptions) {
            return await query(queryArgs)
        }

        const profiler = this.#eventListeners?.start()

        const key = `${model}:${cacheOptions.key}`,
            ttl = cacheOptions.ttl

        if (readOperations.includes(<any>operation)) {
            const cached = await this.#get(key)

            if (cached !== undefined) {
                this.#eventListeners?.readEnd(profiler, "hit")

                return cached
            }

            const result = await query(queryArgs)

            this.#set(key, result, ttl)

            this.#eventListeners?.readEnd(profiler, "miss")

            return result
        } else {
            const result = await query(queryArgs),
                create = createOperations.includes(<any>operation)

            if (cacheOptions.update || create) {
                this.#set(key, result, ttl)

                if (create) {
                    this.#eventListeners?.writeEnd(profiler, "create")
                } else {
                    this.#eventListeners?.writeEnd(profiler, "update")
                }
            } else {
                this.#delete(key)

                this.#eventListeners?.writeEnd(profiler, "evict")
            }

            return result
        }
    }

    /**
     * Serializes and stores a object in Redis.
     *
     * @param key The key of the object to store.
     *
     * @param object The object to serialize and store.
     *
     * @param ttlSeconds The time to live of the object in seconds.
     */
    async #set(key: string, object: any, ttlSeconds = 60 * 15) {
        await Promise.all([
            this.#redis.set(key, SuperJSON.stringify(object)),
            this.#redis.expire(key, ttlSeconds)
        ])
    }

    /**
     * Deserializes and returns the desired object from Redis.
     *
     * @param key The key of the object to retrieve.
     *
     * @returns The object that was stored.
     */
    async #get(key: string): Promise<any | undefined> {
        const result = await this.#redis.get(key)

        if (!result) {
            return undefined
        }

        return SuperJSON.parse(result)
    }

    /**
     * Deletes the desired object from Redis.
     *
     * @param key The key of the object to delete.
     */
    async #delete(key: string) {
        await this.#redis.del(key)
    }
}