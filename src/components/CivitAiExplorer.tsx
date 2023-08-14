import Masonry from "@mui/lab/Masonry"
import {
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import Grid from "@mui/material/Unstable_Grid2" // Grid version 2
import { Suspense } from "react"
import { Fade } from "react-slideshow-image"
import "react-slideshow-image/dist/styles.css"
import { CivitAiModelInfo, useCivitAIInfo, useRuntimeNodeProperty } from "../Api/Api"
import { Config, getWorkflowConfig, setWorkflowConfig } from "../CustomWorkflowPage"
import { NetworkModifier } from "../workflow_modifiers/network/Network"
import ErrorBoundary from "./ErrorBoundary"

const getTags = (modelInfo: CivitAiModelInfo, metadata: any) => {
    const trainedWords = modelInfo.trainedWords || []
    const tags = []
    let metadataTags = []
    if (metadata && metadata.ss_tag_frequency) {
        try {
            let data = JSON.parse(metadata.ss_tag_frequency)
            data = data[Object.keys(data)[0]]

            const newMap = {}

            for (const tag in data) {
                if (tag.includes(" ")) {
                    for (const subtag of tag.split(" ")) {
                        newMap[subtag] = (newMap[subtag] || 0) + data[tag]
                    }
                } else {
                    newMap[tag] = (newMap[tag] || 0) + data[tag]
                }
            }
            let sorted = []

            for (const [tag, score] of Object.entries(newMap)) {
                sorted.push([tag, score])
            }
            sorted.sort((a, b) => b[1] - a[1])
            // remove words like the, a, etc
            sorted = sorted.filter((a) => a[0].length > 3)
            // top 5
            sorted = sorted.slice(0, 5)

            metadataTags = sorted
        } catch (e) {
            console.log(e)
        }
    }

    for (const tag of metadataTags) {
        if (!trainedWords.includes(tag)) {
            tags.push(tag[0])
        }
    }

    for (const tag of trainedWords) {
        tags.push(tag)
    }

    return tags
}

const loadConfig = (metaData: CivitAiModelInfo["images"][number]["meta"], loraPath: string) => {
    const config = {} as Config
    config.positive = metaData.prompt
    config.negative = metaData.negativePrompt || ""
    config.width = parseInt(metaData.Size.split("x")[0], 10)
    config.height = parseInt(metaData.Size.split("x")[1], 10)
    config.seed = metaData.seed
    config.cfgScale = metaData.cfgScale

    const matchedWeight = metaData.prompt.match(/<.*?:.*?:(.*?)>/g) // just find the first weight

    config.positive = config.positive.replace(/<.*?>/g, "")

    const lora = new NetworkModifier()
    lora.config.model = loraPath
    lora.config.clipStrength = matchedWeight ? parseFloat(matchedWeight[0].split(":")[2]) : 1
    lora.config.unetStrength = lora.config.clipStrength
    config.conditioners = [lora]

    const prevConfig = getWorkflowConfig()
    setWorkflowConfig({
        ...prevConfig,
        ...config,
    })
}

const CivitAIResource = (props: { comfyPath: string; type: string }) => {
    const [modelInfo, metadata] = useCivitAIInfo("loras", props.comfyPath)
    const tags = getTags(modelInfo, metadata)
    const imageUrls = modelInfo.images || []
    return (
        <Card sx={{ maxWidth: 250 }}>
            <CardContent>
                <Typography variant="h5">{modelInfo.model.name}</Typography>
            </CardContent>

            <CardMedia>
                <Fade>
                    {imageUrls.map((fadeImage) => {
                        const width = fadeImage.width
                        const height = fadeImage.height
                        const ratio = width / height
                        const newWidth = 250
                        const newHeight = newWidth / ratio
                        console.log(fadeImage)
                        return (
                            <Stack>
                                <img
                                    key={fadeImage.url}
                                    width={newWidth}
                                    height={newHeight}
                                    src={fadeImage.url}
                                />
                                {!fadeImage.meta ? null : (
                                    <Button
                                        size="small"
                                        onClick={() => loadConfig(fadeImage.meta, props.comfyPath)}
                                    >
                                        {fadeImage.meta.prompt.slice(0, 25) + ".."}
                                    </Button>
                                )}
                            </Stack>
                        )
                    })}
                </Fade>
            </CardMedia>
            <CardContent>
                <Grid container spacing={0.5}>
                    {tags.map((tag) => {
                        return (
                            <Grid>
                                <Chip variant="filled" label={tag} />{" "}
                            </Grid>
                        )
                    })}
                </Grid>
            </CardContent>
        </Card>
    )
}

export const CivitAIExplorer = () => {
    const availableModels = useRuntimeNodeProperty<string[]>("LoraLoader", "lora_name")

    return (
        <Stack>
            <TextField></TextField>
            <Masonry columns={4} spacing={2}>
                {availableModels.available.slice(1, 16).map((path, index) => (
                    <ErrorBoundary fallback={<div>error</div>}>
                        <Suspense fallback={<div>loading</div>}>
                            <CivitAIResource key={index} comfyPath={path} type="loras" />
                        </Suspense>
                    </ErrorBoundary>
                ))}
            </Masonry>
        </Stack>
    )
}
