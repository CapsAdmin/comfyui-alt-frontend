import { Add, Delete } from "@mui/icons-material"
import {
    Box,
    Button,
    Card,
    Fab,
    IconButton,
    LinearProgress,
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
import { LabeledSlider } from "./components/LabeledSlider"
import {
    ClipVision,
    ControlNetCannyEdge,
    ControlNetDepth,
    ControlNetLineArt,
    ImageToImage,
} from "./conditioners/Conditioners"
import { PreprocessPrompts } from "./utils/prompts"

const availableConditioners = [
    ClipVision,
    ImageToImage,
    ControlNetDepth,
    ControlNetLineArt,
    ControlNetCannyEdge,
] as const

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

    conditioners: Array<InstanceType<(typeof availableConditioners)[number]>>
}) => {
    return BuildWorkflow(() => {
        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "config") {
                    conditioner.apply(config, config.resources)
                }
            }
        }

        const { positive, negative, loras, hypernetworks } = PreprocessPrompts(
            config.positive,
            config.negative,
            config.resources
        )

        const checkpoint = CheckpointLoaderSimple({
            ckpt_name: config.checkpoint,
        })

        let model = checkpoint.MODEL0
        const vae = checkpoint.VAE2

        for (const { path, weight } of hypernetworks) {
            model = HypernetworkLoader({
                hypernetwork_name: path,
                model: model,
                strength: weight,
            }).MODEL0
        }

        let clip = checkpoint.CLIP1

        for (const { path, weight } of loras) {
            const loraModel = LoraLoader({
                lora_name: path,
                model: model,
                clip: clip,
                strength_clip: weight,
                strength_model: weight,
            })
            clip = loraModel.CLIP1
            model = loraModel.MODEL0
        }

        let positiveCondioning = CLIPTextEncode({
            text: positive,
            clip: clip,
        }).CONDITIONING0

        let negativeCondioning = CLIPTextEncode({
            text: negative,
            clip: clip,
        }).CONDITIONING0

        if (config.conditioners) {
            for (const conditioner of config.conditioners) {
                if (conditioner.type == "conditioner") {
                    const res = conditioner.apply(
                        {
                            positive: positiveCondioning,
                            negative: negativeCondioning,
                        },
                        config.resources
                    )

                    positiveCondioning = res.positive
                    negativeCondioning = res.negative
                }
            }
        }

        let latent
        if (config.image) {
            const image = LoadImage({
                image: config.image.name,
            }).IMAGE0

            const resized = ImageScale({
                image: image,
                width: config.width,
                height: config.height,
                upscale_method: "bicubic",
                crop: config.imageCrop ? "center" : "disabled",
            }).IMAGE0

            latent = VAEEncode({
                pixels: resized,
                vae: vae,
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

                    model: model,
                    positive: positiveCondioning,
                    negative: negativeCondioning,
                    latent_image: latent.LATENT0,
                }).LATENT0,
                vae: vae,
            }).IMAGE0,
        })
    })
}

export type Config = Parameters<typeof ExecuteCustomWorkflow>[0]

let CONDITIONER_ID = 0

function AddConditioner(props: {
    onAdd: (conditioner: InstanceType<(typeof availableConditioners)[number]>) => void
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
            <Fab size="small" color="primary" onClick={handleClick}>
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
                {availableConditioners.map((v, i) => {
                    const obj = new v(i)
                    return (
                        <MenuItem
                            key={v.name}
                            onClick={() => {
                                props.onAdd(obj)
                                handleClose()
                            }}
                        >
                            {obj.title}
                        </MenuItem>
                    )
                })}
            </Menu>
        </>
    )
}

const Conditioners = (props: { config: Config; setConfig: (config: Config) => void }) => {
    const config = props.config
    const setConfig = props.setConfig
    const [selectedConditioner, setSelectedConditioner] = useState<Config["conditioners"][number]>()

    return (
        <Stack direction="row" spacing={1}>
            <List>
                {config.conditioners.map((obj, i) => (
                    <ListItem
                        selected={selectedConditioner?.id === obj.id}
                        button
                        key={i}
                        onClick={() => setSelectedConditioner(obj)}
                    >
                        <Typography>{obj.title}</Typography>
                    </ListItem>
                ))}

                <ListItem>
                    <Box justifyContent={"center"} display={"flex"} flex={1}>
                        <AddConditioner
                            onAdd={(obj) => {
                                obj.id = CONDITIONER_ID++
                                config.conditioners.push(obj)
                                setConfig({ ...config })
                            }}
                        ></AddConditioner>
                    </Box>
                </ListItem>
            </List>
            {selectedConditioner && (
                <Card style={{ position: "relative" }}>
                    <IconButton
                        style={{
                            position: "absolute",
                            right: -10,
                            top: -5,
                            zIndex: 1,
                        }}
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
                    </IconButton>

                    <selectedConditioner.render
                        value={selectedConditioner.config as any}
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
    )
}

const Prompts = (props: { config: Config; setConfig: (config: Config) => void }) => {
    const config = props.config
    const setConfig = props.setConfig

    return (
        <Stack flex={1} spacing={1}>
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
        </Stack>
    )
}

const Sampler = (props: {
    config: Config
    setConfig: (config: Config) => void
    resources: ComfyResources
}) => {
    const config = props.config
    const setConfig = props.setConfig
    const resources = props.resources

    return (
        <Stack direction={"column"}>
            <Typography>Sampler</Typography>
            <Stack direction={"row"}>
                <Select
                    style={{ flex: 1 }}
                    value={config.samplingMethod}
                    onChange={(e) => setConfig({ ...config, samplingMethod: e.target.value })}
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
                    onChange={(e) => setConfig({ ...config, samplingScheduler: e.target.value })}
                >
                    {resources.samplingSchedulers.map((v) => (
                        <MenuItem key={v} value={v}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>
        </Stack>
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

    return (
        <Stack spacing={1} margin={4}>
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
                <Card style={{ flex: 1 }}>
                    <Box margin={2}>
                        <Prompts config={config} setConfig={setConfig}></Prompts>
                    </Box>
                </Card>
            </Stack>

            <Stack direction={"row"} spacing={1}>
                <Stack flex={1} direction={"column"} spacing={1}>
                    <Stack direction={"column"} spacing={1}>
                        <Card>
                            <Box margin={2}>
                                <Stack direction={"column"} spacing={1}>
                                    <Sampler
                                        config={config}
                                        setConfig={setConfig}
                                        resources={resources}
                                    />

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
                                </Stack>
                            </Box>
                        </Card>

                        <Card>
                            <Box margin={2}>
                                <Stack direction={"column"} spacing={1}>
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
                            </Box>
                        </Card>
                        <Card>
                            <Box margin={2}>
                                <Conditioners config={config} setConfig={setConfig}></Conditioners>
                            </Box>
                        </Card>
                    </Stack>
                </Stack>
                <Stack spacing={0.2}>
                    <Button
                        fullWidth
                        variant="contained"
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
                    >
                        generate
                    </Button>

                    <Box display={"flex"}>
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
                    <LinearProgress
                        color="secondary"
                        variant="determinate"
                        value={(progress / maxProgress) * 100}
                    />
                </Stack>
            </Stack>
        </Stack>
    )
}
