import { Stack, TextField, Typography } from "@mui/material"
import { LabeledSlider } from "../components/LabeledSlider"

import { useEffect, useState } from "react"
import { ComfyFile, ComfyResources, api } from "../Api/Api"
import {
    BuildWorkflow,
    CLIPVisionEncode,
    CLIPVisionLoader,
    CannyEdgePreprocessor,
    CollectOutput,
    ConditioningAverage_,
    FaceRestoreModelLoader,
    FaceRestoreWithModel,
    FaceSwapNode,
    ImageBlend,
    ImageScale,
    LineArtPreprocessor,
    LoadImage,
    NodeLink,
    SEECoderImageEncode,
    StyleModelApply,
    StyleModelLoader,
    Zoe_DepthMapPreprocessor,
} from "../Api/Nodes"
import AverageFace from "../Assets/average_face.png"
import { Config, getLastOutput } from "../CustomWorkflowPage"
import { ImageUploadZone } from "../components/ImageUploadZone"
import { LabeledCheckbox } from "../components/LabeledCheckbox"
import {
    BaseWorkflowConditioningModifier,
    BaseWorkflowConfigModifier,
    BaseWorkflowPostprocessModifier,
    ConditioningArgument,
} from "./Base"
import { ControlNetPreprocessorBase, ImagePreprocessor } from "./ControlNetBase"

export class ControlNetCannyEdge extends ControlNetPreprocessorBase {
    title = "Canny Edge"
    checkPoint = "t2iadapter_canny_sd15v2.pth"
    PreProcessor = CannyEdgePreprocessor as ImagePreprocessor
    propConfig = {
        low_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 100 },
        high_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 200 },
        l2gradient: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}

export class ControlNetDepth extends ControlNetPreprocessorBase {
    title = "Depth"
    checkPoint = "t2iadapter_depth_sd15v2.pth"
    PreProcessor = Zoe_DepthMapPreprocessor as ImagePreprocessor
    propConfig = undefined
}

export class ControlNetLineArt extends ControlNetPreprocessorBase {
    title = "Line Art"
    checkPoint = "control_v11p_sd15_lineart.pth"
    PreProcessor = LineArtPreprocessor as ImagePreprocessor
    propConfig = {
        coarse: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}

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

export class SeeCoder extends BaseWorkflowConditioningModifier {
    title = "SeeCoder"
    type = "conditioner" as const
    config = {
        strength: 1,
        image: undefined as ComfyFile | undefined,
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
            seecoder_name: "seecoder-v1-0.safetensors",
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
