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
import { MouseEvent, useEffect, useRef, useState } from "react"
import { ComfyFile, ComfyResources, api, useComfyAPI } from "./Api/Api"
import {
    BuildWorkflow,
    CLIPSetLastLayer,
    CLIPTextEncode,
    CheckpointLoaderSimple,
    ConditioningConcat,
    EmptyLatentImage,
    HypernetworkLoader,
    ImageScale,
    KRestartSampler,
    KSampler,
    LoadImage,
    LoraLoader,
    PreviewImage,
    ReferenceOnlySimple,
    RescaleClassifierFreeGuidanceTest,
    TomePatchModel,
    VAEDecode,
    VAEEncode,
    VAELoader,
} from "./Api/Nodes"
import { LabeledSlider } from "./components/LabeledSlider"
import { comfyToGraphvizSVG } from "./utils/ComfyToGraphviz"
import { PreprocessPrompts } from "./utils/prompts"
import { DeserializeModifier, SerializeModifier } from "./workflow_modifiers/Base"
import {
    ClipVision,
    ControlNetCannyEdge,
    ControlNetDepth,
    ControlNetLineArt,
    ImageToImage,
    SeeCoder,
} from "./workflow_modifiers/WorkflowModifiers"

const availableConditioners = [
    ClipVision,
    SeeCoder,
    ImageToImage,
    ControlNetDepth,
    ControlNetLineArt,
    ControlNetCannyEdge,
] as const

console.log(ClipVision.type)

const ExecuteCustomWorkflow = (config: {
    checkpoint: string
    vae: string

    positive: string
    negative: string
    clipSkip: number

    samplingMethod: string
    samplingScheduler: string
    restartSamplingMethods: string
    restartSamplerSegments: string
    restartSamplingScheduler: string
    samplingSteps: number
    tomeRatio: number

    width: number
    height: number

    batchSize: number
    batchCount: number

    cfgScale: number
    cfgRescale: number
    seed: number

    resources: ComfyResources

    image?: ComfyFile
    imageCrop?: boolean
    imageDenoise?: number
    imageReferenceOnly?: boolean

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
        let vae = checkpoint.VAE2
        let clip = checkpoint.CLIP1

        if (config.vae != "from_checkpoint") {
            vae = VAELoader({
                vae_name: config.vae,
            }).VAE0
        }

        for (const { path, weight } of hypernetworks) {
            model = HypernetworkLoader({
                hypernetwork_name: path,
                model: model,
                strength: weight,
            }).MODEL0
        }

        if (config.clipSkip != -1) {
            clip = CLIPSetLastLayer({
                clip: clip,
                stop_at_clip_layer: -config.clipSkip,
            }).CLIP0
        }

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

        if (config.tomeRatio != 0) {
            model = TomePatchModel({
                model: model,
                ratio: config.tomeRatio,
            }).MODEL0
        }

        const handleBreaks = (prompt: string) => {
            if (!positive.includes(";")) {
                return CLIPTextEncode({
                    text: prompt,
                    clip: clip,
                }).CONDITIONING0
            }
            const prompts = prompt.split(";")
            const conditionings = []

            for (const prompt of prompts) {
                conditionings.push(
                    CLIPTextEncode({
                        text: prompt,
                        clip: clip,
                    }).CONDITIONING0
                )
            }

            while (conditionings.length > 1) {
                const combined = ConditioningConcat({
                    conditioning_from: conditionings[0],
                    conditioning_to: conditionings[1],
                }).CONDITIONING0
                conditionings.splice(0, 2) // remove the first two nodes
                conditionings.push(combined) // append the combined node to the end
            }

            return conditionings[0]
        }

        let positiveCondioning = handleBreaks(positive)
        let negativeCondioning = handleBreaks(negative)

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
            }).LATENT0

            if (config.imageReferenceOnly) {
                const res = ReferenceOnlySimple({
                    model: model,
                    reference: latent,
                    batch_size: 1,
                })

                model = res.MODEL0
                latent = res.LATENT1
            }
        } else {
            latent = EmptyLatentImage({
                width: config.width,
                height: config.height,
                batch_size: config.batchSize,
            }).LATENT0
        }

        if (config.cfgRescale) {
            model = RescaleClassifierFreeGuidanceTest({
                model: model,
                multiplier: config.cfgRescale,
            }).MODEL0
        }

        let resultLatent

        if (config.restartSamplerSegments) {
            resultLatent = KRestartSampler({
                steps: config.samplingSteps,
                cfg: config.cfgScale,
                sampler_name: config.restartSamplingMethods,
                scheduler: config.samplingScheduler as any,
                denoise: config.imageDenoise || 1,
                seed: config.seed,

                model: model,
                positive: positiveCondioning,
                negative: negativeCondioning,
                latent_image: latent,

                segments: config.restartSamplerSegments,
                restart_scheduler: config.restartSamplingScheduler as any,
            }).LATENT0
        } else {
            resultLatent = KSampler({
                steps: config.samplingSteps,
                cfg: config.cfgScale,
                sampler_name: config.samplingMethod,
                scheduler: config.samplingScheduler as any,
                denoise: config.imageDenoise || 1,
                seed: config.seed,

                model: model,
                positive: positiveCondioning,
                negative: negativeCondioning,
                latent_image: latent,
            }).LATENT0
        }

        PreviewImage({
            images: VAEDecode({
                samples: resultLatent,
                vae: vae,
            }).IMAGE0,
        })
    })
}

