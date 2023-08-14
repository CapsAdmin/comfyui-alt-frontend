import { ComfyResources } from "../Api/Api"
import { NodeLink } from "../Api/Nodes"
import { Config } from "../CustomWorkflowPage"

export type ConditioningArgument = { positive: NodeLink; negative: NodeLink }
export type NetworkArgument = { model: NodeLink; clip: NodeLink }
abstract class BaseWorkflowModifier {
    abstract title: string
    abstract config: { [key: string]: any }
}

export abstract class BaseWorkflowConfigModifier extends BaseWorkflowModifier {
    static type = "config"
    abstract apply(config: Config, resources: ComfyResources): void
}
export abstract class BaseWorkflowConditioningModifier extends BaseWorkflowModifier {
    static type = "conditioner"
    abstract apply(
        conditioning: ConditioningArgument,
        resources: ComfyResources
    ): ConditioningArgument
}

export abstract class BaseWorkflowNetworkModifier extends BaseWorkflowModifier {
    static type = "network"
    abstract apply(network: NetworkArgument, resources: ComfyResources): NetworkArgument
}

export abstract class BaseWorkflowPostprocessModifier extends BaseWorkflowModifier {
    static type = "postprocess"
    abstract apply(latentImage: NodeLink, resources: ComfyResources): NodeLink
}

export const SerializeModifier = (obj: BaseWorkflowModifier) => {
    return JSON.stringify({ ...obj, __class: obj.constructor.name })
}

export const DeserializeModifier = (str: string, available: readonly BaseWorkflowModifier[]) => {
    const obj = JSON.parse(str) as BaseWorkflowModifier & { __class: string }
    const class_name = obj.__class
    const ctor = available.find((x) => x.name === class_name)
    window.LOL = available
    if (!ctor)
        throw new Error(
            `Class ${class_name} not found. Available: ${available.map((x) => x.name).join(", ")}}`
        )

    const res = new ctor(obj.id)
    Object.assign(res, obj)
    return res
}
