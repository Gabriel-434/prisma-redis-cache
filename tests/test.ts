import {PrismaClientKnownRequestError} from "@prisma/client/runtime/library.js"
import assert from "node:assert"
import {after, describe, it} from "node:test"
import prisma from "./prisma.js"
import redis from "./redis.js"

const username = "Gabriel",
    firstEmail = "test@example.com",
    secondEmail = "Gabriel@example.com"

describe("Basic Prisma operations with Redis cache", {timeout: 15000}, async () => {
    it("Must delete the user if it exists", async () => {
        try {
            await prisma.user.delete({
                where: {
                    username
                },
                cache: {
                    key: username
                }
            })
        } catch (error) {
            // If the error is not about nonexistent user
            if (!(error instanceof PrismaClientKnownRequestError && error.code == "P2025")) {
                throw error
            }
        }
    })

    it("Must create a new user", async () => {
        await prisma.user.create({
            data: {
                username,
                email: firstEmail
            },
            select: {
                username: true,
                email: true
            },
            cache: {
                key: username
            }
        })
    })

    it("Must find the user that was created", async () => {
        const user = await prisma.user.findUnique({
            where: {
                username
            },
            select: {
                username: true,
                email: true
            },
            cache: {
                key: username
            }
        })

        assert.deepStrictEqual(user, {
            username,
            email: firstEmail
        })
    })

    it("Must update the user and evict the cache", async () => {
        await prisma.user.update({
            where: {
                username
            },
            data: {
                email: secondEmail
            },
            cache: {
                key: username,
                update: false
            }
        })
    })

    it("Must find the user that was created after cache eviction", async () => {
        const user = await prisma.user.findUnique({
            where: {
                username
            },
            select: {
                username: true,
                email: true
            },
            cache: {
                key: username
            }
        })

        assert.deepStrictEqual(user, {
            username,
            email: secondEmail
        })
    })

    after(() => {
        prisma.$disconnect()

        redis.quit()
    })
})