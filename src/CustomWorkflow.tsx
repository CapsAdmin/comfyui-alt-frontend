import { Add, Delete } from "@mui/icons-material";
import { Box, Card, Fab, Input, Menu, Select, Stack, TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import { MouseEvent, useRef, useState } from "react";
import { api, useComfyAPI } from "./Api/Api";

import { ComfyFile, ComfyResources } from "./Api/Api";
import { ControlNetCannyEdge, ControlNetClipVision, ControlNetDepth, ControlNetLineArt, ImageToImage } from "./Conditioners";
import {
    BuildWorkflow,
    CLIPTextEncode,
    CheckpointLoaderSimple,
    EmptyLatentImage,
    HypernetworkLoader,
    ImageScale,
    KSampler,
    LoadImage,
    LoraLoader,
    PreviewImage,
    VAEDecode,
    VAEEncode
} from "./Api/Nodes";
import { ControlNetConditioner } from "./components/ControlNetWithOptionalConditioner";
import { Generate } from "./components/Generate";
import { LabeledSlider } from "./components/LabeledSlider";
import { PreprocessPrompts } from "./utils/prompts";

const ExecuteCustomWorkflow = (config: {
    checkpoint: string;

    positive: string;
    negative: string;

    samplingMethod: string;
    samplingScheduler: string;
    samplingSteps: number;

    width: number;
    height: number;

    batchSize: number;
    batchCount: number;

    cfgScale: number;
    seed: number;

    resources: ComfyResources;

    image?: ComfyFile;
    imageCrop?: boolean;
    imageDenoise?: number;

    conditioners: Array<ControlNetConditioner>;
}) => {
    return BuildWorkflow(() => {
        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "config") {
                    conditioner.apply(config, config.resources);
                }
            }
            console.log(config);
        }

        const { positive, negative, loras, hypernetworks } = PreprocessPrompts(config.positive, config.negative, config.resources);

        const checkpoint = CheckpointLoaderSimple({
            ckpt_name: config.checkpoint,
        });

        let model: { MODEL0: [string, number] } = checkpoint;

        for (const { path, weight } of hypernetworks) {
            model = HypernetworkLoader({
                hypernetwork_name: path,
                model: model.MODEL0,
                strength: weight,
            });
        }

        let clip: { CLIP1: [string, number] } = checkpoint;

        for (const { path, weight } of loras) {
            const loraModel = LoraLoader({
                lora_name: path,
                model: model.MODEL0,
                clip: clip.CLIP1,
                strength_clip: weight,
                strength_model: weight,
            });
            clip = loraModel;
            model = loraModel;
        }

        let positiveCondioning = CLIPTextEncode({
            text: positive,
            clip: clip.CLIP1,
        });

        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "conditioner") {
                    positiveCondioning = conditioner.apply(positiveCondioning, config.resources);
                }
            }
        }

        const negativeCondioning = CLIPTextEncode({
            text: negative,
            clip: clip.CLIP1,
        });

        let latent;
        if (config.image) {
            const image = LoadImage({
                image: config.image.name,
            });

            const resized = ImageScale({
                image: image.IMAGE0,
                width: config.width,
                height: config.height,
                upscale_method: "bicubic",
                crop: config.imageCrop ? "center" : "disabled",
            });

            latent = VAEEncode({
                pixels: resized.IMAGE0,
                vae: checkpoint.VAE2,
            });
        } else {
            latent = EmptyLatentImage({
                width: config.width,
                height: config.height,
                batch_size: config.batchSize,
            });
        }

        PreviewImage({
            images: VAEDecode({
                samples: KSampler({
                    steps: config.samplingSteps,
                    cfg: config.cfgScale,
                    sampler_name: config.samplingMethod,
                    scheduler: config.samplingScheduler as any,
                    denoise: config.imageDenoise || 1,
                    seed: config.seed,

                    model: model.MODEL0,
                    positive: positiveCondioning.CONDITIONING0,
                    negative: negativeCondioning.CONDITIONING0,
                    latent_image: latent.LATENT0,
                }).LATENT0,
                vae: checkpoint.VAE2,
            }).IMAGE0,
        });
    });
};


