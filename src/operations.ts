import type {Prisma} from "@prisma/client/extension"
import type {Operation as OperationsTuple} from "@prisma/client/runtime/library"
import {StrictExtract} from "ts-essentials"
import type {
    CreateOperationCache,
    DeleteOperationCache,
    ReadOperationCache,
    UpdateOperationCache,
} from "./options.js"

/** Flattens an array or a tuple of arrays into a tuple */
type FlattenArray<Array extends any[]> = Array[number]

export const readOperations = [
    "findUnique",
    "findUniqueOrThrow",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "count",
    "groupBy",
    "aggregate"
] satisfies OperationsTuple[]

export const createOperations = [
    "create",
    "createMany"
] satisfies OperationsTuple[]

export const updateOperations = [
    "upsert",
    "update",
    "updateMany",
] satisfies OperationsTuple[]

export const deleteOperations = [
    "delete",
    "deleteMany"
] satisfies OperationsTuple[]

/** The operations that are cached */
type CachedOperations = FlattenArray<
    typeof readOperations | typeof createOperations |
    typeof updateOperations | typeof deleteOperations
>

/** The operations with optional arguments */
type OptionalArguments = StrictExtract<CachedOperations,
    "findFirst" | "findFirstOrThrow" | "findMany" | "count"
>


/** Returns the cache options of the operation */
type DetermineOperationCache<Operation extends CachedOperations> = (
    (Operation extends FlattenArray<typeof readOperations> ? ReadOperationCache : never) |
    (Operation extends FlattenArray<typeof createOperations> ? CreateOperationCache : never) |
    (Operation extends FlattenArray<typeof updateOperations> ? UpdateOperationCache : never) |
    (Operation extends FlattenArray<typeof deleteOperations> ? DeleteOperationCache : never)
)

/** Returns the arguments of the specified operation in the specified model */
type OperationArguments<Arguments, Model, Operation extends CachedOperations> =
    // Enforce strict type safety on the `Arguments` generic type
    Prisma.Exact<Arguments, Prisma.Args<Model, Operation>> &
    // Determine operation arguments with cache options
    Prisma.Args<Model, Operation> & DetermineOperationCache<Operation>

/** Returns the type of the specified operation */
type OperationMethod<Operation extends CachedOperations> = <Model, Arguments>(
    this: Model,
    ...args: (
        Operation extends OptionalArguments ?
        [OperationArguments<Arguments, Model, Operation>?] :
        [OperationArguments<Arguments, Model, Operation>]
    )
) => Promise<Prisma.Result<Model, Arguments, Operation>>

/** The Prisma database operations with the caching options */
export type Operations = {
    [Operation in CachedOperations]: OperationMethod<Operation>
}
