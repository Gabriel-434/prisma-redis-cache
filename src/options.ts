import type {XOR} from "ts-essentials"

/** Base options to interact with the cache */
interface BaseCacheOptions {
    /** The key of the cache */
    key: string
}

/** Options to cache a read operation */
interface CacheReadOptions extends BaseCacheOptions {
    /** The time to live of the cache, in seconds */
    ttl?: number
}

/** Options to update the cache */
type CacheUpdate = BaseCacheOptions & Pick<CacheReadOptions, "ttl"> & {
    /** Whether to update or evict the cache */
    update: true
}

/** Options to evict the cache */
interface CacheEvict extends BaseCacheOptions {
    /** Whether to update or evict the cache */
    update?: false
}

/** Options to cache a update operation */
type CacheUpdateOptions = XOR<CacheUpdate, CacheEvict>


/** Returns a cache object with the specified options */
interface CacheObject<Options> {
    /** Options to cache a operation */
    cache?: Options
}

/** The cache object of a read operation */
export type ReadOperationCache = CacheObject<CacheReadOptions>

/** The cache object of a create operation */
export type CreateOperationCache = CacheObject<CacheReadOptions>

/** The cache object of a update operation */
export type UpdateOperationCache = CacheObject<CacheUpdateOptions>

/** The cache object of a delete operation */
export type DeleteOperationCache = CacheObject<BaseCacheOptions>


/** The combined cache object of all operations */
export type AllOperationsCache =
    ReadOperationCache & CreateOperationCache &
    UpdateOperationCache & DeleteOperationCache
