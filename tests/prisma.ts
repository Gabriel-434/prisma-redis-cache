import {PrismaClient} from "@prisma/client"
import configureCache from "../src/index.js"
import redis from "./redis.js"

const prisma = new PrismaClient().$extends(
    configureCache({
        redisClient: redis
    })
)

export default prisma