import { ComfyResources } from "../Api/Api";

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

export const PreprocessPrompts = (positive: string, negative: string, resources: ComfyResources) => {
    const loras = findLoras(positive, resources);
    const hypernetworks = findHyperNetworks(positive, resources);

    positive = stripAngleBrackets(positive);
    negative = stripAngleBrackets(negative);

    positive = injectEmbeddings(positive, resources);
    negative = injectEmbeddings(negative, resources);

    return {
        positive,
        negative,
        loras,
        hypernetworks,
    }
}