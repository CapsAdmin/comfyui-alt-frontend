import { useEffect, useState } from "react"

class ComfyApi extends EventTarget {
    #registered = new Set()
    socket?: WebSocket
    clientId?: string
    host = location.host
    protocol = location.protocol

    constructor() {
        super()
    }

    async fetch(input: string, init?: RequestInit) {
        return await fetch(this.protocol + "://" + this.host + input, init)
    }

    addEventListener(
        type: string,
        callback: (evt: Event) => void,
        options?: AddEventListenerOptions
    ) {
        super.addEventListener(type, callback, options)
        this.#registered.add(type)
    }

    /**
     * Poll status  for colab and other things that don't support websockets.
     */
    #pollQueue() {
        setInterval(async () => {
            try {
                const resp = await this.fetch("/prompt")
                const status = (await resp.json()) as string
                this.dispatchEvent(new CustomEvent("status", { detail: status }))
            } catch (error) {
                this.dispatchEvent(new CustomEvent("status", { detail: null }))
            }
        }, 1000)
    }

    /**
     * Creates and connects a WebSocket for realtime updates
     * @param {boolean} isReconnect If the socket is connection is a reconnect attempt
     */
    #createSocket(isReconnect?: boolean) {
        if (this.socket) {
            return
        }

        let opened = false
        let existingSession = window.name
        if (existingSession) {
            existingSession = "?clientId=" + existingSession
        }
        this.socket = new WebSocket(
            `ws${this.protocol === "https:" ? "s" : ""}://${this.host}/ws${existingSession}`
        )
        this.socket.binaryType = "arraybuffer"

        this.socket.addEventListener("open", () => {
            opened = true
            if (isReconnect) {
                this.dispatchEvent(new CustomEvent("reconnected"))
            }
        })

        this.socket.addEventListener("error", () => {
            if (this.socket) this.socket.close()
            if (!isReconnect && !opened) {
                this.#pollQueue()
            }
        })

        this.socket.addEventListener("close", () => {
            setTimeout(() => {
                this.socket = undefined
                this.#createSocket(true)
            }, 300)
            if (opened) {
                this.dispatchEvent(new CustomEvent("status", { detail: null }))
                this.dispatchEvent(new CustomEvent("reconnecting"))
            }
        })

        this.socket.addEventListener("message", (event: MessageEvent<any>) => {
            try {
                if (event.data instanceof ArrayBuffer) {
                    const view = new DataView(event.data)
                    const eventType = view.getUint32(0)
                    const buffer = event.data.slice(4)
                    switch (eventType) {
                        case 1:
                            const view2 = new DataView(event.data)
                            const imageType = view2.getUint32(0)
                            let imageMime
                            switch (imageType) {
                                case 1:
                                default:
                                    imageMime = "image/jpeg"
                                    break
                                case 2:
                                    imageMime = "image/png"
                            }
                            const imageBlob = new Blob([buffer.slice(4)], { type: imageMime })
                            this.dispatchEvent(new CustomEvent("b_preview", { detail: imageBlob }))
                            break
                        default:
                            throw new Error(`Unknown binary websocket message of type ${eventType}`)
                    }
                } else {
                    const msg = JSON.parse(event.data) as
                        | {
                              type: "status"
                              data: { sid?: string; status: string }
                          }
                        | {
                              type: "progress"
                              data: any
                          }
                        | {
                              type: "executing"
                              data: { node: any }
                          }
                        | {
                              type: "executed"
                              data: any
                          }
                        | {
                              type: "execution_start"
                              data: any
                          }
                        | {
                              type: "execution_cached"
                              data: any
                          }
                        | {
                              type: "execution_error"
                              data: any
                          }

                    switch (msg.type) {
                        case "status":
                            if (msg.data.sid) {
                                this.clientId = msg.data.sid
                                window.name = this.clientId
                            }
                            this.dispatchEvent(
                                new CustomEvent("status", { detail: msg.data.status })
                            )
                            break
                        case "progress":
                            this.dispatchEvent(new CustomEvent("progress", { detail: msg.data }))
                            break
                        case "executing":
                            this.dispatchEvent(
                                new CustomEvent("executing", { detail: msg.data.node })
                            )
                            break
                        case "executed":
                            this.dispatchEvent(new CustomEvent("executed", { detail: msg.data }))
                            break
                        case "execution_start":
                            this.dispatchEvent(
                                new CustomEvent("execution_start", { detail: msg.data })
                            )
                            break
                        case "execution_error":
                            this.dispatchEvent(
                                new CustomEvent("execution_error", { detail: msg.data })
                            )
                            break
                        case "execution_cached":
                            this.dispatchEvent(
                                new CustomEvent("execution_cached", { detail: msg.data })
                            )
                            break
                        default:
                            const umsg = msg as { type: string; data: any }
                            if (this.#registered.has(umsg.type)) {
                                this.dispatchEvent(
                                    new CustomEvent(umsg.type, { detail: umsg.data })
                                )
                            } else {
                                throw new Error(`Unknown message type ${umsg.type}`)
                            }
                    }
                }
            } catch (error) {
                console.warn("Unhandled message:", event.data, error)
            }
        })
    }

    /**
     * Initialises sockets and realtime updates
     */
    init() {
        this.#createSocket()
    }

    /**
     * Gets a list of extension urls
     * @returns An array of script urls to import
     */
    async getExtensions() {
        const resp = await this.fetch("/extensions", { cache: "no-store" })
        return (await resp.json()) as Array<any>
    }

    /**
     * Gets a list of embedding names
     * @returns An array of script urls to import
     */
    async getEmbeddings() {
        const resp = await this.fetch("/embeddings", { cache: "no-store" })
        return await resp.json()
    }

    /**
     * Loads node object definitions for the graph
     * @returns The node definitions
     */
    async getNodeDefs() {
        const resp = await this.fetch("/object_info", { cache: "no-store" })
        return await resp.json()
    }

    async view(req: {
        filename: string
        type?: string
        subfolder?: string
        channel?: string
        preview?: string
    }) {
        const query = new URLSearchParams(req as any)
        const resp = await this.fetch("/view" + "?" + query.toString(), { cache: "no-store" })
        return await resp.blob()
    }

    async getNodes() {
        const resp = await this.fetch("/object_info", { cache: "no-store" })
        return await resp.json()
    }

    /**
     *
     * @param {number} number The index at which to queue the prompt, passing -1 will insert the prompt at the front of the queue
     * @param {object} prompt The prompt data to queue
     */
    async queuePrompt(number: number, prompt: any) {
        const body: {
            client_id?: string
            prompt: string
            extra_data: { extra_pnginfo: { workflow: string } }
            front?: boolean
            number?: number
        } = {
            client_id: this.clientId,
            prompt: prompt.output,
            extra_data: { extra_pnginfo: { workflow: prompt.workflow } },
        }

        if (number === -1) {
            body.front = true
        } else if (number != 0) {
            body.number = number
        }

        const res = await this.fetch("/prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })

        if (res.status !== 200) {
            throw {
                response: await res.json(),
            }
        }

        return (await res.json()) as { prompt_id: string; number: number }
    }

    awaitingPrompts = new Map<string, any>()

    async executePrompt(
        number: number,
        prompt: any,
        onPreviewImage?: (img: string) => void,
        onProgress?: (prog: number, max: number) => void
    ): Promise<{
        node: string
        output: {
            images: Array<{
                filename: string
                subfolder: string
                type: string
            }>
        }
        prompt_id: string
    }> {
        const progress = (data: any) => {
            const progress = data.detail.value as number
            const max = data.detail.max as number
            if (onProgress) onProgress(progress, max)
        }

        const b_preview = (data: any) => {
            if (onPreviewImage) onPreviewImage(URL.createObjectURL(data.detail as Blob))
        }

        this.addEventListener("progress", progress)
        this.addEventListener("b_preview", b_preview)

        const res = await this.queuePrompt(number, prompt)
        return new Promise((resolve, reject) => {
            const executed = (event: any) => {
                if (event.detail.prompt_id === res.prompt_id) {
                    this.removeEventListener("executed", executed)
                    this.removeEventListener("progress", progress)
                    this.removeEventListener("b_preview", b_preview)
                    resolve(event.detail)
                }
            }
            this.addEventListener("executed", executed)
        })
    }

    /**
     * Loads a list of items (queue or history)
     * @param {string} type The type of items to load, queue or history
     * @returns The items of the specified type grouped by their status
     */
    async getItems(type: string) {
        if (type === "queue") {
            return this.getQueue()
        }
        return this.getHistory()
    }

    /**
     * Gets the current state of the queue
     * @returns The currently running and queued items
     */
    async getQueue() {
        try {
            const res = await this.fetch("/queue")
            const data = (await res.json()) as {
                queue_running: Array<string>
                queue_pending: Array<string>
            }
            return {
                // Running action uses a different endpoint for cancelling
                Running: data.queue_running.map((prompt) => ({
                    prompt,
                    remove: { name: "Cancel", cb: () => api.interrupt() },
                })),
                Pending: data.queue_pending.map((prompt) => ({ prompt })),
            }
        } catch (error) {
            console.error(error)
            return { Running: [], Pending: [] }
        }
    }

    /**
     * Gets the prompt execution history
     * @returns Prompt history including node outputs
     */
    async getHistory() {
        try {
            const res = await this.fetch("/history")
            return { History: Object.values(await res.json()) }
        } catch (error) {
            console.error(error)
            return { History: [] }
        }
    }

    /**
     * Sends a POST request to the API
     * @param {*} type The endpoint to post to
     * @param {*} body Optional POST data
     */
    async #postItem(type: string, body: any) {
        try {
            await this.fetch("/" + type, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body ? JSON.stringify(body) : undefined,
            })
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Deletes an item from the specified list
     * @param {string} type The type of item to delete, queue or history
     * @param {number} id The id of the item to delete
     */
    async deleteItem(type: string, id: number) {
        await this.#postItem(type, { delete: [id] })
    }

    /**
     * Clears the specified list
     * @param {string} type The type of list to clear, queue or history
     */
    async clearItems(type: string) {
        await this.#postItem(type, { clear: true })
    }

    /**
     * Interrupts the execution of the running prompt
     */
    async interrupt() {
        await this.#postItem("interrupt", null)
    }

    async uploadFile(file: File) {
        try {
            const body = new FormData()
            body.append("image", file)
            body.append("overwrite", "true")
            const resp = await this.fetch("/upload/image", {
                method: "POST",
                body,
            })
            if (resp.status === 200) {
                const data = await resp.json()

                return data
            } else {
                alert(resp.status + " - " + resp.statusText)
            }
        } catch (error) {
            alert(error)
        }
    }
}

