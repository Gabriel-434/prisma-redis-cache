import {PrismaClient} from "@prisma/client"
import configureCache from "../src/index.js"
import {CacheEventListeners} from "../src/RedisCache.js"
import redis from "./redis.js"

const eventListeners: CacheEventListeners<DOMHighResTimeStamp> = {
    start() {
        return performance.now()
    },
    readEnd(start, type) {
        console.log(`Cache ${type} on ${calcElapsed(start)}ms`)
    },
    writeEnd(start, type) {
        console.log(`Cache ${type} on ${calcElapsed(start)}ms`)
    }
}, prisma = new PrismaClient().$extends(
    configureCache({
        redisClient: redis,
        eventListeners
    })
)

function calcElapsed(profiler: number) {
    return performance.now() - profiler
}

export default prisma