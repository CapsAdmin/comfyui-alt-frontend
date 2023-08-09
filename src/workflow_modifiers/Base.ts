import { ComfyResources } from "../Api/Api"
import { NodeLink } from "../Api/Nodes"
import { Config } from "../CustomWorkflowPage"

export type ConditioningArgument = { positive: NodeLink; negative: NodeLink }
abstract class BaseWorkflowModifier {
    abstract title: string
    abstract config: { [key: string]: any }
    id: number

    constructor(id: number) {
        this.id = id
    }
}

export abstract class BaseWorkflowConfigModifier extends BaseWorkflowModifier {
    abstract type: "config"
    abstract apply(config: Config, resources: ComfyResources): void
}
export abstract class BaseWorkflowConditioningModifier extends BaseWorkflowModifier {
    abstract type: "conditioner"
    abstract apply(
        conditioning: ConditioningArgument,
        resources: ComfyResources
    ): ConditioningArgument
}