function AddConditioner(props: { onAdd: (conditioner: any) => void }) {
    const availableConditioners = [
        ControlNetCannyEdge,
        ControlNetDepth,
        ControlNetClipVision,
        ControlNetLineArt,
        ImageToImage,
    ];
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Fab size="small" color="secondary" onClick={handleClick}>
                <Add></Add>
            </Fab>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                }}
            >
                {availableConditioners.map((v) => (
                    <MenuItem
                        key={v.name}
                        onClick={() => {
                            props.onAdd(v);
                            handleClose();
                        }}
                    >
                        {v.name}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}

export function CustomWorkflowPage() {
    const imgRef = useRef<HTMLImageElement>(null);
    const resources = useComfyAPI();

    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(0);

    const [checkpoint, setCheckpoint] = useState("anime/Anything-V3.0-pruned-fp32.ckpt");
    const [positive, setPositive] = useState("");
    const [negative, setNegative] = useState("");

    const [samplingMethod, setSamplingMethod] = useState("euler");
    const [samplingScheduler, setSamplingScheduler] = useState("normal");
    const [samplingSteps, setSamplingSteps] = useState(20);

    const [width, setWidth] = useState(512);
    const [height, setHeight] = useState(512);

    const [cfgScale, setCfgScale] = useState(7.5);
    const [seed, setSeed] = useState(0);
    const [conditioners, setConditioners] = useState<Array<ControlNetConditioner>>([]);
    const [activeConditioners, setActiveConditioners] = useState<Array<any>>([]);

    const addConditioner = (conditioner: ControlNetConditioner) => {
        conditioners[conditioner.id] = conditioner;
        setConditioners([...conditioners]);
    };

    return (
        <Stack>
             <Select
                        style={{ flex: 1 }}
                        value={checkpoint}
                        onChange={(e) => setCheckpoint(e.target.value)}
                    >
                        {resources.checkpoints.map((v) => (
                            <MenuItem key={v} value={v}>
                                {v}
                            </MenuItem>
                        ))}
                    </Select>

            <Stack direction={"row"}>
                <Stack flex={1}>
                    <TextField
                        label="positive"
                        value={positive}
                        onChange={(e) => setPositive(e.target.value)}
                        multiline
                        minRows={3}
                    />
                    <TextField
                        label="negative"
                        value={negative}
                        onChange={(e) => setNegative(e.target.value)}
                        multiline
                        minRows={3}
                    />
                    <LabeledSlider
                        value={cfgScale}
                        onChange={(v) => setCfgScale(v)}
                        min={1}
                        max={30}
                        step={0.5}
                        label="CFG Scale"
                    />
                    <Stack direction="row">
                        {activeConditioners.map((obj, i) => (
                            <Card style={{ position: "relative" }}>
                                <Fab
                                    style={{ position: "absolute", right: 0, top: 0 }}
                                    size="small"
                                    onClick={() => {
                                        // delete
                                        setActiveConditioners([
                                            ...activeConditioners.filter((_, j) => j !== i),
                                        ]);

                                        setConditioners([
                                            ...conditioners.filter((_, j) => j !== i),
                                        ]);
                                    }}
                                >
                                    <Delete></Delete>
                                </Fab>

                                <obj.Render id={i} onChange={addConditioner} />
                            </Card>
                        ))}
                        <Box
                            flex={1}
                            alignContent={"center"}
                            style={{
                                width: 256,
                                height: 256,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <AddConditioner
                                onAdd={(v) => {
                                    setActiveConditioners([
                                        ...activeConditioners,
                                        {
                                            Render: v,
                                        },
                                    ]);
                                }}
                            ></AddConditioner>
                        </Box>
                    </Stack>
                </Stack>
                <Generate
                    progress={progress}
                    maxProgress={maxProgress}
                    onClick={async () => {
                        const res = await api.executePrompt(
                            0,
                            ExecuteCustomWorkflow({
                                checkpoint,
                                positive,
                                negative,
                                samplingMethod,
                                samplingScheduler,
                                samplingSteps,
                                width,
                                height,
                                batchSize: 1,
                                batchCount: 1,
                                cfgScale,
                                seed,
                                resources,
                                conditioners,
                            }),
                            (image) => {
                                if (!imgRef.current) return
                                imgRef.current.src = image;
                            },
                            (prog, max) => {
                                setProgress(prog);
                                setMaxProgress(max);
                            }
                        );

                        if (!imgRef.current) return

                        imgRef.current.src = URL.createObjectURL(
                            await api.view(res.output.images[0])
                        );
                    }}
                />
            </Stack>

            <Stack direction={"row"}>
                <Stack flex={1} direction={"column"}>
                    <Stack direction={"row"}>
                        <Stack flex={1} direction={"row"}>
                            <Select
                                style={{ flex: 1 }}
                                value={samplingMethod}
                                onChange={(e) => setSamplingMethod(e.target.value)}
                            >
                                {resources.samplingMethods.map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Select
                                style={{ flex: 1 }}
                                value={samplingScheduler}
                                onChange={(e) => setSamplingScheduler(e.target.value)}
                            >
                                {resources.samplingSchedulers.map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Stack>

                        <LabeledSlider
                            value={samplingSteps}
                            onChange={(v) => setSamplingSteps(v)}
                            min={0}
                            max={150}
                            step={1}
                            label="Sampling Steps"
                        ></LabeledSlider>
                    </Stack>

                    <Stack direction={"row"}>
                        <Stack flex={1} direction={"column"}>
                            <LabeledSlider
                                value={width}
                                onChange={(v) => setWidth(v)}
                                min={0}
                                max={2048}
                                step={64}
                                label="Width"
                            />

                            <LabeledSlider
                                value={height}
                                onChange={(v) => setHeight(v)}
                                min={0}
                                max={2048}
                                step={64}
                                label="Height"
                            />
                        </Stack>
                    </Stack>

                    <Stack direction={"column"}>
                        <Input
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value))}
                            type="number"
                            inputProps={{
                                min: -1,
                                max: 10000000000000,
                            }}
                        />
                    </Stack>
                </Stack>
                <img style={{ flex: 1 }} ref={imgRef}></img>
            </Stack>
        </Stack>
    );
}