export const api = new ComfyApi()

api.protocol = "http"
api.host = "127.0.0.1:8188"
api.init()
export interface ComfyResources {
    checkpoints: string[]
    embeddings: string[]
    hypernetworks: string[]
    loras: string[]
    controlnets: string[]
    samplingMethods: string[]
    samplingSchedulers: string[]
    nodes: { [key: string]: ComfyNodeDef }
}

export const useComfyAPI = () => {
    const [resources, setResources] = useState<ComfyResources>({
        checkpoints: [],
        embeddings: [],
        hypernetworks: [],
        loras: [],
        controlnets: [],
        samplingMethods: [],
        samplingSchedulers: [],
        nodes: {},
    })

    useEffect(() => {
        ;(async () => {
            const nodes = await api.getNodes()
            const embeddings = await api.getEmbeddings()
            const checkpoints = nodes.CheckpointLoaderSimple.input.required.ckpt_name[0]
            const samplingMethods = nodes.KSamplerAdvanced.input.required.sampler_name[0]
            const samplingSchedulers = nodes.KSamplerAdvanced.input.required.scheduler[0]
            const loras = nodes.LoraLoader.input.required.lora_name[0]
            const hypernetworks = nodes.HypernetworkLoader.input.required.hypernetwork_name[0]
            const controlnets = nodes.ControlNetLoader.input.required.control_net_name[0]

            setResources({
                nodes,
                checkpoints,
                embeddings,
                hypernetworks,
                loras,
                controlnets,
                samplingMethods,
                samplingSchedulers,
            })
        })()
    }, [])

    return resources
}

