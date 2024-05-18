import {Prisma} from "@prisma/client/extension"
import RedisCache, {ExtensionConfig} from "./RedisCache.js"
import type {Operations} from "./operations.js"

/**
 * Configures the Prisma Extension that manages caching with Redis.
 *
 * @param config The cache manager configuration.
 *
 * @returns The Prisma Extension for caching operations using Redis.
 */
function configureCache(config: ExtensionConfig) {
    const cache = new RedisCache(config)

    return Prisma.defineExtension({
        name: "prisma-redis-cache",
        model: {
            $allModels: {} as Operations
        },
        query: {
            $allModels: {
                $allOperations: (...params) => cache.operation(...params)
            }
        }
    })
}

export default configureCache

export {ExtensionConfig} from "./RedisCache.js"
