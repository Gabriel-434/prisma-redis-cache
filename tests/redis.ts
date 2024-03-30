import {env} from "node:process"
import {createClient} from "redis"
import "dotenv/config"

const redis = await createClient({
    url: env.REDIS_CONNECTION_URL
}).connect()

export default redis