export type ComfyNodeDef = {
    name: string
    display_name?: string
    category: string
    output_node?: boolean
    input: ComfyNodeDefInputs
    /** Output type like "LATENT" or "IMAGE" */
    output: string[]
    output_name: string[]
    output_is_list: boolean[]
}

export type ComfyNodeDefInputs = {
    required: Record<string, ComfyNodeDefInput>
    optional?: Record<string, ComfyNodeDefInput>
}
export type ComfyNodeDefInput = [ComfyNodeDefInputType, ComfyNodeDefInputOptions | null]

/**
 * - Array: Combo widget. Usually the values are strings but they can also be other stuff like booleans.
 * - "INT"/"FLOAT"/etc.: Non-combo type widgets. See ComfyWidgets type.
 * - other string: Must be a backend input type, usually something lke "IMAGE" or "LATENT".
 */
export type ComfyNodeDefInputType = any[] | string

export type ComfyNodeDefInputOptions = {
    forceInput?: boolean

    // NOTE: For COMBO type inputs, the default value is always the first entry in the list.
    default?: any

    // INT/FLOAT options
    min?: number
    max?: number
    step?: number

    // STRING options
    multiline?: boolean
}

// TODO if/when comfy refactors
export type ComfyNodeDefOutput = {
    type: string
    name: string
    is_list?: boolean
}

export type ComfyFile = { name: string; subfolder: string; type: string }
