const map = new WeakMap()
let id = 0
export function uniqueObjectId(obj: any) {
    if (!map.has(obj)) {
        map.set(obj, id++)
    }
    return map.get(obj).toString()
}
