import { Add, Delete } from "@mui/icons-material"
import {
    Box,
    Card,
    Fab,
    List,
    ListItem,
    Menu,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import MenuItem from "@mui/material/MenuItem"
import { MouseEvent, useRef, useState } from "react"
import { api, useComfyAPI } from "./Api/Api"

import { ComfyFile, ComfyResources } from "./Api/Api"
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
    VAEEncode,
} from "./Api/Nodes"
import { ClipVision, ImageToImage } from "./Conditioners"
import { Generate } from "./components/Generate"
import { LabeledSlider } from "./components/LabeledSlider"
import { PreprocessPrompts } from "./utils/prompts"

const ExecuteCustomWorkflow = (config: {
    checkpoint: string

    positive: string
    negative: string

    samplingMethod: string
    samplingScheduler: string
    samplingSteps: number

    width: number
    height: number

    batchSize: number
    batchCount: number

    cfgScale: number
    seed: number

    resources: ComfyResources

    image?: ComfyFile
    imageCrop?: boolean
    imageDenoise?: number

    conditioners: Array<ClipVision>
}) => {
    return BuildWorkflow(() => {
        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "config") {
                    conditioner.apply(config, config.resources)
                }
            }
            console.log(config)
        }

        const { positive, negative, loras, hypernetworks } = PreprocessPrompts(
            config.positive,
            config.negative,
            config.resources
        )

        const checkpoint = CheckpointLoaderSimple({
            ckpt_name: config.checkpoint,
        })

        let model: { MODEL0: [string, number] } = checkpoint

        for (const { path, weight } of hypernetworks) {
            model = HypernetworkLoader({
                hypernetwork_name: path,
                model: model.MODEL0,
                strength: weight,
            })
        }

        let clip: { CLIP1: [string, number] } = checkpoint

        for (const { path, weight } of loras) {
            const loraModel = LoraLoader({
                lora_name: path,
                model: model.MODEL0,
                clip: clip.CLIP1,
                strength_clip: weight,
                strength_model: weight,
            })
            clip = loraModel
            model = loraModel
        }

        let positiveCondioning = CLIPTextEncode({
            text: positive,
            clip: clip.CLIP1,
        })

        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "conditioner") {
                    positiveCondioning = conditioner.apply(positiveCondioning, config.resources)
                }
            }
        }

        const negativeCondioning = CLIPTextEncode({
            text: negative,
            clip: clip.CLIP1,
        })

        let latent
        if (config.image) {
            const image = LoadImage({
                image: config.image.name,
            })

            const resized = ImageScale({
                image: image.IMAGE0,
                width: config.width,
                height: config.height,
                upscale_method: "bicubic",
                crop: config.imageCrop ? "center" : "disabled",
            })

            latent = VAEEncode({
                pixels: resized.IMAGE0,
                vae: checkpoint.VAE2,
            })
        } else {
            latent = EmptyLatentImage({
                width: config.width,
                height: config.height,
                batch_size: config.batchSize,
            })
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
        })
    })
}

export type Config = Parameters<typeof ExecuteCustomWorkflow>[0]

const availableConditioners = [ClipVision, ImageToImage] as const

