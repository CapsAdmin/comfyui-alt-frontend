// intended to be used with concurrent react
// it's best used to fetch initial data, and then subsequent data is fetched with firebase's onSnapshot
interface PromiseCache {
    promise: Promise<void>
    error?: unknown
    response?: unknown
}

const promiseCaches: Map<string, PromiseCache> = new Map()

// when used with <Suspense>, this function will halt execution until the promise is resolved
// this makes it possible to wait for some data and have a guarantee that it will be available
// as opposed to mydata | undefined
// while the promise is waitinng, <Suspense fallback={<Loading/>}> will be rendered instead

// in firebase, this is mostly useful for initial data, subsequent data can be provided with onShapshot

// use a symbol so that we can return falsy values
const NoResponse = Symbol("NoResponse")

export const usePromise = <P extends () => Promise<unknown>>(
    promise: P,

    /** a unique identifier for this promise. ie usePromise(asyncFunc, "userdata-"+userId) */
    id: string
) => {
    const existingPromise = promiseCaches.get(id)

    if (existingPromise) {
        if (existingPromise.error) {
            // 3[REJECT]. if there's an error from step 2, throw it
            // if we have an error boundary, we could catch it
            let msg = "usePromise " + id + ""
            if (existingPromise.error instanceof Error) {
                msg += ": " + existingPromise.error.message
            }
            const err = new Error(msg)
            err.cause = existingPromise.error as Error
            throw err
            // DONE
        }

        if (existingPromise.response != NoResponse) {
            // 3[RESOLVE]. if there's a response from step 2, return it
            return existingPromise.response as Awaited<ReturnType<P>>
            // DONE
        }

        // 1[AWAIT]. if for some reason a component re-renders from something else
        // and the promise is not resolved/rejected, keep waiting by throwing it again
        // as in step 1.
        throw existingPromise.promise
        // goto 2[RESOLVE] or 2[REJECT].
    }

    console.time("usePromise: " + id)

    const promiseCache: PromiseCache = {
        response: NoResponse,
        promise: promise()
            .then((response) => {
                // 2[RESOLVE]. if it resolves
                // after this frame react will re-render
                promiseCache.response = response
                console.timeEnd("usePromise: " + id)
                // goto 3[RESOLVE]
            })
            .catch((e) => {
                // 2[REJECT]. if it rejects
                // after this frame react will re-render
                promiseCache.error = e
                // goto 3[REJECT]
            }),
    }
    promiseCaches.set(id, promiseCache)

    // 1[AWAIT]. the promise created above is thrown and react will wait for it to resolve
    // react will re-render if the promise is resolved or rejected
    throw promiseCache.promise
    // goto 2[RESOLVE] or 2[REJECT].
}

// if we are sure the data has been updated, we can clear the cache
// but in firebase, subsequent data can be provided with onSnapshot
export const clearUsePromiseCache = (id?: string) => {
    if (!id) {
        promiseCaches.clear()
        return
    }
    promiseCaches.delete(id)
}
