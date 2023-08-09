import { ComfyResources } from "../Api/Api"
import { NodeLink } from "../Api/Nodes"
import { Config } from "../CustomWorkflowPage"

export type ConditioningArgument = { positive: NodeLink; negative: NodeLink }
export abstract class BaseConditioner {
    abstract title: string
    abstract config: { [key: string]: any }
    id: number

    constructor(id: number) {
        this.id = id
    }
}

export abstract class BaseConfigConditioner extends BaseConditioner {
    abstract type: "config"
    abstract apply(config: Config, resources: ComfyResources): void
}
export abstract class BaseConditioningConditioner extends BaseConditioner {
    abstract type: "conditioner"
    abstract apply(
        conditioning: ConditioningArgument,
        resources: ComfyResources
    ): ConditioningArgument
}
