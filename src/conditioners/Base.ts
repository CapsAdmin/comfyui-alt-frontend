import { ComfyResources } from "../Api/Api"
import { Config } from "../CustomWorkflowPage"

export abstract class BaseConditioner {
    abstract title: string
    abstract type: "conditioner" | "config"
    abstract config: { [key: string]: any }
    abstract apply(
        conditioning: { CONDITIONING0: any } | Config,
        resources: ComfyResources
    ): void | { readonly CONDITIONING0: [string, number] }
    id: number

    constructor(id: number) {
        this.id = id
    }
}
