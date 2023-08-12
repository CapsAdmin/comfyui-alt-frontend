import { Stack, TextField, Typography } from "@mui/material"
import { LabeledSlider } from "../../components/LabeledSlider"

import { useEffect, useState } from "react"
import { ComfyFile, ComfyResources, api } from "../../Api/Api"
import {
    BuildWorkflow,
    CollectOutput,
    FaceSwapNode,
    ImageBlend,
    LoadImage,
    NodeLink,
} from "../../Api/Nodes"
import AverageFace from "../../Assets/average_face.png"
import { getLastOutput } from "../../CustomWorkflowPage"
import { ImageUploadZone } from "../../components/ImageUploadZone"
import { BaseWorkflowPostprocessModifier } from "../Base"

let timerId: number

export class FaceSwapper extends BaseWorkflowPostprocessModifier {
    title = "Face Swapper"
    type = "postprocess" as const
    config = {
        image: undefined as ComfyFile | undefined,
        source_face_index: 0,
        target_face_indices: "0",
        blend: 0.75,
        blend2: 1,
        expression_multiplier: 0,
        expression_pow: 1,
    }
    apply(image: NodeLink, resources: ComfyResources) {
        CollectOutput(image, "face_swap_input")

        const faceImage = LoadImage({
            image: this.config.image!.name,
        }).IMAGE0

        const newImage = FaceSwapNode({
            face: faceImage,
            image: image,
            source_face_index: this.config.source_face_index,
            target_face_indices: this.config.target_face_indices,
            blend: this.config.blend2,
            expression_multiplier: this.config.expression_multiplier,
            expression_pow: this.config.expression_pow,
        }).IMAGE0

        const blendedImage = ImageBlend({
            image1: image,
            image2: newImage,
            blend_mode: "normal",
            blend_factor: this.config.blend,
        }).IMAGE0

        return blendedImage
    }

    render = (props: {
        value: FaceSwapper["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        const [imageOverlayFile, setImageOverlayFile] = useState<ComfyFile>()

        useEffect(() => {
            const refreshPreview = () => {
                const filename = props.value.image?.name

                if (!filename) {
                    return
                }

                // eslint-disable-next-line @typescript-eslint/no-extra-semi
                ;(async () => {
                    const res = await api.executePrompt(
                        0,
                        (
                            await BuildWorkflow(async () => {
                                let sourceFile

                                const found = getLastOutput().find(
                                    (v) => v.userdata == "face_swap_input"
                                )
                                if (found) {
                                    sourceFile = found.images[found.images.length - 1]
                                    const existingPreview = await api.view(sourceFile)
                                    sourceFile = await api.uploadFile(existingPreview)
                                } else {
                                    sourceFile = await api.uploadFile(
                                        new File(
                                            [await (await fetch(AverageFace)).blob()],
                                            "woman.png"
                                        )
                                    )
                                }
                                const sourceImage = LoadImage({
                                    image: sourceFile!.name,
                                }).IMAGE0

                                const faceImage = LoadImage({
                                    image: this.config.image!.name,
                                }).IMAGE0

                                const newImage = FaceSwapNode({
                                    face: faceImage,
                                    image: sourceImage,
                                    source_face_index: this.config.source_face_index,
                                    target_face_indices: this.config.target_face_indices,
                                    blend: this.config.blend2,
                                    expression_multiplier: this.config.expression_multiplier,
                                    expression_pow: this.config.expression_pow,
                                }).IMAGE0

                                const blendedImage = ImageBlend({
                                    image1: sourceImage,
                                    image2: newImage,
                                    blend_mode: "normal",
                                    blend_factor: this.config.blend,
                                }).IMAGE0

                                CollectOutput(blendedImage)
                            })
                        )[0]
                    )
                    const lol = res[res.length - 1].images[0]

                    setImageOverlayFile({
                        name: lol.filename,
                        type: lol.type,
                        subfolder: "",
                    })
                })()
            }

            // debounce
            if (timerId) {
                clearTimeout(timerId)
            }
            timerId = setTimeout(() => {
                refreshPreview()
            }, 250)
        }, [JSON.stringify(props.value)])

        return (
            <Stack>
                <Typography>{this.title}</Typography>
                <ImageUploadZone
                    overlayImage={imageOverlayFile}
                    value={props.value.image}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
                    <TextField
                        label="Target Face Indices"
                        value={props.value.target_face_indices}
                        onChange={(e) =>
                            props.onChange({ ...props.value, target_face_indices: e.target.value })
                        }
                    />
                    <LabeledSlider
                        value={props.value.source_face_index}
                        onChange={(v) => props.onChange({ ...props.value, source_face_index: v })}
                        min={0}
                        max={10}
                        step={1}
                        label="Source Face Index"
                    />
                    <LabeledSlider
                        value={props.value.blend}
                        onChange={(v) => props.onChange({ ...props.value, blend: v })}
                        min={0}
                        max={1}
                        step={0.01}
                        label="Blend"
                    />
                    <LabeledSlider
                        value={props.value.blend2}
                        onChange={(v) => props.onChange({ ...props.value, blend2: v })}
                        min={-25}
                        max={250}
                        step={0.01}
                        label="Blend2"
                    />

                    <LabeledSlider
                        value={props.value.expression_multiplier}
                        onChange={(v) =>
                            props.onChange({ ...props.value, expression_multiplier: v })
                        }
                        min={-2}
                        max={2}
                        step={0.01}
                        label="expression multiplier"
                    />
                    <LabeledSlider
                        value={props.value.expression_pow}
                        onChange={(v) => props.onChange({ ...props.value, expression_pow: v })}
                        min={0}
                        max={2}
                        step={0.01}
                        label="expression pow"
                    />
                </Stack>
            </Stack>
        )
    }
}
