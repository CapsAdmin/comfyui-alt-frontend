import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../components/LabeledSlider"

import { useEffect, useState } from "react"
import { ComfyFile, ComfyResources, api } from "../Api/Api"
import {
    BuildWorkflow,
    ControlNetApplyAdvanced,
    ControlNetLoader,
    LoadImage,
    NodeLink,
    PreviewImage,
} from "../Api/Nodes"
import { ImageUploadZone } from "../components/ImageUploadZone"
import { LabeledCheckbox } from "../components/LabeledCheckbox"
import { BaseConditioningConditioner, ConditioningArgument } from "./Base"

let timerId: number

export type ImagePreprocessor = (input: { image: NodeLink }) => { readonly IMAGE0: NodeLink }

export type PropConfig =
    | {
          type: "number"
          min: number
          max: number
          step: number
          value: number
      }
    | {
          type: "boolean"
          _true: any
          _false: any
          value: any
      }

export abstract class ControlNetPreprocessorBase extends BaseConditioningConditioner {
    title = "controlnet-preprocessor"
    type = "conditioner" as const

    abstract propConfig?: { [key: string]: PropConfig }
    abstract PreProcessor: ImagePreprocessor
    abstract checkPoint: string

    _config = {
        strength: 1,
        startPercent: 0,
        stopPercent: 1,
        preProcess: true,
        image: undefined as ComfyFile | undefined,
        overlayImage: undefined as ComfyFile | undefined,
    }

    get config() {
        const out = { ...this._config }

        if (this.propConfig) {
            for (const key in this.propConfig) {
                if (key in out) continue
                const value = this.propConfig[key as keyof typeof this.propConfig]
                out[key] = value.value
            }
        }

        return out
    }

    set config(value) {
        this._config = value
    }

    runPreprocessor(image: NodeLink) {
        if (!this.config.preProcess) {
            return image
        }

        const keyValues: { [key: string]: any } = {}

        if (this.propConfig) {
            for (const key in this.propConfig) {
                keyValues[key] = this.config[key as keyof typeof this.config]
            }
        }

        console.log(image, "!!")

        return this.PreProcessor({
            image: image,
            ...keyValues,
        }).IMAGE0
    }

    apply(conditioning: ConditioningArgument, resources: ComfyResources) {
        const image = LoadImage({
            image: this.config.image!.name,
        }).IMAGE0

        const model = ControlNetLoader({
            control_net_name: this.checkPoint,
        })

        const processor = this.runPreprocessor(image)

        const res = ControlNetApplyAdvanced({
            control_net: model.CONTROL_NET0,
            image: processor,
            strength: this.config.strength,
            positive: conditioning.positive,
            negative: conditioning.negative,
            start_percent: this.config.startPercent,
            end_percent: this.config.stopPercent,
        })

        return {
            positive: res.CONDITIONING0,
            negative: res.CONDITIONING1,
        }
    }

    render = (props: {
        value: ControlNetPreprocessorBase["config"]
        onChange: (value: typeof props.value) => void
    }) => {
        const [imageOverlayFile, setImageOverlayFile] = useState<ComfyFile>()

        useEffect(() => {
            const refreshPreview = () => {
                const filename = props.value.image?.name

                if (!filename) {
                    return
                }

                if (!props.value.preProcess) {
                    setImageOverlayFile(undefined)
                    return
                }

                ;(async () => {
                    const res = await api.executePrompt(
                        0,
                        BuildWorkflow(() => {
                            const image = LoadImage({
                                image: filename,
                            }).IMAGE0

                            const processedImage = this.runPreprocessor(image)

                            console.log(processedImage)

                            PreviewImage({
                                images: processedImage,
                            })
                        })
                    )
                    const lol = res.output.images[0]

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
            <Stack spacing={1}>
                <Typography>{this.title}</Typography>
                <ImageUploadZone
                    value={props.value.image}
                    overlayImage={imageOverlayFile}
                    onChange={(file) => props.onChange({ ...props.value, image: file })}
                />
                <Stack>
                    <LabeledSlider
                        value={props.value.strength}
                        onChange={(v) => props.onChange({ ...props.value, strength: v })}
                        min={0}
                        max={5}
                        step={0.01}
                        label="Strength"
                    />

                    <LabeledSlider
                        value={props.value.startPercent}
                        onChange={(v) => props.onChange({ ...props.value, startPercent: v })}
                        min={0}
                        max={1}
                        step={0.01}
                        label="Start Precent"
                    />

                    <LabeledSlider
                        value={props.value.stopPercent}
                        onChange={(v) => props.onChange({ ...props.value, stopPercent: v })}
                        min={0}
                        max={1}
                        step={0.01}
                        label="Stop Precent"
                    />

                    <LabeledCheckbox
                        value={props.value.preProcess}
                        label="Preprocess"
                        onChange={(v) => props.onChange({ ...props.value, preProcess: v })}
                    />

                    {!this.propConfig || !props.value.preProcess ? null : (
                        <>
                            {Object.entries(this.propConfig).map(([name, prop]) => {
                                if (prop.type == "number") {
                                    return (
                                        <LabeledSlider
                                            value={props.value[name]}
                                            onChange={(v) =>
                                                props.onChange({
                                                    ...props.value,
                                                    [name]: v,
                                                })
                                            }
                                            min={prop.min}
                                            max={prop.max}
                                            step={prop.step}
                                            label={name}
                                            key={name}
                                        />
                                    )
                                } else if (prop.type == "boolean") {
                                    return (
                                        <LabeledCheckbox
                                            key={name}
                                            value={props.value[name] == prop._true ? true : false}
                                            label={name}
                                            onChange={(v) => {
                                                props.onChange({
                                                    ...props.value,
                                                    [name]: v ? prop._true : prop._false,
                                                })
                                            }}
                                        />
                                    )
                                }
                            })}
                        </>
                    )}
                </Stack>
            </Stack>
        )
    }
}
