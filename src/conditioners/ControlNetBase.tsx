import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "../components/LabeledSlider"

import { useEffect, useState } from "react"
import { ComfyFile, ComfyResources, api } from "../Api/Api"
import {
    BuildWorkflow,
    ControlNetApply,
    ControlNetLoader,
    LoadImage,
    PreviewImage,
} from "../Api/Nodes"
import { ImageUploadZone } from "../components/ImageUploadZone"
import { LabeledCheckbox } from "../components/LabeledCheckbox"
import { BaseConditioner } from "./Base"

let timerId: number

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

export abstract class ControlNetPreprocessorBase extends BaseConditioner {
    title = "controlnet-preprocessor"
    type = "conditioner" as const

    abstract propConfig?: { [key: string]: PropConfig }
    abstract PreProcessor: (input: any) => { IMAGE0: any }
    abstract checkPoint: string

    _config = {
        strength: 1,
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

    runPreprocessor(image: any) {
        if (!this.config.preProcess) {
            return image
        }

        if (!this.propConfig) {
            return this.PreProcessor({
                image: image.IMAGE0,
            })
        }

        const keyValues: { [key: string]: any } = {}

        for (const key in this.propConfig) {
            keyValues[key] = this.config[key as keyof typeof this.config]
        }

        return this.PreProcessor({
            image: image.IMAGE0,
            ...keyValues,
        })
    }

    apply(conditioning: { CONDITIONING0: any }, resources: ComfyResources) {
        const image = LoadImage({
            image: this.config.image?.name,
        })

        const model = ControlNetLoader({
            control_net_name: this.checkPoint,
        })

        const processor = this.runPreprocessor(image)

        return ControlNetApply({
            control_net: model.CONTROL_NET0,
            image: processor.IMAGE0,
            strength: this.config.strength,
            conditioning: conditioning.CONDITIONING0,
        })
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
                            })

                            const processor = this.runPreprocessor(image)

                            PreviewImage({
                                images: processor.IMAGE0,
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