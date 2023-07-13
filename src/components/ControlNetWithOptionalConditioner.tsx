import { Stack, Typography } from "@mui/material"
import { LabeledSlider } from "./LabeledSlider"

import { useEffect, useRef, useState } from "react"
import { ComfyResources, api } from "../Api/Api"
import {
    BuildWorkflow,
    ControlNetApply,
    ControlNetLoader,
    LoadImage,
    PreviewImage,
} from "../Api/Nodes"
import { ImageUploadZone } from "./ImageUploadZone"
import { LabeledCheckbox } from "./LabeledCheckbox"

export type ControlNetConditioner =
    | {
          type: "conditioner"
          id: number
          apply: (
              conditioning: { CONDITIONING0: any },
              resources: ComfyResources
          ) => { CONDITIONING0: any }
      }
    | {
          type: "config"
          id: number
          apply: (config: any, resources: ComfyResources) => void
      }

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

export const ControlNetWithOptionalPreprocessor = (props: {
    id: number
    title: string
    checkpoint: string
    propConfig?: { [key: string]: PropConfig }
    preprocessor: (input: any) => { IMAGE0: any }
    onChange: (conditioning: ControlNetConditioner) => void
}) => {
    const checkPoint = props.checkpoint
    const PreProcessor = props.preprocessor
    const [config, setConfig] = useState(props.propConfig || {})
    const [strength, setStrength] = useState(1)
    const [preProcess, setPreProcess] = useState(true)

    const runPreProcessor = (image: any) => {
        if (!preProcess) {
            return image
        }

        type Key = keyof typeof config

        const key_values = {} as { [key in Key]: any }

        for (const key in config) {
            const value = config[key as Key]
            key_values[key as Key] = value.value
        }

        return PreProcessor({
            image: image.IMAGE0,
            ...key_values,
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const refreshOverlay = useRef<() => void>(() => {})

    useEffect(() => {
        if (timerId) {
            clearTimeout(timerId)
        }
        timerId = setTimeout(() => {
            refreshOverlay.current()
        }, 250)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(config), preProcess])

    useEffect(() => {
        if (!preProcess) {
            refreshOverlay.current()
        }
    }, [preProcess])

    return (
        <Stack>
            <Typography>{props.title + " " + props.id}</Typography>
            <ImageUploadZone
                refreshOverlay={refreshOverlay}
                getOverlayImage={async (file) => {
                    const res = await api.executePrompt(
                        0,
                        BuildWorkflow(() => {
                            const image = LoadImage({
                                image: file.name,
                            })

                            const processor = runPreProcessor(image)

                            PreviewImage({
                                images: processor.IMAGE0,
                            })
                        })
                    )

                    return URL.createObjectURL(await api.view(res.output.images[0]))
                }}
                onChange={(file) => {
                    props.onChange({
                        type: "conditioner",
                        id: props.id,
                        apply: (conditioning) => {
                            const image = LoadImage({
                                image: file.name,
                            })

                            const model = ControlNetLoader({
                                control_net_name: checkPoint,
                            })

                            const processor = runPreProcessor(image)

                            return ControlNetApply({
                                control_net: model.CONTROL_NET0,
                                image: processor.IMAGE0,
                                strength: strength,
                                conditioning: conditioning.CONDITIONING0,
                            })
                        },
                    })
                }}
            />
            <Stack>
                <LabeledSlider
                    value={strength}
                    onChange={(v) => setStrength(v)}
                    min={0}
                    max={5}
                    step={0.01}
                    label="Strength"
                />

                <LabeledCheckbox value={preProcess} label="Preprocess" onChange={setPreProcess} />

                {!preProcess ? null : (
                    <>
                        {Object.entries(config).map(([key, value]) => {
                            if (value.type == "number") {
                                return (
                                    <LabeledSlider
                                        value={value.value}
                                        onChange={(v) =>
                                            setConfig({ ...config, [key]: { ...value, value: v } })
                                        }
                                        min={value.min}
                                        max={value.max}
                                        step={value.step}
                                        label={key}
                                        key={key}
                                    />
                                )
                            } else if (value.type == "boolean") {
                                return (
                                    <LabeledCheckbox
                                        key={key}
                                        value={value.value == value._true ? true : false}
                                        label={key}
                                        onChange={(v) =>
                                            setConfig({
                                                ...config,
                                                [key]: {
                                                    ...value,
                                                    value: v ? value._true : value._false,
                                                },
                                            })
                                        }
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
