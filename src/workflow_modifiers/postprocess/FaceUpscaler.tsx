import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { ComfyResources } from "../../Api/Api"
import { FaceRestoreModelLoader, FaceRestoreWithModel, NodeLink } from "../../Api/Nodes"
import { BaseWorkflowPostprocessModifier } from "./../Base"

export class FaceUpscaler extends BaseWorkflowPostprocessModifier {
    title = "Face Upscaler"
    type = "postprocess" as const
    config = {
        weight: 1,
    }
    apply(image: NodeLink, resources: ComfyResources) {
        const model = FaceRestoreModelLoader({
            model_name: "codeformer-v0.1.0.pth",
        }).FACERESTORE_MODEL0

        const newImage = FaceRestoreWithModel({
            facerestore_model: model,
            image: image,
            facedetection: "retinaface_resnet50",
            weight: this.config.weight,
        }).IMAGE0

        return newImage
    }

    render = (props: {
        value: FaceUpscaler["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <Stack>
                    <LabeledSlider
                        value={props.value.weight}
                        onChange={(v) => props.onChange({ ...props.value, weight: v })}
                        min={0}
                        max={1}
                        step={0.001}
                        label="Likeness Weight"
                    />
                </Stack>
            </Stack>
        )
    }
}
