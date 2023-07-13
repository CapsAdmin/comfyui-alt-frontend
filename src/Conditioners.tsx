import { Stack, Typography } from "@mui/material";
import { LabeledSlider } from "./components/LabeledSlider";

import { useEffect, useState } from "react";
import { ComfyFile } from "./Api/Api";
import {
    CLIPVisionEncode,
    CLIPVisionLoader,
    CannyEdgePreprocessor,
    ConditioningAverage_,
    LineArtPreprocessor,
    LoadImage,
    StyleModelApply,
    StyleModelLoader,
    Zoe_DepthMapPreprocessor
} from "./Api/Nodes";
import { ControlNetConditioner, ControlNetWithOptionalPreprocessor } from "./components/ControlNetWithOptionalConditioner";
import { ImageUploadZone } from "./components/ImageUploadZone";
import { LabeledCheckbox } from "./components/LabeledCheckbox";


export const ControlNetCannyEdge = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => (
    <ControlNetWithOptionalPreprocessor
        title="Canny Edge"
        id={props.id}
        preprocessor={CannyEdgePreprocessor}
        checkpoint="t2iadapter_canny_sd15v2.pth"
        propConfig={{
            low_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 100 },
            high_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 200 },
            l2gradient: {
                type: "boolean" as const,
                _true: "enable",
                _false: "disable",
                value: "disable" as "enable" | "disable",
            },
        }}
        onChange={props.onChange}
    />
);

export const ControlNetLineArt = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => (
    <ControlNetWithOptionalPreprocessor
        title="Line Art"
        id={props.id}
        preprocessor={LineArtPreprocessor}
        checkpoint="control_v11p_sd15_lineart.pth"
        propConfig={{
            coarse: {
                type: "boolean" as const,
                _true: "enable",
                _false: "disable",
                value: "disable" as "enable" | "disable",
            },
        }}
        onChange={props.onChange}
    />
);
export const ControlNetDepth = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => (
    <ControlNetWithOptionalPreprocessor
        title="Depth"
        id={props.id}
        preprocessor={Zoe_DepthMapPreprocessor}
        checkpoint="t2iadapter_depth_sd15v2.pth"
        onChange={props.onChange}
    />
);

export const ControlNetClipVision = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => {
    const [strength, setStrength] = useState(1);

    return (
        <Stack>
            <Typography>Clip Vision</Typography>
            <ImageUploadZone
                onChange={(file) => {
                    props.onChange({
                        type: "conditioner",
                        id: props.id,
                        apply: (conditioning) => {
                            const image = LoadImage({
                                image: file.name,
                            });

                            const clipVisionModel = CLIPVisionLoader({
                                clip_name: "clip-vit-large-patch14.bin",
                            });

                            const styleModel = StyleModelLoader({
                                style_model_name: "t2iadapter_style_sd14v1.pth",
                            });

                            const clipVisionEncoder = CLIPVisionEncode({
                                image: image.IMAGE0,
                                clip_vision: clipVisionModel.CLIP_VISION0,
                            });

                            const applier = StyleModelApply({
                                style_model: styleModel.STYLE_MODEL0,
                                clip_vision_output: clipVisionEncoder.CLIP_VISION_OUTPUT0,
                                conditioning: conditioning.CONDITIONING0,
                            });

                            const averager = ConditioningAverage_({
                                conditioning_to: applier.CONDITIONING0,
                                conditioning_from: conditioning.CONDITIONING0,
                                conditioning_to_strength: strength,
                            });

                            return averager;
                        },
                    });
                }}
            />
            <Stack>
                <LabeledSlider
                    value={strength}
                    onChange={(v) => setStrength(v)}
                    min={0}
                    max={1}
                    step={0.01}
                    label="Strength"
                />
            </Stack>
        </Stack>
    );
};

export const ImageToImage = (props: { id: number; onChange: (config: any) => void }) => {
    const [image, setImage] = useState<ComfyFile | undefined>(undefined);
    const [imageCrop, setImageCrop] = useState(false);
    const [imageDenoise, setImageDenoise] = useState(0.75);

    useEffect(() => {
        if (image) {
            props.onChange({
                type: "config",
                id: props.id,
                apply: (config) => {
                    config.image = image;
                    config.imageCrop = imageCrop;
                    config.imageDenoise = imageDenoise;
                },
            });
        }
    }, [image, imageCrop, imageDenoise]);

    return (
        <Stack>
            <Typography>img2img</Typography>
            <ImageUploadZone
                onChange={(file) => {
                    setImage(file);
                }}
            />
            <Stack>
                <LabeledSlider
                    value={imageDenoise}
                    onChange={setImageDenoise}
                    min={0}
                    max={1}
                    step={0.001}
                    label="denoise"
                />
                <LabeledCheckbox value={imageCrop} onChange={setImageCrop} label="Crop Image" />
            </Stack>
        </Stack>
    );
};
