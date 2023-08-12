import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { ComfyFile, ComfyResources } from "../../Api/Api"
import { Config } from "../../CustomWorkflowPage"
import { ImageUploadZone } from "../../components/ImageUploadZone"
import { LabeledCheckbox } from "../../components/LabeledCheckbox"
import { BaseWorkflowConfigModifier } from "./../Base"

export class ImageToImage extends BaseWorkflowConfigModifier {
    title = "Image To Image"
    type = "config" as const
    config = {
        imageCrop: true,
        imageDenoise: 0.75,
        image: undefined as ComfyFile | undefined,
        referenceOnly: false,
    }
    apply(config: Config, resources: ComfyResources) {
        config.image = this.config.image
        config.imageDenoise = this.config.imageDenoise
        config.imageCrop = this.config.imageCrop
        config.imageReferenceOnly = this.config.referenceOnly
    }

    render = (props: {
        value: ImageToImage["config"]
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
                        value={props.value.imageDenoise}
                        onChange={(v) => props.onChange({ ...props.value, imageDenoise: v })}
                        min={0}
                        max={1}
                        step={0.001}
                        label="denoise"
                    />
                    <LabeledCheckbox
                        value={props.value.imageCrop}
                        onChange={(v) => props.onChange({ ...props.value, imageCrop: v })}
                        label="Crop Image"
                    />
                    <LabeledCheckbox
                        value={props.value.referenceOnly}
                        onChange={(v) => props.onChange({ ...props.value, referenceOnly: v })}
                        label="Reference Only"
                    />
                </Stack>
            </Stack>
        )
    }
}
