import { useEffect, useState } from 'react'
import type { Runtime } from 'wuchale/runtime'
import { registerLoaders } from 'wuchale/load-utils'
// @ts-expect-error - generated at build time by wuchale
import { loadCatalog, loadIDs } from './.wuchale/main.proxy.js'

export const key = 'main'
const callbacks: Record<string, Set<(runtime: Runtime) => void>> = {}
const store: Record<string, Runtime | undefined> = {}

// non-reactive
export const getRuntime = (loadID: string) => store[loadID] as Runtime

const collection = {
    get: getRuntime,
    set: (loadID: string, runtime: Runtime) => {
        store[loadID] = runtime // for when useEffect hasn't run yet
        callbacks[loadID]?.forEach((cb) => {
            cb(runtime)
        })
    },
}

registerLoaders(key, loadCatalog, loadIDs, collection)

export const getRuntimeRx = (loadID: string) => {
    // function to useState because runtime is a function too
    const [runtime, setRuntime] = useState(() => getRuntime(loadID))
    useEffect(() => {
        const cb = (runtime: Runtime) => setRuntime(() => runtime)
        callbacks[loadID] ??= new Set()
        callbacks[loadID].add(cb)
        return () => {
            callbacks[loadID]?.delete(cb)
        }
    }, [loadID])
    return runtime
}
