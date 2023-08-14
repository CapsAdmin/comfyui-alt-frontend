import { MenuItem, Select, Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { ComfyFile, ComfyResources, useRuntimeNodeProperty } from "../../Api/Api"
import { ConditioningAverage_, ImageScale, LoadImage, SEECoderImageEncode } from "../../Api/Nodes"
import { ImageUploadZone } from "../../components/ImageUploadZone"
import { BaseWorkflowConditioningModifier, ConditioningArgument } from "./../Base"

export class SeeCoder extends BaseWorkflowConditioningModifier {
    title = "SeeCoder"
    type = "conditioner" as const
    config = {
        strength: 1,
        image: undefined as ComfyFile | undefined,
        model: "seecoder-v1-0.safetensors",
    }
    override apply(conditioning: ConditioningArgument, resources: ComfyResources) {
        const image = LoadImage({
            image: this.config.image!.name,
        }).IMAGE0

        const scaledImage = ImageScale({
            crop: "center",
            image: image,
            width: 512,
            height: 512,
            upscale_method: "bicubic",
        }).IMAGE0

        const applier = SEECoderImageEncode({
            image: scaledImage,
            seecoder_name: this.config.model,
        })

        const averager = ConditioningAverage_({
            conditioning_to: applier.CONDITIONING0,
            conditioning_from: conditioning.positive,
            conditioning_to_strength: this.config.strength,
        })

        return { positive: averager.CONDITIONING0, negative: conditioning.negative }
    }

    render = (props: {
        value: SeeCoder["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        const availableModels = useRuntimeNodeProperty<string[]>(
            "SEECoderImageEncode",
            "seecoder_name"
        )

        return (
            <Stack>
                <Typography>{this.title}</Typography>

                <ImageUploadZone
                    value={props.value.image}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
                    <Select
                        value={props.value.model}
                        onChange={(e) =>
                            props.onChange({ ...props.value, model: e.target.value as any })
                        }
                    >
                        {availableModels.available.map((model) => (
                            <MenuItem value={model}>{model}</MenuItem>
                        ))}
                    </Select>
                    <LabeledSlider
                        value={props.value.strength}
                        onChange={(v) => props.onChange({ ...props.value, strength: v })}
                        min={0}
                        max={1}
                        step={0.01}
                        label="Strength"
                    />
                </Stack>
            </Stack>
        )
    }
}