export type Config = Parameters<typeof ExecuteCustomWorkflow>[0]

const CONDITIONER_ID = 0

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
                        selected={selectedConditioner === obj}
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
                                (c) => c !== selectedConditioner
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
                            const found = config.conditioners.find((c) => c === selectedConditioner)
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
            <LabeledSlider
                value={config.cfgRescale}
                onChange={(v) => setConfig({ ...config, cfgRescale: v })}
                min={0}
                max={1}
                step={0.01}
                label="CFG Rescale"
            />
            <LabeledSlider
                value={config.clipSkip}
                onChange={(v) => setConfig({ ...config, clipSkip: v })}
                min={1}
                max={24}
                step={1}
                label="Clip skip"
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

                <Select
                    style={{ flex: 1 }}
                    value={config.restartSamplingMethods}
                    onChange={(e) =>
                        setConfig({ ...config, restartSamplingMethods: e.target.value })
                    }
                >
                    {resources.restartSamplingMethods.map((v) => (
                        <MenuItem key={v} value={v}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>

                <Select
                    style={{ flex: 1 }}
                    value={config.restartSamplingScheduler}
                    onChange={(e) =>
                        setConfig({ ...config, restartSamplingScheduler: e.target.value })
                    }
                >
                    {resources.restartSamplingSchedulers.map((v) => (
                        <MenuItem key={v} value={v}>
                            {v}
                        </MenuItem>
                    ))}
                </Select>

                <TextField
                    label="restart segments"
                    value={config.restartSamplerSegments}
                    onChange={(e) =>
                        setConfig({ ...config, restartSamplerSegments: e.target.value })
                    }
                    minRows={1}
                />
            </Stack>
        </Stack>
    )
}

const savedConfig = localStorage.getItem("customWorkflowConfig")
let loadedConfig = savedConfig == null
export function CustomWorkflowPage() {
    const imageOutputRef = useRef<HTMLImageElement>(null)
    const resources = useComfyAPI()
    const graphVizContainer = useRef<HTMLElement>(null)
    const [progress, setProgress] = useState(0)
    const [maxProgress, setMaxProgress] = useState(0)

    const [config, setConfig] = useState<Config>({
        checkpoint: "",
        vae: "from_checkpoint",
        positive: "",
        negative: "",
        clipSkip: -1,
        samplingMethod: "euler",
        samplingScheduler: "normal",
        restartSamplingMethods: "",
        restartSamplingScheduler: "",
        restartSamplerSegments: "",
        samplingSteps: 20,
        tomeRatio: 0,
        width: 512,
        height: 512,
        cfgScale: 7.5,
        cfgRescale: 0,
        seed: 0,
        conditioners: [],
        batchSize: 1,
        batchCount: 1,
        resources,
    })

    useEffect(() => {
        if (savedConfig) {
            const res = JSON.parse(savedConfig)
            res.conditioners = res.conditioners.map((data) =>
                DeserializeModifier(data, availableConditioners)
            )
            setConfig(res)
            loadedConfig = true
        }
    }, [])

    useEffect(() => {
        if (!loadedConfig) return
        const serializableConfig = { ...config }
        serializableConfig.conditioners = serializableConfig.conditioners.map((c) =>
            SerializeModifier(c)
        )
        localStorage.setItem("customWorkflowConfig", JSON.stringify(serializableConfig))
        console.log("saved config")
    }, [JSON.stringify(config)])

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

            <Select
                style={{ flex: 1 }}
                value={config.vae}
                onChange={(e) => setConfig({ ...config, vae: e.target.value })}
            >
                <MenuItem key={"from_checkpoint"} value={"from_checkpoint"}>
                    {"don't override"}
                </MenuItem>
                {resources.vaes.map((v) => (
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

                                    <LabeledSlider
                                        value={config.tomeRatio}
                                        onChange={(v) => setConfig({ ...config, tomeRatio: v })}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        label="Token Merging Ratio"
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
                            const graph = ExecuteCustomWorkflow(config)

                            if (graphVizContainer.current) {
                                const svgElement = comfyToGraphvizSVG(graph)
                                for (const child of graphVizContainer.current.children) {
                                    graphVizContainer.current.removeChild(child)
                                }
                                graphVizContainer.current.appendChild(svgElement)
                            }

                            const res = await api.executePrompt(
                                0,
                                graph,
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
                                await api.view(res.output.images[res.output.images.length - 1])
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
            <Box ref={graphVizContainer}></Box>
        </Stack>
    )
}
