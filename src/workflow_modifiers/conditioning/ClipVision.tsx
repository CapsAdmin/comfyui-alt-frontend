import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { ComfyFile, ComfyResources } from "../../Api/Api"
import {
    CLIPVisionEncode,
    CLIPVisionLoader,
    ConditioningAverage_,
    LoadImage,
    StyleModelApply,
    StyleModelLoader,
} from "../../Api/Nodes"
import { ImageUploadZone } from "../../components/ImageUploadZone"
import { BaseWorkflowConditioningModifier, ConditioningArgument } from "../Base"

export class ClipVision extends BaseWorkflowConditioningModifier {
    title = "Clip Vision"
    type = "conditioner" as const
    config = {
        strength: 1,
        image: undefined as ComfyFile | undefined,
    }
    override apply(conditioning: ConditioningArgument, resources: ComfyResources) {
        const image = LoadImage({
            image: this.config.image!.name,
        }).IMAGE0

        const clipVisionModel = CLIPVisionLoader({
            clip_name: "clip-vit-large-patch14.bin",
        }).CLIP_VISION0

        const styleModel = StyleModelLoader({
            style_model_name: "t2iadapter_style_sd14v1.pth",
        }).STYLE_MODEL0

        const clipVisionEncoder = CLIPVisionEncode({
            image: image,
            clip_vision: clipVisionModel,
        }).CLIP_VISION_OUTPUT0

        const applier = StyleModelApply({
            style_model: styleModel,
            clip_vision_output: clipVisionEncoder,
            conditioning: conditioning.positive,
        })

        const averager = ConditioningAverage_({
            conditioning_to: applier.CONDITIONING0,
            conditioning_from: conditioning.positive,
            conditioning_to_strength: this.config.strength,
        })

        return { positive: averager.CONDITIONING0, negative: conditioning.negative }
    }

    render = (props: {
        value: ClipVision["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <ImageUploadZone
                    value={props.value.image}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
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
