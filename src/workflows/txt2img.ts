import { AvailableData as ComfyResources } from "../api";
import { ControlNetConditioner } from "../components/ControlNetConditioner";
import {
    BuildWorkflow,
    CLIPTextEncode,
    CheckpointLoaderSimple,
    EmptyLatentImage,
    HypernetworkLoader,
    KSamplerAdvanced,
    LoraLoader,
    PreviewImage,
    VAEDecode,
} from "../nodes";

const injectEmbeddings = (text: string, availableData: ComfyResources) => {
    for (const embedding_path of availableData.embeddings) {
        const keyword = "embedding:" + embedding_path + ".pt";
        const filename = embedding_path.split("/").pop()!;
        text = text.replace(filename, keyword);
    }
    return text;
};

const findAngleBracketsWeight = (text: string, tag: string) => {
    const found: Array<{
        name: string;
        weight: number;
    }> = [];

    // <TAG:NAME:WEIGHT>
    const regex = new RegExp(`<${tag}:(.+?):(.+?)>`, "g");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
        const name = match[1];
        const weight = parseFloat(match[2]);
        found.push({ name, weight });
    }

    return found;
};

const stripAngleBrackets = (text: string) => {
    const regex = new RegExp(`<.+:(.+):(.+)>`, "g");

    text = text.replace(regex, "");

    return text;
};

const findLoras = (text: string, availableData: ComfyResources) => {
    const found: Array<{
        path: string;
        weight: number;
    }> = [];

    findAngleBracketsWeight(text, "lora").forEach(({ name, weight }) => {
        const path = availableData.loras.find((path) => path.includes(name));
        if (path) {
            found.push({ path, weight });
        }
    });

    findAngleBracketsWeight(text, "lycoris").forEach(({ name, weight }) => {
        const path = availableData.loras.find((path) => path.includes(name));
        if (path) {
            found.push({ path, weight });
        }
    });

    return found;
};

const findHyperNetworks = (text: string, availableData: ComfyResources) => {
    const found: Array<{
        path: string;
        weight: number;
    }> = [];

    findAngleBracketsWeight(text, "hypernetwork").forEach(({ name, weight }) => {
        const path = availableData.hypernetworks.find((path) => path.includes(name));
        if (path) {
            found.push({ path, weight });
        }
    });

    return found;
};

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

    resources: ComfyResources;

    conditioners: Array<ControlNetConditioner>;
}) => {
    return BuildWorkflow(() => {
        const loras = findLoras(config.positive, config.resources);
        const hypernetworks = findHyperNetworks(config.positive, config.resources);

        let positive = stripAngleBrackets(config.positive);
        let negative = stripAngleBrackets(config.negative);

        positive = injectEmbeddings(positive, config.resources);
        negative = injectEmbeddings(negative, config.resources);

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
                positiveCondioning = conditioner.apply(positiveCondioning);
            }
        }

        const negativeCondioning = CLIPTextEncode({
            text: negative,
            clip: clip.CLIP1,
        });

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
                    positive: positiveCondioning.CONDITIONING0,
                    negative: negativeCondioning.CONDITIONING0,
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
