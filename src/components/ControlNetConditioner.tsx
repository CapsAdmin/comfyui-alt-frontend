import { Box, Button, Checkbox, Select, Stack, Typography } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import LabeledSlider from "../components/GradioSlider";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "../api";
import {
    BuildWorkflow,
    CannyEdgePreprocessor,
    ControlNetApply,
    ControlNetLoader,
    LoadImage,
    PreviewImage,
    Zoe_DepthMapPreprocessor,
} from "../nodes";

export type ComfyFile = { name: string; subfolder: string; type: string };
export type ControlNetConditioner = {
    id: number;
    apply: (conditioning: { CONDITIONING0: any }) => { CONDITIONING0: any };
};

export const ImageUploadZone = (props: {
    onChange: (image: ComfyFile) => void;
    getOverlayImage?: (image: ComfyFile) => Promise<string>;
    refreshOverlay?: RefObject<() => void>;
}) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const overlayImageRef = useRef<HTMLImageElement>(null);
    const [imageFile, setImageFile] = useState<ComfyFile | undefined>(undefined);

    if (props.refreshOverlay) {
        props.refreshOverlay.current = async () => {
            if (props.getOverlayImage && imageFile) {
                overlayImageRef.current.src = await props.getOverlayImage(imageFile);
                overlayImageRef.current.style.opacity = "1";
            }
        };
    }

    const onDrop = useCallback(async (files: Array<File>) => {
        const uploadedResult = await api.uploadFile(files[0]);
        setImageFile(uploadedResult);
        const reader = new FileReader();
        reader.onload = function (e) {
            if (imageRef.current) {
                imageRef.current.src = e.target?.result as string;
            }
        };
        reader.readAsDataURL(files[0]);

        if (props.getOverlayImage) {
            if (props.getOverlayImage) {
                overlayImageRef.current.src = await props.getOverlayImage(uploadedResult);
                overlayImageRef.current.style.opacity = "1";
            }
        }
    }, []);

    const onChange = props.onChange;

    useEffect(() => {
        if (imageFile === undefined) {
            return;
        }
        onChange(imageFile);
    }, [onChange, imageFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <Box>
            <div
                style={{ width: 512, height: 512, position: "relative", backgroundColor: "gray" }}
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <Typography>Drop the files here ...</Typography>
                ) : (
                    <Typography>Drag 'n' drop some files here, or click to select files</Typography>
                )}
                <img
                    style={{
                        position: "absolute",
                        width: 512,
                        height: 512,
                        top: 0,
                        left: 0,
                        objectFit: "contain",
                    }}
                    ref={imageRef}
                ></img>
                <img
                    onMouseOver={() => {
                        if (overlayImageRef && overlayImageRef.current) {
                            overlayImageRef.current.style.opacity = "0";
                        }
                    }}
                    onMouseOut={() => {
                        if (overlayImageRef && overlayImageRef.current) {
                            overlayImageRef.current.style.opacity = "1";
                        }
                    }}
                    style={{
                        position: "absolute",
                        width: 512,
                        height: 512,
                        top: 0,
                        left: 0,
                        opacity: 1,
                        objectFit: "contain",
                    }}
                    ref={overlayImageRef}
                ></img>
            </div>
        </Box>
    );
};

let timerId: number;

export const ControlNetDepth = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => {
    const [strength, setStrength] = useState(1);

    return (
        <Stack>
            <Typography>Depth</Typography>
            <ImageUploadZone
                getOverlayImage={async (file) => {
                    const res = await api.executePrompt(
                        0,
                        BuildWorkflow(() => {
                            PreviewImage({
                                images: Zoe_DepthMapPreprocessor({
                                    image: LoadImage({
                                        image: file.name,
                                    }).IMAGE0,
                                }).IMAGE0,
                            });
                        })
                    );

                    return URL.createObjectURL(await api.view(res.output.images[0]));
                }}
                onChange={(file) => {
                    props.onChange({
                        id: props.id,
                        apply: (conditioning) => {
                            return ControlNetApply({
                                control_net: ControlNetLoader({
                                    control_net_name: "t2iadapter_zoedepth_sd15v1.pth",
                                }).CONTROL_NET0,
                                image: Zoe_DepthMapPreprocessor({
                                    image: LoadImage({
                                        image: file.name,
                                    }).IMAGE0,
                                }).IMAGE0,
                                strength: strength,
                                conditioning: conditioning.CONDITIONING0,
                            });
                        },
                    });
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

        </Stack>
        </Stack>
    );
};

export const ControlNetCannyEdge = (props: {
    id: number;
    onChange: (conditioning: ControlNetConditioner) => void;
}) => {
    const [strength, setStrength] = useState(1);
    const [lowThreshold, setLowThreshold] = useState(100);
    const [highThreshold, setHighThreshold] = useState(200);
    const [l2gradient, setL2gradient] = useState(false);
    const refreshOverlay = useRef<() => void>(() => {});

    useEffect(() => {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            refreshOverlay.current();
        }, 250);
    }, [lowThreshold, highThreshold, l2gradient]);

    return (
        <Stack>
            <Typography>Canny Edge</Typography>
            <ImageUploadZone
                refreshOverlay={refreshOverlay}
                getOverlayImage={async (file) => {
                    const res = await api.executePrompt(
                        0,
                        BuildWorkflow(() => {
                            PreviewImage({
                                images: CannyEdgePreprocessor({
                                    image: LoadImage({
                                        image: file.name,
                                    }).IMAGE0,
                                    high_threshold: highThreshold,
                                    low_threshold: lowThreshold,
                                    l2gradient: l2gradient ? "enable" : "disable",
                                }).IMAGE0,
                            });
                        })
                    );

                    return URL.createObjectURL(await api.view(res.output.images[0]));
                }}
                onChange={(file) => {
                    props.onChange({
                        id: props.id,
                        apply: (conditioning) => {
                            return ControlNetApply({
                                control_net: ControlNetLoader({
                                    control_net_name: "t2iadapter_canny_sd15v2.pth",
                                }).CONTROL_NET0,
                                image: CannyEdgePreprocessor({
                                    image: LoadImage({
                                        image: file.name,
                                    }).IMAGE0,
                                    high_threshold: highThreshold,
                                    low_threshold: lowThreshold,
                                    l2gradient: l2gradient ? "enable" : "disable",
                                }).IMAGE0,
                                strength: strength,
                                conditioning: conditioning.CONDITIONING0,
                            });
                        },
                    });
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

                <LabeledSlider
                    value={lowThreshold}
                    onChange={(v) => setLowThreshold(v)}
                    min={0}
                    max={255}
                    step={1}
                    label="Low Threshold"
                />
                <LabeledSlider
                    value={highThreshold}
                    onChange={(v) => setHighThreshold(v)}
                    min={0}
                    max={255}
                    step={1}
                    label="High Threshold"
                />
                <Checkbox
                    checked={l2gradient}
                    onChange={(e) => setL2gradient(e.target.checked)}
                ></Checkbox>
            </Stack>
        </Stack>
    );
};