function AddConditioner(props: {
    onAdd: (conditioner: (typeof availableConditioners)[number], id: number) => void
}) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const open = Boolean(anchorEl)
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => {
        setAnchorEl(null)
    }

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
                {availableConditioners.map((v, i) => (
                    <MenuItem
                        key={v.name}
                        onClick={() => {
                            props.onAdd(v, i)
                            handleClose()
                        }}
                    >
                        {v.name}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}

export function CustomWorkflowPage() {
    const imageOutputRef = useRef<HTMLImageElement>(null)
    const resources = useComfyAPI()

    const [progress, setProgress] = useState(0)
    const [maxProgress, setMaxProgress] = useState(0)

    const [config, setConfig] = useState<Config>({
        checkpoint: "anime/Anything-V3.0-pruned-fp32.ckpt",
        positive: "",
        negative: "",
        samplingMethod: "euler",
        samplingScheduler: "normal",
        samplingSteps: 20,
        width: 512,
        height: 512,
        cfgScale: 7.5,
        seed: 0,
        conditioners: [],
        batchSize: 1,
        batchCount: 1,
        resources,
    })

    const [selectedConditioner, setSelectedConditioner] = useState<Config["conditioners"][number]>()

    return (
        <Stack>
            <Select
                style={{ flex: 1 }}
                value={config.checkpoint}
                onChange={(e) => setConfig({ ...config, checkpoint: e.target.value })}
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
                        value={config.positive}
                        onChange={(e) => setConfig({ ...config, positive: e.target.value })}
                        multiline
                        minRows={3}
                    />
                    <TextField
                        label="negative"
                        value={config.negative}
                        onChange={(e) => setConfig({ ...config, negative: e.target.value })}
                        multiline
                        minRows={3}
                    />
                    <LabeledSlider
                        value={config.cfgScale}
                        onChange={(v) => setConfig({ ...config, cfgScale: v })}
                        min={1}
                        max={30}
                        step={0.5}
                        label="CFG Scale"
                    />
                    <Stack direction="row">
                        <List>
                            {config.conditioners.map((obj, i) => (
                                <ListItem
                                    selected={selectedConditioner?.id === obj.id}
                                    button
                                    key={i}
                                    onClick={() => setSelectedConditioner(obj)}
                                >
                                    <Typography>{obj.name}</Typography>
                                </ListItem>
                            ))}

                            <AddConditioner
                                onAdd={(obj) => {
                                    config.conditioners.push(new obj(config.conditioners.length))
                                    setConfig({ ...config })
                                }}
                            ></AddConditioner>
                        </List>
                        {selectedConditioner && (
                            <Card style={{ position: "relative" }}>
                                <Fab
                                    style={{ position: "absolute", right: 0, top: 0 }}
                                    size="small"
                                    onClick={() => {
                                        config.conditioners = config.conditioners.filter(
                                            (c) => c.id !== selectedConditioner.id
                                        )
                                        setConfig({ ...config })
                                        setSelectedConditioner(config.conditioners[0])
                                    }}
                                >
                                    <Delete></Delete>
                                </Fab>

                                <selectedConditioner.render
                                    value={selectedConditioner.config}
                                    onChange={(v) => {
                                        const found = config.conditioners.find(
                                            (c) => c.id === selectedConditioner.id
                                        )
                                        if (found) {
                                            found.config = v
                                        }
                                        setConfig({ ...config })
                                    }}
                                />
                            </Card>
                        )}
                    </Stack>
                </Stack>
            </Stack>
            <Stack direction={"row"}>
                <Stack flex={1} direction={"column"}>
                    <Stack direction={"column"}>
                        <Stack direction={"column"}>
                            <Typography>Sampler</Typography>
                            <Stack direction={"row"}>
                                <Select
                                    style={{ flex: 1 }}
                                    value={config.samplingMethod}
                                    onChange={(e) =>
                                        setConfig({ ...config, samplingMethod: e.target.value })
                                    }
                                >
                                    {resources.samplingMethods.map((v) => (
                                        <MenuItem key={v} value={v}>
                                            {v}
                                        </MenuItem>
                                    ))}
                                </Select>

                                <Select
                                    style={{ flex: 1 }}
                                    value={config.samplingScheduler}
                                    onChange={(e) =>
                                        setConfig({ ...config, samplingScheduler: e.target.value })
                                    }
                                >
                                    {resources.samplingSchedulers.map((v) => (
                                        <MenuItem key={v} value={v}>
                                            {v}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Stack>
                        </Stack>

                        <LabeledSlider
                            value={config.samplingSteps}
                            onChange={(v) => setConfig({ ...config, samplingSteps: v })}
                            min={0}
                            max={150}
                            step={1}
                            label="Sampling Steps"
                        ></LabeledSlider>

                        <LabeledSlider
                            value={config.seed}
                            onChange={(v) => setConfig({ ...config, seed: v })}
                            min={-1}
                            max={10000000000000}
                            step={1}
                            label="Noise Seed"
                        />

                        <LabeledSlider
                            value={config.width}
                            onChange={(v) => setConfig({ ...config, width: v })}
                            min={0}
                            max={2048}
                            step={64}
                            label="Width"
                        />
                        <LabeledSlider
                            value={config.height}
                            onChange={(v) => setConfig({ ...config, height: v })}
                            min={0}
                            max={2048}
                            step={64}
                            label="Height"
                        />
                    </Stack>
                </Stack>
                <Stack>
                    <Box flex={1} display={"flex"}>
                        <img
                            width={512}
                            height={512}
                            ref={imageOutputRef}
                            style={{
                                flex: 1,
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        />
                    </Box>
                    <Generate
                        progress={progress}
                        maxProgress={maxProgress}
                        onClick={async () => {
                            const res = await api.executePrompt(
                                0,
                                ExecuteCustomWorkflow(config),
                                (image) => {
                                    if (!imageOutputRef.current) return
                                    imageOutputRef.current.src = image
                                },
                                (prog, max) => {
                                    setProgress(prog)
                                    setMaxProgress(max)
                                }
                            )

                            if (!imageOutputRef.current) return

                            imageOutputRef.current.src = URL.createObjectURL(
                                await api.view(res.output.images[0])
                            )
                        }}
                    />
                </Stack>
            </Stack>
        </Stack>
    )
}
