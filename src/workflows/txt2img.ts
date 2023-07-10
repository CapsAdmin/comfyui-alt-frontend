import { AvailableData } from "../api";
import {
    CLIPTextEncode,
    CheckpointLoaderSimple,
    EmptyLatentImage,
    KSamplerAdvanced,
    PreviewImage,
    BuildWorkflow,
    VAEDecode,
    LoraLoader,
} from "../nodes";

const injectEmbeddings = (text: string, availableData: AvailableData) => {
    for (const embedding_path of availableData.embeddings) {
        const keyword = "embedding:" + embedding_path + ".pt"
        const filename = embedding_path.split("/").pop()!
        text = text.replace(filename, keyword)
    }
    return text
}

const findAngleBracketsWeight = (text: string, tag: string) => {
    const found: Array<{
        name: string;
        weight: number;
    }> = []

    // <TAG:NAME:WEIGHT>
    const regex = new RegExp(`<${tag}:(.+?):(.+?)>`, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        const name = match[1]
        const weight = parseFloat(match[2])
        found.push({ name, weight })
    }

    return found
}

const stripAngleBrackets = (text: string) => {
    const regex = new RegExp(`<.+:(.+):(.+)>`, "g");

    text = text.replace(regex, "")

    return text
}

const findLoras = (text: string, availableData: AvailableData) => {
    const found: Array<{
        path: string;
        weight: number;
    }> = []

    findAngleBracketsWeight(text, "lora").forEach(({ name, weight }) => {
        const path = availableData.loras.find((path) => path.includes(name))
        if (path) {
            found.push({ path, weight })
        }
    })

    findAngleBracketsWeight(text, "lycoris").forEach(({ name, weight }) => {
        const path = availableData.loras.find((path) => path.includes(name))
        if (path) {
            found.push({ path, weight })
        }
    })

    return found
}

export const Txt2Img = (config: {
    checkpoint: string;

    positive: string;
    negative: string;

    samplingMethod: Parameters<typeof KSamplerAdvanced>[0]["sampler_name"];
    samplingScheduler: Parameters<typeof KSamplerAdvanced>[0]["scheduler"];
    samplingSteps: number;

    width: number;
    height: number;

    batchSize: number;
    batchCount: number;

    cfgScale: number;
    seed: number;

    availableData: AvailableData;
}) => {
    const positiveLoras = findLoras(config.positive, config.availableData)
    const negativeLoras = findLoras(config.negative, config.availableData)

    const positive = injectEmbeddings(stripAngleBrackets(config.positive), config.availableData)
    const negative = injectEmbeddings(stripAngleBrackets(config.negative), config.availableData)

    console.log(positiveLoras, negativeLoras)
    console.log(positive, negative)

    return BuildWorkflow(() => {
        const checkpoint = CheckpointLoaderSimple({
            ckpt_name: config.checkpoint,
        });

        let model: { MODEL0: [string, number], CLIP1: [string, number] } = checkpoint

        for (const { path, weight } of positiveLoras) {
            model = LoraLoader({
                lora_name: path,
                model: checkpoint.MODEL0,
                clip: checkpoint.CLIP1,
                strength_clip: weight,
                strength_model: weight,
            })
        }

        PreviewImage({
            images: VAEDecode({
                samples: KSamplerAdvanced({
                    add_noise: "enable",
                    noise_seed: config.seed,
                    steps: config.samplingSteps,
                    cfg: config.cfgScale,
                    sampler_name: config.samplingMethod,
                    scheduler: config.samplingScheduler,
                    start_at_step: 0,
                    end_at_step: 10000,
                    return_with_leftover_noise: "disable",
                    model: model.MODEL0,
                    positive: CLIPTextEncode({
                        text: positive,
                        clip: model.CLIP1,
                    }).CONDITIONING0,
                    negative: CLIPTextEncode({
                        text: negative,
                        clip: model.CLIP1,
                    }).CONDITIONING0,
                    latent_image: EmptyLatentImage({
                        width: config.width,
                        height: config.height,
                        batch_size: config.batchSize,
                    }).LATENT0,
                }).LATENT0,
                vae: checkpoint.VAE2,
            }).IMAGE0,
        });
    });
};
