import { Button, MenuItem, Select, Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { Suspense } from "react"
import { ComfyResources, useCivitAIInfo, useRuntimeNodeProperty } from "../../Api/Api"
import { LoraLoader } from "../../Api/Nodes"
import ErrorBoundary from "../../components/ErrorBoundary"
import { BaseWorkflowNetworkModifier, NetworkArgument } from "./../Base"

const inputTypes = [window.HTMLInputElement, window.HTMLSelectElement, window.HTMLTextAreaElement]

export const triggerInputChange = (node: any, value = "") => {
    // only process the change on elements we know have a value setter in their constructor
    if (inputTypes.indexOf(node.__proto__.constructor) > -1) {
        const setValue = Object.getOwnPropertyDescriptor(node.__proto__, "value")?.set
        if (!setValue) {
            return
        }
        const event = new Event("input", { bubbles: true })

        setValue.call(node, value)
        node.dispatchEvent(event)
    }
}

const CivitAIInfo = (props: { name: string }) => {
    console.log(props.name, "!?!!??")
    const [modelInfo, metadata] = useCivitAIInfo("loras", props.name)
    const trainedWords = modelInfo.trainedWords || []
    const input = document.getElementById("positive-prompts") as HTMLTextAreaElement

    const tags = []
    let metadataTags = []
    if (metadata && metadata.ss_tag_frequency) {
        try {
            let data = JSON.parse(metadata.ss_tag_frequency)
            data = data[Object.keys(data)[0]]

            const newMap = {}

            for (const tag in data) {
                if (tag.includes(" ")) {
                    for (const subtag of tag.split(" ")) {
                        newMap[subtag] = (newMap[subtag] || 0) + data[tag]
                    }
                } else {
                    newMap[tag] = (newMap[tag] || 0) + data[tag]
                }
            }
            let sorted = []

            for (const [tag, score] of Object.entries(newMap)) {
                sorted.push([tag, score])
            }
            sorted.sort((a, b) => b[1] - a[1])
            // remove words like the, a, etc
            sorted = sorted.filter((a) => a[0].length > 3)
            // top 5
            sorted = sorted.slice(0, 5)

            metadataTags = sorted
        } catch (e) {
            console.log(e)
        }
    }

    for (const tag of metadataTags) {
        if (!trainedWords.includes(tag)) {
            tags.push(tag[0])
        }
    }

    for (const tag of trainedWords) {
        tags.push(tag)
    }

    return (
        <Stack>
            {modelInfo.images && modelInfo.images[0] && (
                <img width={256} src={modelInfo.images[0].url}></img>
            )}
            <Stack flexWrap={"wrap"} direction={"row"} spacing={0} style={{ maxWidth: 512 }}>
                {tags.map((tag) => {
                    return (
                        <Button
                            size="small"
                            key={tag}
                            variant={input.value.includes(tag) ? "contained" : "outlined"}
                            onClick={() => {
                                let prompts = input.value
                                if (!prompts.includes(tag)) {
                                    if (prompts.endsWith(" ") || prompts.length === 0) {
                                        prompts += tag
                                    } else {
                                        prompts += " " + tag
                                    }
                                } else {
                                    prompts = prompts.replace(tag, "")
                                }

                                triggerInputChange(input, prompts)
                            }}
                        >
                            {tag}
                        </Button>
                    )
                })}
            </Stack>
        </Stack>
    )
}

export class NetworkModifier extends BaseWorkflowNetworkModifier {
    title = "Network Modifier"
    type = "network" as const
    config = {
        unetStrength: 1,
        clipStrength: 1,
        model: "",
    }
    override apply(network: NetworkArgument, resources: ComfyResources) {
        if (!this.config.model) {
            return network
        }

        const loraModel = LoraLoader({
            lora_name: this.config.model,
            model: network.model,
            clip: network.clip,
            strength_clip: this.config.clipStrength,
            strength_model: this.config.unetStrength,
        })

        return {
            model: loraModel.MODEL0,
            clip: loraModel.CLIP1,
        }
    }

    render = (props: {
        value: NetworkModifier["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        const availableModels = useRuntimeNodeProperty<string[]>("LoraLoader", "lora_name")

        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <Stack>
                    <Select
                        value={props.value.model}
                        onChange={(e) =>
                            props.onChange({ ...props.value, model: e.target.value as any })
                        }
                    >
                        {availableModels.available.map((model) => (
                            <MenuItem key={model} value={model}>
                                {model}
                            </MenuItem>
                        ))}
                    </Select>
                    <LabeledSlider
                        value={props.value.clipStrength}
                        onChange={(v) => props.onChange({ ...props.value, clipStrength: v })}
                        min={-5}
                        max={5}
                        step={0.01}
                        label="Clip Strength"
                    />
                    <LabeledSlider
                        value={props.value.unetStrength}
                        onChange={(v) => props.onChange({ ...props.value, unetStrength: v })}
                        min={-5}
                        max={5}
                        step={0.01}
                        label="Model Strength"
                    />
                    <ErrorBoundary fallback={<div>error</div>}>
                        <Suspense fallback={<div>loading</div>}>
                            <CivitAIInfo name={props.value.model} />
                        </Suspense>
                    </ErrorBoundary>
                </Stack>
            </Stack>
        )
    }
}
