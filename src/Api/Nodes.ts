export type NodeLink = [string, number]

let id = 0
let workflow = { version: 0.4, nodes: [], output: {} }
let outputs: Array<{ image: NodeLink; node: any; userdata: any }> = []
const StartNodeContext = () => {
    id = 0
    workflow = { version: 0.4, nodes: [], output: {} }
    outputs = []
}

const EndNodeContext = () => {
    return [workflow, outputs] as const
}

export const CollectOutput = (image: NodeLink, userdata?: any) => {
    outputs.push({ image: image, node: undefined, userdata: userdata })
    return image
}

const addNode = (type: string, node: any, input: any) => {
    node.id = id++
    node.type = type

    workflow.output[node.id] = {
        class_type: node.type,
        inputs: input,
    }

    workflow.nodes.push(node)
}

export const BuildWorkflow = async (fn: () => Promise<void>) => {
    StartNodeContext()
    await fn()

    for (const outputImage of outputs) {
        outputImage.node = PreviewImage({
            images: outputImage.image,
        })
    }

    return EndNodeContext()
}

export const KSampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSampler", node, input)
    return node
}

export const CheckpointLoaderSimple = (input: { ["ckpt_name"]: string | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
    } as const
    addNode("CheckpointLoaderSimple", node, input)
    return node
}

export const CLIPTextEncode = (input: {
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncode", node, input)
    return node
}

export const CLIPSetLastLayer = (input: {
    ["clip"]: "CLIP" | NodeLink
    ["stop_at_clip_layer"]?: number | NodeLink
}) => {
    if (input["stop_at_clip_layer"] === undefined) input["stop_at_clip_layer"] = -1
    const node = {
        ["CLIP0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPSetLastLayer", node, input)
    return node
}

export const VAEDecode = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEDecode", node, input)
    return node
}

export const VAEEncode = (input: { ["pixels"]: "IMAGE" | NodeLink; ["vae"]: "VAE" | NodeLink }) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncode", node, input)
    return node
}

export const VAEEncodeForInpaint = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["grow_mask_by"]?: number | NodeLink
}) => {
    if (input["grow_mask_by"] === undefined) input["grow_mask_by"] = 6
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncodeForInpaint", node, input)
    return node
}

export const VAELoader = (input: { ["vae_name"]: string | NodeLink }) => {
    const node = {
        ["VAE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAELoader", node, input)
    return node
}

export const EmptyLatentImage = (input: {
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["batch_size"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    if (input["batch_size"] === undefined) input["batch_size"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("EmptyLatentImage", node, input)
    return node
}

export const LatentUpscale = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["crop"]: "disabled" | "center" | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentUpscale", node, input)
    return node
}

export const LatentUpscaleBy = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | NodeLink
    ["scale_by"]?: number | NodeLink
}) => {
    if (input["scale_by"] === undefined) input["scale_by"] = 1.5
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentUpscaleBy", node, input)
    return node
}

export const LatentFromBatch = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["batch_index"]?: number | NodeLink
    ["length"]?: number | NodeLink
}) => {
    if (input["batch_index"] === undefined) input["batch_index"] = 0
    if (input["length"] === undefined) input["length"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentFromBatch", node, input)
    return node
}

export const RepeatLatentBatch = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["amount"]?: number | NodeLink
}) => {
    if (input["amount"] === undefined) input["amount"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RepeatLatentBatch", node, input)
    return node
}

export const SaveImage = (input: {
    ["images"]: "IMAGE" | NodeLink
    ["filename_prefix"]?: string | NodeLink
}) => {
    if (input["filename_prefix"] === undefined) input["filename_prefix"] = "ComfyUI"
    const node = {} as const
    addNode("SaveImage", node, input)
    return node
}

export const PreviewImage = (input: { ["images"]: "IMAGE" | NodeLink }) => {
    const node = {} as const
    addNode("PreviewImage", node, input)
    return node
}

export const LoadImage = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("LoadImage", node, input)
    return node
}

export const LoadImageMask = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["channel"]: "alpha" | "red" | "green" | "blue" | NodeLink
}) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LoadImageMask", node, input)
    return node
}

export const ImageScale = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["crop"]: "disabled" | "center" | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageScale", node, input)
    return node
}

export const ImageScaleBy = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | NodeLink
    ["scale_by"]?: number | NodeLink
}) => {
    if (input["scale_by"] === undefined) input["scale_by"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageScaleBy", node, input)
    return node
}

export const ImageInvert = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageInvert", node, input)
    return node
}

export const ImagePadForOutpaint = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["left"]?: number | NodeLink
    ["top"]?: number | NodeLink
    ["right"]?: number | NodeLink
    ["bottom"]?: number | NodeLink
    ["feathering"]?: number | NodeLink
}) => {
    if (input["left"] === undefined) input["left"] = 0
    if (input["top"] === undefined) input["top"] = 0
    if (input["right"] === undefined) input["right"] = 0
    if (input["bottom"] === undefined) input["bottom"] = 0
    if (input["feathering"] === undefined) input["feathering"] = 40
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ImagePadForOutpaint", node, input)
    return node
}

export const ConditioningAverage_ = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
    ["conditioning_to_strength"]?: number | NodeLink
}) => {
    if (input["conditioning_to_strength"] === undefined) input["conditioning_to_strength"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningAverage ", node, input)
    return node
}

export const ConditioningCombine = (input: {
    ["conditioning_1"]: "CONDITIONING" | NodeLink
    ["conditioning_2"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningCombine", node, input)
    return node
}

export const ConditioningConcat = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningConcat", node, input)
    return node
}

export const ConditioningSetArea = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
    ["strength"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 64
    if (input["height"] === undefined) input["height"] = 64
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    if (input["strength"] === undefined) input["strength"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetArea", node, input)
    return node
}

export const ConditioningSetMask = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["strength"]?: number | NodeLink
    ["set_cond_area"]: "default" | "mask bounds" | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetMask", node, input)
    return node
}

export const KSamplerAdvanced = (input: {
    ["model"]: "MODEL" | NodeLink
    ["add_noise"]: "enable" | "disable" | NodeLink
    ["noise_seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["start_at_step"]?: number | NodeLink
    ["end_at_step"]?: number | NodeLink
    ["return_with_leftover_noise"]: "disable" | "enable" | NodeLink
}) => {
    if (input["noise_seed"] === undefined) input["noise_seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["start_at_step"] === undefined) input["start_at_step"] = 0
    if (input["end_at_step"] === undefined) input["end_at_step"] = 10000
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSamplerAdvanced", node, input)
    return node
}

export const SetLatentNoiseMask = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SetLatentNoiseMask", node, input)
    return node
}

export const LatentComposite = (input: {
    ["samples_to"]: "LATENT" | NodeLink
    ["samples_from"]: "LATENT" | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
    ["feather"]?: number | NodeLink
}) => {
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    if (input["feather"] === undefined) input["feather"] = 0
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentComposite", node, input)
    return node
}

export const LatentBlend = (input: {
    ["samples1"]: "LATENT" | NodeLink
    ["samples2"]: "LATENT" | NodeLink
    ["blend_factor"]?: number | NodeLink
}) => {
    if (input["blend_factor"] === undefined) input["blend_factor"] = 0.5
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentBlend", node, input)
    return node
}

export const LatentRotate = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["rotation"]: "none" | "90 degrees" | "180 degrees" | "270 degrees" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentRotate", node, input)
    return node
}

export const LatentFlip = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["flip_method"]: "x-axis: vertically" | "y-axis: horizontally" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentFlip", node, input)
    return node
}

export const LatentCrop = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentCrop", node, input)
    return node
}

export const LoraLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["lora_name"]: string | NodeLink
    ["strength_model"]?: number | NodeLink
    ["strength_clip"]?: number | NodeLink
}) => {
    if (input["strength_model"] === undefined) input["strength_model"] = 1
    if (input["strength_clip"] === undefined) input["strength_clip"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("LoraLoader", node, input)
    return node
}

export const CLIPLoader = (input: { ["clip_name"]: string | NodeLink }) => {
    const node = {
        ["CLIP0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPLoader", node, input)
    return node
}

export const UNETLoader = (input: { ["unet_name"]: string | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UNETLoader", node, input)
    return node
}

export const DualCLIPLoader = (input: {
    ["clip_name1"]: any | NodeLink
    ["clip_name2"]: any | NodeLink
}) => {
    const node = {
        ["CLIP0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DualCLIPLoader", node, input)
    return node
}

export const CLIPVisionEncode = (input: {
    ["clip_vision"]: "CLIP_VISION" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["CLIP_VISION_OUTPUT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPVisionEncode", node, input)
    return node
}

export const StyleModelApply = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["style_model"]: "STYLE_MODEL" | NodeLink
    ["clip_vision_output"]: "CLIP_VISION_OUTPUT" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("StyleModelApply", node, input)
    return node
}

export const unCLIPConditioning = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["clip_vision_output"]: "CLIP_VISION_OUTPUT" | NodeLink
    ["strength"]?: number | NodeLink
    ["noise_augmentation"]?: number | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    if (input["noise_augmentation"] === undefined) input["noise_augmentation"] = 0
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("unCLIPConditioning", node, input)
    return node
}

export const ControlNetApply = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["control_net"]: "CONTROL_NET" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["strength"]?: number | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ControlNetApply", node, input)
    return node
}

export const ControlNetApplyAdvanced = (input: {
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["control_net"]: "CONTROL_NET" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["strength"]?: number | NodeLink
    ["start_percent"]?: number | NodeLink
    ["end_percent"]?: number | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    if (input["start_percent"] === undefined) input["start_percent"] = 0
    if (input["end_percent"] === undefined) input["end_percent"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
        ["CONDITIONING1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ControlNetApplyAdvanced", node, input)
    return node
}

export const ControlNetLoader = (input: { ["control_net_name"]: string | NodeLink }) => {
    const node = {
        ["CONTROL_NET0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ControlNetLoader", node, input)
    return node
}

export const DiffControlNetLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["control_net_name"]: string | NodeLink
}) => {
    const node = {
        ["CONTROL_NET0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DiffControlNetLoader", node, input)
    return node
}

export const StyleModelLoader = (input: { ["style_model_name"]: string | NodeLink }) => {
    const node = {
        ["STYLE_MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("StyleModelLoader", node, input)
    return node
}

export const CLIPVisionLoader = (input: { ["clip_name"]: string | NodeLink }) => {
    const node = {
        ["CLIP_VISION0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPVisionLoader", node, input)
    return node
}

export const VAEDecodeTiled = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEDecodeTiled", node, input)
    return node
}

export const VAEEncodeTiled = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncodeTiled", node, input)
    return node
}

export const unCLIPCheckpointLoader = (input: { ["ckpt_name"]: string | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
        ["CLIP_VISION3"]: [id.toString(), 3] as NodeLink,
    } as const
    addNode("unCLIPCheckpointLoader", node, input)
    return node
}

export const GLIGENLoader = (input: { ["gligen_name"]: string | NodeLink }) => {
    const node = {
        ["GLIGEN0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("GLIGENLoader", node, input)
    return node
}

export const GLIGENTextBoxApply = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["gligen_textbox_model"]: "GLIGEN" | NodeLink
    ["text"]: string | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 64
    if (input["height"] === undefined) input["height"] = 64
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("GLIGENTextBoxApply", node, input)
    return node
}

export const CheckpointLoader = (input: {
    ["config_name"]: string | NodeLink
    ["ckpt_name"]: string | NodeLink
}) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
    } as const
    addNode("CheckpointLoader", node, input)
    return node
}

export const DiffusersLoader = (input: { ["model_path"]: any | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
    } as const
    addNode("DiffusersLoader", node, input)
    return node
}

export const LoadLatent = (input: { ["latent"]: any | NodeLink }) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LoadLatent", node, input)
    return node
}

export const SaveLatent = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["filename_prefix"]?: string | NodeLink
}) => {
    if (input["filename_prefix"] === undefined) input["filename_prefix"] = "latents/ComfyUI"
    const node = {} as const
    addNode("SaveLatent", node, input)
    return node
}

export const ConditioningZeroOut = (input: { ["conditioning"]: "CONDITIONING" | NodeLink }) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningZeroOut", node, input)
    return node
}

export const ConditioningSetTimestepRange = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["start"]?: number | NodeLink
    ["end"]?: number | NodeLink
}) => {
    if (input["start"] === undefined) input["start"] = 0
    if (input["end"] === undefined) input["end"] = 1
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetTimestepRange", node, input)
    return node
}

export const HypernetworkLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["hypernetwork_name"]: string | NodeLink
    ["strength"]?: number | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("HypernetworkLoader", node, input)
    return node
}

export const UpscaleModelLoader = (input: { ["model_name"]: string | NodeLink }) => {
    const node = {
        ["UPSCALE_MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UpscaleModelLoader", node, input)
    return node
}

export const ImageUpscaleWithModel = (input: {
    ["upscale_model"]: "UPSCALE_MODEL" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageUpscaleWithModel", node, input)
    return node
}

export const ImageBlend = (input: {
    ["image1"]: "IMAGE" | NodeLink
    ["image2"]: "IMAGE" | NodeLink
    ["blend_factor"]?: number | NodeLink
    ["blend_mode"]: "normal" | "multiply" | "screen" | "overlay" | "soft_light" | NodeLink
}) => {
    if (input["blend_factor"] === undefined) input["blend_factor"] = 0.5
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageBlend", node, input)
    return node
}

export const ImageBlur = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["blur_radius"]?: number | NodeLink
    ["sigma"]?: number | NodeLink
}) => {
    if (input["blur_radius"] === undefined) input["blur_radius"] = 1
    if (input["sigma"] === undefined) input["sigma"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageBlur", node, input)
    return node
}

export const ImageQuantize = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["colors"]?: number | NodeLink
    ["dither"]: "none" | "floyd-steinberg" | NodeLink
}) => {
    if (input["colors"] === undefined) input["colors"] = 256
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageQuantize", node, input)
    return node
}

export const ImageSharpen = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["sharpen_radius"]?: number | NodeLink
    ["sigma"]?: number | NodeLink
    ["alpha"]?: number | NodeLink
}) => {
    if (input["sharpen_radius"] === undefined) input["sharpen_radius"] = 1
    if (input["sigma"] === undefined) input["sigma"] = 1
    if (input["alpha"] === undefined) input["alpha"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageSharpen", node, input)
    return node
}

export const LatentCompositeMasked = (input: {
    ["destination"]: "LATENT" | NodeLink
    ["source"]: "LATENT" | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
    ["mask"]?: "MASK" | NodeLink
}) => {
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentCompositeMasked", node, input)
    return node
}

export const MaskToImage = (input: { ["mask"]: "MASK" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MaskToImage", node, input)
    return node
}

export const ImageToMask = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["channel"]: "red" | "green" | "blue" | NodeLink
}) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageToMask", node, input)
    return node
}

export const SolidMask = (input: {
    ["value"]?: number | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
}) => {
    if (input["value"] === undefined) input["value"] = 1
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SolidMask", node, input)
    return node
}

export const InvertMask = (input: { ["mask"]: "MASK" | NodeLink }) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("InvertMask", node, input)
    return node
}

export const CropMask = (input: {
    ["mask"]: "MASK" | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
}) => {
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CropMask", node, input)
    return node
}

export const MaskComposite = (input: {
    ["destination"]: "MASK" | NodeLink
    ["source"]: "MASK" | NodeLink
    ["x"]?: number | NodeLink
    ["y"]?: number | NodeLink
    ["operation"]: "multiply" | "add" | "subtract" | "and" | "or" | "xor" | NodeLink
}) => {
    if (input["x"] === undefined) input["x"] = 0
    if (input["y"] === undefined) input["y"] = 0
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MaskComposite", node, input)
    return node
}

export const FeatherMask = (input: {
    ["mask"]: "MASK" | NodeLink
    ["left"]?: number | NodeLink
    ["top"]?: number | NodeLink
    ["right"]?: number | NodeLink
    ["bottom"]?: number | NodeLink
}) => {
    if (input["left"] === undefined) input["left"] = 0
    if (input["top"] === undefined) input["top"] = 0
    if (input["right"] === undefined) input["right"] = 0
    if (input["bottom"] === undefined) input["bottom"] = 0
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FeatherMask", node, input)
    return node
}

export const RebatchLatents = (input: {
    ["latents"]: "LATENT" | NodeLink
    ["batch_size"]?: number | NodeLink
}) => {
    if (input["batch_size"] === undefined) input["batch_size"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RebatchLatents", node, input)
    return node
}

export const ModelMergeSimple = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["ratio"]?: number | NodeLink
}) => {
    if (input["ratio"] === undefined) input["ratio"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeSimple", node, input)
    return node
}

export const ModelMergeBlocks = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["input"]?: number | NodeLink
    ["middle"]?: number | NodeLink
    ["out"]?: number | NodeLink
}) => {
    if (input["input"] === undefined) input["input"] = 1
    if (input["middle"] === undefined) input["middle"] = 1
    if (input["out"] === undefined) input["out"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeBlocks", node, input)
    return node
}

export const CheckpointSave = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["filename_prefix"]?: string | NodeLink
}) => {
    if (input["filename_prefix"] === undefined) input["filename_prefix"] = "checkpoints/ComfyUI"
    const node = {} as const
    addNode("CheckpointSave", node, input)
    return node
}

export const CLIPMergeSimple = (input: {
    ["clip1"]: "CLIP" | NodeLink
    ["clip2"]: "CLIP" | NodeLink
    ["ratio"]?: number | NodeLink
}) => {
    if (input["ratio"] === undefined) input["ratio"] = 1
    const node = {
        ["CLIP0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPMergeSimple", node, input)
    return node
}

export const TomePatchModel = (input: {
    ["model"]: "MODEL" | NodeLink
    ["ratio"]?: number | NodeLink
}) => {
    if (input["ratio"] === undefined) input["ratio"] = 0.3
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TomePatchModel", node, input)
    return node
}

export const CLIPTextEncodeSDXLRefiner = (input: {
    ["ascore"]?: number | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
}) => {
    if (input["ascore"] === undefined) input["ascore"] = 6
    if (input["width"] === undefined) input["width"] = 1024
    if (input["height"] === undefined) input["height"] = 1024
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncodeSDXLRefiner", node, input)
    return node
}

export const CLIPTextEncodeSDXL = (input: {
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["crop_w"]?: number | NodeLink
    ["crop_h"]?: number | NodeLink
    ["target_width"]?: number | NodeLink
    ["target_height"]?: number | NodeLink
    ["text_g"]?: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["text_l"]?: string | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 1024
    if (input["height"] === undefined) input["height"] = 1024
    if (input["crop_w"] === undefined) input["crop_w"] = 0
    if (input["crop_h"] === undefined) input["crop_h"] = 0
    if (input["target_width"] === undefined) input["target_width"] = 1024
    if (input["target_height"] === undefined) input["target_height"] = 1024
    if (input["text_g"] === undefined) input["text_g"] = "CLIP_G"
    if (input["text_l"] === undefined) input["text_l"] = "CLIP_L"
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncodeSDXL", node, input)
    return node
}

export const Canny = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["low_threshold"]?: number | NodeLink
    ["high_threshold"]?: number | NodeLink
}) => {
    if (input["low_threshold"] === undefined) input["low_threshold"] = 0.4
    if (input["high_threshold"] === undefined) input["high_threshold"] = 0.8
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Canny", node, input)
    return node
}

export const SAMLoader = (input: {
    ["model_name"]: string | NodeLink
    ["device_mode"]: "AUTO" | NodeLink
}) => {
    const node = {
        ["SAM_MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SAMLoader", node, input)
    return node
}

export const CLIPSegDetectorProvider = (input: {
    ["text"]: string | NodeLink
    ["blur"]?: number | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation_factor"]?: number | NodeLink
}) => {
    if (input["blur"] === undefined) input["blur"] = 7
    if (input["threshold"] === undefined) input["threshold"] = 0.4
    if (input["dilation_factor"] === undefined) input["dilation_factor"] = 4
    const node = {
        ["BBOX_DETECTOR0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPSegDetectorProvider", node, input)
    return node
}

export const ONNXDetectorProvider = (input: { ["model_name"]: string | NodeLink }) => {
    const node = {
        ["ONNX_DETECTOR0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ONNXDetectorProvider", node, input)
    return node
}

export const BitwiseAndMaskForEach = (input: {
    ["base_segs"]: "SEGS" | NodeLink
    ["mask_segs"]: "SEGS" | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BitwiseAndMaskForEach", node, input)
    return node
}

export const SubtractMaskForEach = (input: {
    ["base_segs"]: "SEGS" | NodeLink
    ["mask_segs"]: "SEGS" | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SubtractMaskForEach", node, input)
    return node
}

export const DetailerForEach = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = true
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DetailerForEach", node, input)
    return node
}

export const DetailerForEachDebug = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = true
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["IMAGE1"]: [id.toString(), 1] as NodeLink,
        ["IMAGE2"]: [id.toString(), 2] as NodeLink,
        ["IMAGE3"]: [id.toString(), 3] as NodeLink,
    } as const
    addNode("DetailerForEachDebug", node, input)
    return node
}

export const DetailerForEachPipe = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = true
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DetailerForEachPipe", node, input)
    return node
}

export const DetailerForEachDebugPipe = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = true
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["IMAGE1"]: [id.toString(), 1] as NodeLink,
        ["IMAGE2"]: [id.toString(), 2] as NodeLink,
        ["IMAGE3"]: [id.toString(), 3] as NodeLink,
    } as const
    addNode("DetailerForEachDebugPipe", node, input)
    return node
}

export const SAMDetectorCombined = (input: {
    ["sam_model"]: "SAM_MODEL" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["detection_hint"]:
        | "center-1"
        | "horizontal-2"
        | "vertical-2"
        | "rect-4"
        | "diamond-4"
        | "mask-area"
        | "mask-points"
        | "mask-point-bbox"
        | "none"
        | NodeLink
    ["dilation"]?: number | NodeLink
    ["threshold"]?: number | NodeLink
    ["bbox_expansion"]?: number | NodeLink
    ["mask_hint_threshold"]?: number | NodeLink
    ["mask_hint_use_negative"]: "False" | "Small" | "Outter" | NodeLink
}) => {
    if (input["dilation"] === undefined) input["dilation"] = 0
    if (input["threshold"] === undefined) input["threshold"] = 0.93
    if (input["bbox_expansion"] === undefined) input["bbox_expansion"] = 0
    if (input["mask_hint_threshold"] === undefined) input["mask_hint_threshold"] = 0.7
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SAMDetectorCombined", node, input)
    return node
}

export const SAMDetectorSegmented = (input: {
    ["sam_model"]: "SAM_MODEL" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["detection_hint"]:
        | "center-1"
        | "horizontal-2"
        | "vertical-2"
        | "rect-4"
        | "diamond-4"
        | "mask-area"
        | "mask-points"
        | "mask-point-bbox"
        | "none"
        | NodeLink
    ["dilation"]?: number | NodeLink
    ["threshold"]?: number | NodeLink
    ["bbox_expansion"]?: number | NodeLink
    ["mask_hint_threshold"]?: number | NodeLink
    ["mask_hint_use_negative"]: "False" | "Small" | "Outter" | NodeLink
}) => {
    if (input["dilation"] === undefined) input["dilation"] = 0
    if (input["threshold"] === undefined) input["threshold"] = 0.93
    if (input["bbox_expansion"] === undefined) input["bbox_expansion"] = 0
    if (input["mask_hint_threshold"] === undefined) input["mask_hint_threshold"] = 0.7
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
        ["MASKS1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("SAMDetectorSegmented", node, input)
    return node
}

export const FaceDetailer = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
    ["bbox_threshold"]?: number | NodeLink
    ["bbox_dilation"]?: number | NodeLink
    ["bbox_crop_factor"]?: number | NodeLink
    ["sam_detection_hint"]:
        | "center-1"
        | "horizontal-2"
        | "vertical-2"
        | "rect-4"
        | "diamond-4"
        | "mask-area"
        | "mask-points"
        | "mask-point-bbox"
        | "none"
        | NodeLink
    ["sam_dilation"]?: number | NodeLink
    ["sam_threshold"]?: number | NodeLink
    ["sam_bbox_expansion"]?: number | NodeLink
    ["sam_mask_hint_threshold"]?: number | NodeLink
    ["sam_mask_hint_use_negative"]: "False" | "Small" | "Outter" | NodeLink
    ["drop_size"]?: number | NodeLink
    ["bbox_detector"]: "BBOX_DETECTOR" | NodeLink
    ["wildcard"]: string | NodeLink
    ["sam_model_opt"]?: "SAM_MODEL" | NodeLink
    ["segm_detector_opt"]?: "SEGM_DETECTOR" | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = true
    if (input["bbox_threshold"] === undefined) input["bbox_threshold"] = 0.5
    if (input["bbox_dilation"] === undefined) input["bbox_dilation"] = 10
    if (input["bbox_crop_factor"] === undefined) input["bbox_crop_factor"] = 3
    if (input["sam_dilation"] === undefined) input["sam_dilation"] = 0
    if (input["sam_threshold"] === undefined) input["sam_threshold"] = 0.93
    if (input["sam_bbox_expansion"] === undefined) input["sam_bbox_expansion"] = 0
    if (input["sam_mask_hint_threshold"] === undefined) input["sam_mask_hint_threshold"] = 0.7
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["IMAGE1"]: [id.toString(), 1] as NodeLink,
        ["IMAGE2"]: [id.toString(), 2] as NodeLink,
        ["MASK3"]: [id.toString(), 3] as NodeLink,
        ["DETAILER_PIPE4"]: [id.toString(), 4] as NodeLink,
    } as const
    addNode("FaceDetailer", node, input)
    return node
}

export const FaceDetailerPipe = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["detailer_pipe"]: "DETAILER_PIPE" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["feather"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
    ["bbox_threshold"]?: number | NodeLink
    ["bbox_dilation"]?: number | NodeLink
    ["bbox_crop_factor"]?: number | NodeLink
    ["sam_detection_hint"]:
        | "center-1"
        | "horizontal-2"
        | "vertical-2"
        | "rect-4"
        | "diamond-4"
        | "mask-area"
        | "mask-points"
        | "mask-point-bbox"
        | "none"
        | NodeLink
    ["sam_dilation"]?: number | NodeLink
    ["sam_threshold"]?: number | NodeLink
    ["sam_bbox_expansion"]?: number | NodeLink
    ["sam_mask_hint_threshold"]?: number | NodeLink
    ["sam_mask_hint_use_negative"]: "False" | "Small" | "Outter" | NodeLink
    ["drop_size"]?: number | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["feather"] === undefined) input["feather"] = 5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = false
    if (input["bbox_threshold"] === undefined) input["bbox_threshold"] = 0.5
    if (input["bbox_dilation"] === undefined) input["bbox_dilation"] = 10
    if (input["bbox_crop_factor"] === undefined) input["bbox_crop_factor"] = 3
    if (input["sam_dilation"] === undefined) input["sam_dilation"] = 0
    if (input["sam_threshold"] === undefined) input["sam_threshold"] = 0.93
    if (input["sam_bbox_expansion"] === undefined) input["sam_bbox_expansion"] = 0
    if (input["sam_mask_hint_threshold"] === undefined) input["sam_mask_hint_threshold"] = 0.7
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["IMAGE1"]: [id.toString(), 1] as NodeLink,
        ["IMAGE2"]: [id.toString(), 2] as NodeLink,
        ["MASK3"]: [id.toString(), 3] as NodeLink,
        ["DETAILER_PIPE4"]: [id.toString(), 4] as NodeLink,
    } as const
    addNode("FaceDetailerPipe", node, input)
    return node
}

export const ToDetailerPipe = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["bbox_detector"]: "BBOX_DETECTOR" | NodeLink
    ["wildcard"]: string | NodeLink
    ["sam_model_opt"]?: "SAM_MODEL" | NodeLink
    ["segm_detector_opt"]?: "SEGM_DETECTOR" | NodeLink
}) => {
    const node = {
        ["DETAILER_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ToDetailerPipe", node, input)
    return node
}

export const FromDetailerPipe = (input: { ["detailer_pipe"]: "DETAILER_PIPE" | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
        ["CONDITIONING3"]: [id.toString(), 3] as NodeLink,
        ["CONDITIONING4"]: [id.toString(), 4] as NodeLink,
        ["BBOX_DETECTOR5"]: [id.toString(), 5] as NodeLink,
        ["SAM_MODEL6"]: [id.toString(), 6] as NodeLink,
        ["SEGM_DETECTOR7"]: [id.toString(), 7] as NodeLink,
    } as const
    addNode("FromDetailerPipe", node, input)
    return node
}

export const FromDetailerPipe_v2 = (input: { ["detailer_pipe"]: "DETAILER_PIPE" | NodeLink }) => {
    const node = {
        ["DETAILER_PIPE0"]: [id.toString(), 0] as NodeLink,
        ["MODEL1"]: [id.toString(), 1] as NodeLink,
        ["CLIP2"]: [id.toString(), 2] as NodeLink,
        ["VAE3"]: [id.toString(), 3] as NodeLink,
        ["CONDITIONING4"]: [id.toString(), 4] as NodeLink,
        ["CONDITIONING5"]: [id.toString(), 5] as NodeLink,
        ["BBOX_DETECTOR6"]: [id.toString(), 6] as NodeLink,
        ["SAM_MODEL7"]: [id.toString(), 7] as NodeLink,
        ["SEGM_DETECTOR8"]: [id.toString(), 8] as NodeLink,
    } as const
    addNode("FromDetailerPipe_v2", node, input)
    return node
}

export const ToBasicPipe = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ToBasicPipe", node, input)
    return node
}

export const FromBasicPipe = (input: { ["basic_pipe"]: "BASIC_PIPE" | NodeLink }) => {
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["CLIP1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
        ["CONDITIONING3"]: [id.toString(), 3] as NodeLink,
        ["CONDITIONING4"]: [id.toString(), 4] as NodeLink,
    } as const
    addNode("FromBasicPipe", node, input)
    return node
}

export const FromBasicPipe_v2 = (input: { ["basic_pipe"]: "BASIC_PIPE" | NodeLink }) => {
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
        ["MODEL1"]: [id.toString(), 1] as NodeLink,
        ["CLIP2"]: [id.toString(), 2] as NodeLink,
        ["VAE3"]: [id.toString(), 3] as NodeLink,
        ["CONDITIONING4"]: [id.toString(), 4] as NodeLink,
        ["CONDITIONING5"]: [id.toString(), 5] as NodeLink,
    } as const
    addNode("FromBasicPipe_v2", node, input)
    return node
}

export const BasicPipeToDetailerPipe = (input: {
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["bbox_detector"]: "BBOX_DETECTOR" | NodeLink
    ["wildcard"]: string | NodeLink
    ["sam_model_opt"]?: "SAM_MODEL" | NodeLink
    ["segm_detector_opt"]?: "SEGM_DETECTOR" | NodeLink
}) => {
    const node = {
        ["DETAILER_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BasicPipeToDetailerPipe", node, input)
    return node
}

export const DetailerPipeToBasicPipe = (input: {
    ["detailer_pipe"]: "DETAILER_PIPE" | NodeLink
}) => {
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DetailerPipeToBasicPipe", node, input)
    return node
}

export const EditBasicPipe = (input: {
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["model"]?: "MODEL" | NodeLink
    ["clip"]?: "CLIP" | NodeLink
    ["vae"]?: "VAE" | NodeLink
    ["positive"]?: "CONDITIONING" | NodeLink
    ["negative"]?: "CONDITIONING" | NodeLink
}) => {
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("EditBasicPipe", node, input)
    return node
}

export const EditDetailerPipe = (input: {
    ["detailer_pipe"]: "DETAILER_PIPE" | NodeLink
    ["wildcard"]: string | NodeLink
    ["model"]?: "MODEL" | NodeLink
    ["clip"]?: "CLIP" | NodeLink
    ["vae"]?: "VAE" | NodeLink
    ["positive"]?: "CONDITIONING" | NodeLink
    ["negative"]?: "CONDITIONING" | NodeLink
    ["bbox_detector"]?: "BBOX_DETECTOR" | NodeLink
    ["sam_model"]?: "SAM_MODEL" | NodeLink
    ["segm_detector_opt"]?: "SEGM_DETECTOR" | NodeLink
}) => {
    const node = {
        ["DETAILER_PIPE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("EditDetailerPipe", node, input)
    return node
}

export const LatentPixelScale = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["scale_factor"]?: number | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["use_tiled_vae"]?: boolean | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
}) => {
    if (input["scale_factor"] === undefined) input["scale_factor"] = 1.5
    if (input["use_tiled_vae"] === undefined) input["use_tiled_vae"] = false
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentPixelScale", node, input)
    return node
}

export const PixelKSampleUpscalerProvider = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["model"]: "MODEL" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["denoise"]?: number | NodeLink
    ["use_tiled_vae"]?: boolean | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["use_tiled_vae"] === undefined) input["use_tiled_vae"] = false
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PixelKSampleUpscalerProvider", node, input)
    return node
}

export const PixelKSampleUpscalerProviderPipe = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["use_tiled_vae"]?: boolean | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["use_tiled_vae"] === undefined) input["use_tiled_vae"] = false
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PixelKSampleUpscalerProviderPipe", node, input)
    return node
}

export const IterativeLatentUpscale = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_factor"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["temp_prefix"]?: string | NodeLink
    ["upscaler"]: "UPSCALER" | NodeLink
}) => {
    if (input["upscale_factor"] === undefined) input["upscale_factor"] = 1.5
    if (input["steps"] === undefined) input["steps"] = 3
    if (input["temp_prefix"] === undefined) input["temp_prefix"] = ""
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("IterativeLatentUpscale", node, input)
    return node
}

export const IterativeImageUpscale = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["upscale_factor"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["temp_prefix"]?: string | NodeLink
    ["upscaler"]: "UPSCALER" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    if (input["upscale_factor"] === undefined) input["upscale_factor"] = 1.5
    if (input["steps"] === undefined) input["steps"] = 3
    if (input["temp_prefix"] === undefined) input["temp_prefix"] = ""
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("IterativeImageUpscale", node, input)
    return node
}

export const PixelTiledKSampleUpscalerProvider = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["model"]: "MODEL" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["denoise"]?: number | NodeLink
    ["tile_width"]?: number | NodeLink
    ["tile_height"]?: number | NodeLink
    ["tiling_strategy"]: "random" | "padded" | "simple" | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["tile_width"] === undefined) input["tile_width"] = 512
    if (input["tile_height"] === undefined) input["tile_height"] = 512
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PixelTiledKSampleUpscalerProvider", node, input)
    return node
}

export const PixelTiledKSampleUpscalerProviderPipe = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["tile_width"]?: number | NodeLink
    ["tile_height"]?: number | NodeLink
    ["tiling_strategy"]: "random" | "padded" | "simple" | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["tile_width"] === undefined) input["tile_width"] = 512
    if (input["tile_height"] === undefined) input["tile_height"] = 512
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PixelTiledKSampleUpscalerProviderPipe", node, input)
    return node
}

export const TwoSamplersForMaskUpscalerProvider = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["full_sample_schedule"]:
        | "none"
        | "interleave1"
        | "interleave2"
        | "interleave3"
        | "last1"
        | "last2"
        | "interleave1+last1"
        | "interleave2+last1"
        | "interleave3+last1"
        | NodeLink
    ["use_tiled_vae"]?: boolean | NodeLink
    ["base_sampler"]: "KSAMPLER" | NodeLink
    ["mask_sampler"]: "KSAMPLER" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["full_sampler_opt"]?: "KSAMPLER" | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_base_opt"]?: "PK_HOOK" | NodeLink
    ["pk_hook_mask_opt"]?: "PK_HOOK" | NodeLink
    ["pk_hook_full_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["use_tiled_vae"] === undefined) input["use_tiled_vae"] = false
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TwoSamplersForMaskUpscalerProvider", node, input)
    return node
}

export const TwoSamplersForMaskUpscalerProviderPipe = (input: {
    ["scale_method"]: "nearest-exact" | "bilinear" | "area" | NodeLink
    ["full_sample_schedule"]:
        | "none"
        | "interleave1"
        | "interleave2"
        | "interleave3"
        | "last1"
        | "last2"
        | "interleave1+last1"
        | "interleave2+last1"
        | "interleave3+last1"
        | NodeLink
    ["use_tiled_vae"]?: boolean | NodeLink
    ["base_sampler"]: "KSAMPLER" | NodeLink
    ["mask_sampler"]: "KSAMPLER" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["full_sampler_opt"]?: "KSAMPLER" | NodeLink
    ["upscale_model_opt"]?: "UPSCALE_MODEL" | NodeLink
    ["pk_hook_base_opt"]?: "PK_HOOK" | NodeLink
    ["pk_hook_mask_opt"]?: "PK_HOOK" | NodeLink
    ["pk_hook_full_opt"]?: "PK_HOOK" | NodeLink
}) => {
    if (input["use_tiled_vae"] === undefined) input["use_tiled_vae"] = false
    const node = {
        ["UPSCALER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TwoSamplersForMaskUpscalerProviderPipe", node, input)
    return node
}

export const PixelKSampleHookCombine = (input: {
    ["hook1"]: "PK_HOOK" | NodeLink
    ["hook2"]: "PK_HOOK" | NodeLink
}) => {
    const node = {
        ["PK_HOOK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PixelKSampleHookCombine", node, input)
    return node
}

export const DenoiseScheduleHookProvider = (input: {
    ["schedule_for_iteration"]: "simple" | NodeLink
    ["target_denoise"]?: number | NodeLink
}) => {
    if (input["target_denoise"] === undefined) input["target_denoise"] = 0.2
    const node = {
        ["PK_HOOK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DenoiseScheduleHookProvider", node, input)
    return node
}

export const CfgScheduleHookProvider = (input: {
    ["schedule_for_iteration"]: "simple" | NodeLink
    ["target_cfg"]?: number | NodeLink
}) => {
    if (input["target_cfg"] === undefined) input["target_cfg"] = 3
    const node = {
        ["PK_HOOK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CfgScheduleHookProvider", node, input)
    return node
}

export const BitwiseAndMask = (input: {
    ["mask1"]: "MASK" | NodeLink
    ["mask2"]: "MASK" | NodeLink
}) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BitwiseAndMask", node, input)
    return node
}

export const SubtractMask = (input: {
    ["mask1"]: "MASK" | NodeLink
    ["mask2"]: "MASK" | NodeLink
}) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SubtractMask", node, input)
    return node
}

export const AddMask = (input: { ["mask1"]: "MASK" | NodeLink; ["mask2"]: "MASK" | NodeLink }) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AddMask", node, input)
    return node
}

export const Segs___Mask = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Segs & Mask", node, input)
    return node
}

export const Segs___Mask_ForEach = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["masks"]: "MASKS" | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Segs & Mask ForEach", node, input)
    return node
}

export const MaskToSEGS = (input: {
    ["mask"]: "MASK" | NodeLink
    ["combined"]?: boolean | NodeLink
    ["crop_factor"]?: number | NodeLink
    ["bbox_fill"]?: boolean | NodeLink
    ["drop_size"]?: number | NodeLink
}) => {
    if (input["combined"] === undefined) input["combined"] = false
    if (input["crop_factor"] === undefined) input["crop_factor"] = 3
    if (input["bbox_fill"] === undefined) input["bbox_fill"] = false
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MaskToSEGS", node, input)
    return node
}

export const ToBinaryMask = (input: {
    ["mask"]: "MASK" | NodeLink
    ["threshold"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 20
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ToBinaryMask", node, input)
    return node
}

export const MasksToMaskList = (input: { ["masks"]: "MASKS" | NodeLink }) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MasksToMaskList", node, input)
    return node
}

export const BboxDetectorSEGS = (input: {
    ["bbox_detector"]: "BBOX_DETECTOR" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation"]?: number | NodeLink
    ["crop_factor"]?: number | NodeLink
    ["drop_size"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0.5
    if (input["dilation"] === undefined) input["dilation"] = 10
    if (input["crop_factor"] === undefined) input["crop_factor"] = 3
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BboxDetectorSEGS", node, input)
    return node
}

export const SegmDetectorSEGS = (input: {
    ["segm_detector"]: "SEGM_DETECTOR" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation"]?: number | NodeLink
    ["crop_factor"]?: number | NodeLink
    ["drop_size"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0.5
    if (input["dilation"] === undefined) input["dilation"] = 10
    if (input["crop_factor"] === undefined) input["crop_factor"] = 3
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SegmDetectorSEGS", node, input)
    return node
}

export const ONNXDetectorSEGS = (input: {
    ["onnx_detector"]: "ONNX_DETECTOR" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation"]?: number | NodeLink
    ["crop_factor"]?: number | NodeLink
    ["drop_size"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0.8
    if (input["dilation"] === undefined) input["dilation"] = 10
    if (input["crop_factor"] === undefined) input["crop_factor"] = 1
    if (input["drop_size"] === undefined) input["drop_size"] = 10
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ONNXDetectorSEGS", node, input)
    return node
}

export const BboxDetectorCombined_v2 = (input: {
    ["bbox_detector"]: "BBOX_DETECTOR" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0.5
    if (input["dilation"] === undefined) input["dilation"] = 4
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BboxDetectorCombined_v2", node, input)
    return node
}

export const SegmDetectorCombined_v2 = (input: {
    ["segm_detector"]: "SEGM_DETECTOR" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
    ["dilation"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0.5
    if (input["dilation"] === undefined) input["dilation"] = 0
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SegmDetectorCombined_v2", node, input)
    return node
}

export const SegsToCombinedMask = (input: { ["segs"]: "SEGS" | NodeLink }) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SegsToCombinedMask", node, input)
    return node
}

export const KSamplerProvider = (input: {
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    const node = {
        ["KSAMPLER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSamplerProvider", node, input)
    return node
}

export const TwoSamplersForMask = (input: {
    ["latent_image"]: "LATENT" | NodeLink
    ["base_sampler"]: "KSAMPLER" | NodeLink
    ["mask_sampler"]: "KSAMPLER" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TwoSamplersForMask", node, input)
    return node
}

export const TiledKSamplerProvider = (input: {
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["tile_width"]?: number | NodeLink
    ["tile_height"]?: number | NodeLink
    ["tiling_strategy"]: "random" | "padded" | "simple" | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["tile_width"] === undefined) input["tile_width"] = 512
    if (input["tile_height"] === undefined) input["tile_height"] = 512
    const node = {
        ["KSAMPLER0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TiledKSamplerProvider", node, input)
    return node
}

export const KSamplerAdvancedProvider = (input: {
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["cfg"] === undefined) input["cfg"] = 8
    const node = {
        ["KSAMPLER_ADVANCED0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSamplerAdvancedProvider", node, input)
    return node
}

export const TwoAdvancedSamplersForMask = (input: {
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["denoise"]?: number | NodeLink
    ["samples"]: "LATENT" | NodeLink
    ["base_sampler"]: "KSAMPLER_ADVANCED" | NodeLink
    ["mask_sampler"]: "KSAMPLER_ADVANCED" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["overlap_factor"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["overlap_factor"] === undefined) input["overlap_factor"] = 10
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TwoAdvancedSamplersForMask", node, input)
    return node
}

export const PreviewBridge = (input: {
    ["images"]: "IMAGE" | NodeLink
    ["image"]?: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("PreviewBridge", node, input)
    return node
}

export const ImageSender = (input: {
    ["images"]: "IMAGE" | NodeLink
    ["filename_prefix"]?: string | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["filename_prefix"] === undefined) input["filename_prefix"] = "ImgSender"
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {} as const
    addNode("ImageSender", node, input)
    return node
}

export const ImageReceiver = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ImageReceiver", node, input)
    return node
}

export const LatentSender = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["filename_prefix"]?: string | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["filename_prefix"] === undefined) input["filename_prefix"] = "latents/LatentSender"
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {} as const
    addNode("LatentSender", node, input)
    return node
}

export const LatentReceiver = (input: {
    ["latent"]: any | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentReceiver", node, input)
    return node
}

export const ImageMaskSwitch = (input: {
    ["select"]?: number | NodeLink
    ["images1"]: "IMAGE" | NodeLink
    ["mask1_opt"]?: "MASK" | NodeLink
    ["images2_opt"]?: "IMAGE" | NodeLink
    ["mask2_opt"]?: "MASK" | NodeLink
    ["images3_opt"]?: "IMAGE" | NodeLink
    ["mask3_opt"]?: "MASK" | NodeLink
    ["images4_opt"]?: "IMAGE" | NodeLink
    ["mask4_opt"]?: "MASK" | NodeLink
}) => {
    if (input["select"] === undefined) input["select"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ImageMaskSwitch", node, input)
    return node
}

export const LatentSwitch = (input: {
    ["select"]?: number | NodeLink
    ["latent1"]: "LATENT" | NodeLink
    ["latent2_opt"]?: "LATENT" | NodeLink
    ["latent3_opt"]?: "LATENT" | NodeLink
    ["latent4_opt"]?: "LATENT" | NodeLink
}) => {
    if (input["select"] === undefined) input["select"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentSwitch", node, input)
    return node
}

export const SEGSSwitch = (input: {
    ["select"]?: number | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["segs2_opt"]?: "SEGS" | NodeLink
    ["segs3_opt"]?: "SEGS" | NodeLink
    ["segs4_opt"]?: "SEGS" | NodeLink
}) => {
    if (input["select"] === undefined) input["select"] = 1
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEGSSwitch", node, input)
    return node
}

export const ImpactWildcardProcessor = (input: {
    ["wildcard_text"]: string | NodeLink
    ["populated_text"]: string | NodeLink
    ["mode"]?: boolean | NodeLink
}) => {
    if (input["mode"] === undefined) input["mode"] = true
    const node = {
        ["STRING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactWildcardProcessor", node, input)
    return node
}

export const ImpactLogger = (input: { ["text"]?: string | NodeLink }) => {
    if (input["text"] === undefined) input["text"] = ""
    const node = {} as const
    addNode("ImpactLogger", node, input)
    return node
}

export const SEGSDetailer = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["guide_size"]?: number | NodeLink
    ["guide_size_for"]?: boolean | NodeLink
    ["max_size"]?: number | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["denoise"]?: number | NodeLink
    ["noise_mask"]?: boolean | NodeLink
    ["force_inpaint"]?: boolean | NodeLink
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    if (input["guide_size"] === undefined) input["guide_size"] = 256
    if (input["guide_size_for"] === undefined) input["guide_size_for"] = true
    if (input["max_size"] === undefined) input["max_size"] = 768
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 0.5
    if (input["noise_mask"] === undefined) input["noise_mask"] = true
    if (input["force_inpaint"] === undefined) input["force_inpaint"] = false
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEGSDetailer", node, input)
    return node
}

export const SEGSPaste = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["segs"]: "SEGS" | NodeLink
    ["feather"]?: number | NodeLink
    ["ref_image_opt"]?: "IMAGE" | NodeLink
}) => {
    if (input["feather"] === undefined) input["feather"] = 5
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEGSPaste", node, input)
    return node
}

export const SEGSPreview = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["fallback_image_opt"]?: "IMAGE" | NodeLink
}) => {
    const node = {} as const
    addNode("SEGSPreview", node, input)
    return node
}

export const SEGSToImageList = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["fallback_image_opt"]?: "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEGSToImageList", node, input)
    return node
}

export const ImpactSEGSToMaskList = (input: { ["segs"]: "SEGS" | NodeLink }) => {
    const node = {
        ["MASK0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactSEGSToMaskList", node, input)
    return node
}

export const ImpactSEGSConcat = (input: {
    ["segs1"]: "SEGS" | NodeLink
    ["segs2"]: "SEGS" | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactSEGSConcat", node, input)
    return node
}

export const ImpactKSamplerBasicPipe = (input: {
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
        ["LATENT1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
    } as const
    addNode("ImpactKSamplerBasicPipe", node, input)
    return node
}

export const ImpactKSamplerAdvancedBasicPipe = (input: {
    ["basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["add_noise"]?: boolean | NodeLink
    ["noise_seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["start_at_step"]?: number | NodeLink
    ["end_at_step"]?: number | NodeLink
    ["return_with_leftover_noise"]?: boolean | NodeLink
}) => {
    if (input["add_noise"] === undefined) input["add_noise"] = true
    if (input["noise_seed"] === undefined) input["noise_seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["start_at_step"] === undefined) input["start_at_step"] = 0
    if (input["end_at_step"] === undefined) input["end_at_step"] = 10000
    if (input["return_with_leftover_noise"] === undefined)
        input["return_with_leftover_noise"] = false
    const node = {
        ["BASIC_PIPE0"]: [id.toString(), 0] as NodeLink,
        ["LATENT1"]: [id.toString(), 1] as NodeLink,
        ["VAE2"]: [id.toString(), 2] as NodeLink,
    } as const
    addNode("ImpactKSamplerAdvancedBasicPipe", node, input)
    return node
}

export const ReencodeLatent = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["tile_mode"]: "None" | "Both" | "Decode(input) only" | "Encode(output) only" | NodeLink
    ["input_vae"]: "VAE" | NodeLink
    ["output_vae"]: "VAE" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ReencodeLatent", node, input)
    return node
}

export const ReencodeLatentPipe = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["tile_mode"]: "None" | "Both" | "Decode(input) only" | "Encode(output) only" | NodeLink
    ["input_basic_pipe"]: "BASIC_PIPE" | NodeLink
    ["output_basic_pipe"]: "BASIC_PIPE" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ReencodeLatentPipe", node, input)
    return node
}

export const ImpactImageBatchToImageList = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactImageBatchToImageList", node, input)
    return node
}

export const RegionalSampler = (input: {
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["denoise"]?: number | NodeLink
    ["samples"]: "LATENT" | NodeLink
    ["base_sampler"]: "KSAMPLER_ADVANCED" | NodeLink
    ["regional_prompts"]: "REGIONAL_PROMPTS" | NodeLink
    ["overlap_factor"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["overlap_factor"] === undefined) input["overlap_factor"] = 10
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RegionalSampler", node, input)
    return node
}

export const CombineRegionalPrompts = (input: {
    ["regional_prompts1"]: "REGIONAL_PROMPTS" | NodeLink
    ["regional_prompts2"]: "REGIONAL_PROMPTS" | NodeLink
}) => {
    const node = {
        ["REGIONAL_PROMPTS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CombineRegionalPrompts", node, input)
    return node
}

export const RegionalPrompt = (input: {
    ["mask"]: "MASK" | NodeLink
    ["advanced_sampler"]: "KSAMPLER_ADVANCED" | NodeLink
}) => {
    const node = {
        ["REGIONAL_PROMPTS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RegionalPrompt", node, input)
    return node
}

export const ImpactSEGSLabelFilter = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["preset"]:
        | "all"
        | "hand"
        | "face"
        | "short_sleeved_shirt"
        | "long_sleeved_shirt"
        | "short_sleeved_outwear"
        | "long_sleeved_outwear"
        | "vest"
        | "sling"
        | "shorts"
        | "trousers"
        | "skirt"
        | "short_sleeved_dress"
        | "long_sleeved_dress"
        | "vest_dress"
        | "sling_dress"
        | NodeLink
    ["labels"]: string | NodeLink
}) => {
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactSEGSLabelFilter", node, input)
    return node
}

export const ImpactSEGSRangeFilter = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["target"]: "area(=w*h)" | "width" | "height" | "x1" | "y1" | "x2" | "y2" | NodeLink
    ["mode"]?: boolean | NodeLink
    ["min_value"]?: number | NodeLink
    ["max_value"]?: number | NodeLink
}) => {
    if (input["mode"] === undefined) input["mode"] = true
    if (input["min_value"] === undefined) input["min_value"] = 0
    if (input["max_value"] === undefined) input["max_value"] = 67108864
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactSEGSRangeFilter", node, input)
    return node
}

export const ImpactSEGSOrderedFilter = (input: {
    ["segs"]: "SEGS" | NodeLink
    ["target"]: "area(=w*h)" | "width" | "height" | "x1" | "y1" | "x2" | "y2" | NodeLink
    ["order"]?: boolean | NodeLink
    ["take_start"]?: number | NodeLink
    ["take_count"]?: number | NodeLink
}) => {
    if (input["order"] === undefined) input["order"] = true
    if (input["take_start"] === undefined) input["take_start"] = 0
    if (input["take_count"] === undefined) input["take_count"] = 1
    const node = {
        ["SEGS0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactSEGSOrderedFilter", node, input)
    return node
}

export const ImpactCompare = (input: {
    ["cmp"]: "a = b" | "a <> b" | "a > b" | "a < b" | "a >= b" | "a <= b" | "tt" | "ff" | NodeLink
    ["a"]: "*" | NodeLink
    ["b"]: "*" | NodeLink
}) => {
    const node = {
        ["BOOLEAN0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactCompare", node, input)
    return node
}

export const ImpactConditionalBranch = (input: {
    ["cond"]: boolean | NodeLink
    ["tt_value"]: "*" | NodeLink
    ["ff_value"]: "*" | NodeLink
}) => {
    const node = {
        ["*0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactConditionalBranch", node, input)
    return node
}

export const ImpactInt = (input: { ["value"]?: number | NodeLink }) => {
    if (input["value"] === undefined) input["value"] = 0
    const node = {
        ["INT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactInt", node, input)
    return node
}

export const ImpactValueSender = (input: {
    ["value"]: "*" | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {} as const
    addNode("ImpactValueSender", node, input)
    return node
}

export const ImpactValueReceiver = (input: {
    ["typ"]: string | NodeLink
    ["value"]?: string | NodeLink
    ["link_id"]?: number | NodeLink
}) => {
    if (input["value"] === undefined) input["value"] = ""
    if (input["link_id"] === undefined) input["link_id"] = 0
    const node = {
        ["*0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactValueReceiver", node, input)
    return node
}

export const ImpactImageInfo = (input: { ["value"]: "IMAGE" | NodeLink }) => {
    const node = {
        ["INT0"]: [id.toString(), 0] as NodeLink,
        ["INT1"]: [id.toString(), 1] as NodeLink,
        ["INT2"]: [id.toString(), 2] as NodeLink,
        ["INT3"]: [id.toString(), 3] as NodeLink,
    } as const
    addNode("ImpactImageInfo", node, input)
    return node
}

export const ImpactMinMax = (input: {
    ["mode"]?: boolean | NodeLink
    ["a"]: "*" | NodeLink
    ["b"]: "*" | NodeLink
}) => {
    if (input["mode"] === undefined) input["mode"] = true
    const node = {
        ["INT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactMinMax", node, input)
    return node
}

export const ImpactNeg = (input: { ["value"]: boolean | NodeLink }) => {
    const node = {
        ["BOOLEAN0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImpactNeg", node, input)
    return node
}

export const ImpactConditionalStopIteration = (input: { ["cond"]: boolean | NodeLink }) => {
    const node = {} as const
    addNode("ImpactConditionalStopIteration", node, input)
    return node
}

export const UltralyticsDetectorProvider = (input: { ["model_name"]: string | NodeLink }) => {
    const node = {
        ["BBOX_DETECTOR0"]: [id.toString(), 0] as NodeLink,
        ["SEGM_DETECTOR1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("UltralyticsDetectorProvider", node, input)
    return node
}

export const ReferenceOnlySimple = (input: {
    ["model"]: "MODEL" | NodeLink
    ["reference"]: "LATENT" | NodeLink
    ["batch_size"]?: number | NodeLink
}) => {
    if (input["batch_size"] === undefined) input["batch_size"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
        ["LATENT1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ReferenceOnlySimple", node, input)
    return node
}

export const RescaleClassifierFreeGuidanceTest = (input: {
    ["model"]: "MODEL" | NodeLink
    ["multiplier"]?: number | NodeLink
}) => {
    if (input["multiplier"] === undefined) input["multiplier"] = 0.7
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RescaleClassifierFreeGuidanceTest", node, input)
    return node
}

export const FaceRestoreWithModel = (input: {
    ["facerestore_model"]: "FACERESTORE_MODEL" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["facedetection"]:
        | "retinaface_resnet50"
        | "retinaface_mobile0.25"
        | "YOLOv5l"
        | "YOLOv5n"
        | NodeLink
    ["weight"]?: number | NodeLink
}) => {
    if (input["weight"] === undefined) input["weight"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FaceRestoreWithModel", node, input)
    return node
}

export const CropFace = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["facedetection"]:
        | "retinaface_resnet50"
        | "retinaface_mobile0.25"
        | "YOLOv5l"
        | "YOLOv5n"
        | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CropFace", node, input)
    return node
}

export const FaceRestoreModelLoader = (input: { ["model_name"]: string | NodeLink }) => {
    const node = {
        ["FACERESTORE_MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FaceRestoreModelLoader", node, input)
    return node
}

export const RecommendedResCalc = (input: {
    ["desiredXSIZE"]?: number | NodeLink
    ["desiredYSIZE"]?: number | NodeLink
}) => {
    if (input["desiredXSIZE"] === undefined) input["desiredXSIZE"] = 1024
    if (input["desiredYSIZE"] === undefined) input["desiredYSIZE"] = 1024
    const node = {
        ["INT0"]: [id.toString(), 0] as NodeLink,
        ["INT1"]: [id.toString(), 1] as NodeLink,
        ["FLOAT2"]: [id.toString(), 2] as NodeLink,
        ["FLOAT3"]: [id.toString(), 3] as NodeLink,
    } as const
    addNode("RecommendedResCalc", node, input)
    return node
}

export const ModelSamplerTonemapNoiseTest = (input: {
    ["model"]: "MODEL" | NodeLink
    ["multiplier"]?: number | NodeLink
}) => {
    if (input["multiplier"] === undefined) input["multiplier"] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelSamplerTonemapNoiseTest", node, input)
    return node
}

export const LatentInterposer = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["latent_src"]: "v1" | "xl" | NodeLink
    ["latent_dst"]: "v1" | "xl" | NodeLink
}) => {
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentInterposer", node, input)
    return node
}

export const DZ_Face_Detailer = (input: {
    ["latent_image"]: "LATENT" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["mask_blur"]?: number | NodeLink
    ["mask_type"]: "box" | "face" | NodeLink
    ["mask_control"]: "dilate" | "erode" | "disabled" | NodeLink
    ["dilate_mask_value"]?: number | NodeLink
    ["erode_mask_value"]?: number | NodeLink
}) => {
    if (input["mask_blur"] === undefined) input["mask_blur"] = 0
    if (input["dilate_mask_value"] === undefined) input["dilate_mask_value"] = 3
    if (input["erode_mask_value"] === undefined) input["erode_mask_value"] = 3
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
        ["MASK1"]: [id.toString(), 1] as NodeLink,
    } as const
    addNode("DZ_Face_Detailer", node, input)
    return node
}

export const BNK_NoisyLatentImage = (input: {
    ["source"]: "CPU" | NodeLink
    ["seed"]?: number | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["batch_size"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["width"] === undefined) input["width"] = 512
    if (input["height"] === undefined) input["height"] = 512
    if (input["batch_size"] === undefined) input["batch_size"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_NoisyLatentImage", node, input)
    return node
}

export const BNK_SlerpLatent = (input: {
    ["latents1"]: "LATENT" | NodeLink
    ["factor"]?: number | NodeLink
    ["latents2"]?: "LATENT" | NodeLink
    ["mask"]?: "MASK" | NodeLink
}) => {
    if (input["factor"] === undefined) input["factor"] = 0.5
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_SlerpLatent", node, input)
    return node
}

export const BNK_GetSigma = (input: {
    ["model"]: "MODEL" | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["steps"]?: number | NodeLink
    ["start_at_step"]?: number | NodeLink
    ["end_at_step"]?: number | NodeLink
}) => {
    if (input["steps"] === undefined) input["steps"] = 10000
    if (input["start_at_step"] === undefined) input["start_at_step"] = 0
    if (input["end_at_step"] === undefined) input["end_at_step"] = 10000
    const node = {
        ["FLOAT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_GetSigma", node, input)
    return node
}

export const BNK_InjectNoise = (input: {
    ["latents"]: "LATENT" | NodeLink
    ["strength"]?: number | NodeLink
    ["noise"]?: "LATENT" | NodeLink
    ["mask"]?: "MASK" | NodeLink
}) => {
    if (input["strength"] === undefined) input["strength"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_InjectNoise", node, input)
    return node
}

export const BNK_Unsampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["steps"]?: number | NodeLink
    ["end_at_step"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["normalize"]: "disable" | "enable" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
}) => {
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["end_at_step"] === undefined) input["end_at_step"] = 0
    if (input["cfg"] === undefined) input["cfg"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_Unsampler", node, input)
    return node
}

export const SEECoderImageEncode = (input: {
    ["seecoder_name"]: string | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEECoderImageEncode", node, input)
    return node
}

export const ConcatConditioning = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConcatConditioning", node, input)
    return node
}

export const CannyEdgePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["low_threshold"]?: number | NodeLink
    ["high_threshold"]?: number | NodeLink
    ["l2gradient"]?: "disable" | "enable" | NodeLink
}) => {
    if (input["low_threshold"] === undefined) input["low_threshold"] = 100
    if (input["high_threshold"] === undefined) input["high_threshold"] = 200
    if (input["l2gradient"] === undefined) input["l2gradient"] = "disable"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CannyEdgePreprocessor", node, input)
    return node
}

export const M_LSDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["score_threshold"]?: number | NodeLink
    ["dist_threshold"]?: number | NodeLink
}) => {
    if (input["score_threshold"] === undefined) input["score_threshold"] = 6.283185307179586
    if (input["dist_threshold"] === undefined) input["dist_threshold"] = 0.05
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("M-LSDPreprocessor", node, input)
    return node
}

export const HEDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["version"]?: "v1" | "v1.1" | NodeLink
    ["safe"]?: "enable" | "disable" | NodeLink
}) => {
    if (input["version"] === undefined) input["version"] = "v1.1"
    if (input["safe"] === undefined) input["safe"] = "enable"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("HEDPreprocessor", node, input)
    return node
}

export const ScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ScribblePreprocessor", node, input)
    return node
}

export const FakeScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FakeScribblePreprocessor", node, input)
    return node
}

export const BinaryPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]?: number | NodeLink
}) => {
    if (input["threshold"] === undefined) input["threshold"] = 0
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BinaryPreprocessor", node, input)
    return node
}

export const PiDiNetPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["safe"]?: "enable" | "disable" | NodeLink
}) => {
    if (input["safe"] === undefined) input["safe"] = "enable"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PiDiNetPreprocessor", node, input)
    return node
}

export const LineArtPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["coarse"]?: "disable" | "enable" | NodeLink
}) => {
    if (input["coarse"] === undefined) input["coarse"] = "disable"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LineArtPreprocessor", node, input)
    return node
}

export const AnimeLineArtPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AnimeLineArtPreprocessor", node, input)
    return node
}

export const Manga2Anime_LineArtPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Manga2Anime-LineArtPreprocessor", node, input)
    return node
}

export const MiDaS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["a"]?: number | NodeLink
    ["bg_threshold"]?: number | NodeLink
}) => {
    if (input["a"] === undefined) input["a"] = 6.283185307179586
    if (input["bg_threshold"] === undefined) input["bg_threshold"] = 0.05
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MiDaS-DepthMapPreprocessor", node, input)
    return node
}

export const MiDaS_NormalMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["a"]?: number | NodeLink
    ["bg_threshold"]?: number | NodeLink
}) => {
    if (input["a"] === undefined) input["a"] = 6.283185307179586
    if (input["bg_threshold"] === undefined) input["bg_threshold"] = 0.05
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MiDaS-NormalMapPreprocessor", node, input)
    return node
}

export const LeReS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["rm_nearest"]?: number | NodeLink
    ["rm_background"]?: number | NodeLink
}) => {
    if (input["rm_nearest"] === undefined) input["rm_nearest"] = 0
    if (input["rm_background"] === undefined) input["rm_background"] = 0
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LeReS-DepthMapPreprocessor", node, input)
    return node
}

export const Zoe_DepthMapPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Zoe-DepthMapPreprocessor", node, input)
    return node
}

export const BAE_NormalMapPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BAE-NormalMapPreprocessor", node, input)
    return node
}

export const OpenposePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["detect_hand"]?: "enable" | "disable" | NodeLink
    ["detect_body"]?: "enable" | "disable" | NodeLink
    ["detect_face"]?: "enable" | "disable" | NodeLink
    ["version"]?: "v1" | "v1.1" | NodeLink
}) => {
    if (input["detect_hand"] === undefined) input["detect_hand"] = "enable"
    if (input["detect_body"] === undefined) input["detect_body"] = "enable"
    if (input["detect_face"] === undefined) input["detect_face"] = "enable"
    if (input["version"] === undefined) input["version"] = "v1.1"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OpenposePreprocessor", node, input)
    return node
}

export const MediaPipe_HandPosePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["detect_pose"]?: "enable" | "disable" | NodeLink
    ["detect_hands"]?: "enable" | "disable" | NodeLink
}) => {
    if (input["detect_pose"] === undefined) input["detect_pose"] = "enable"
    if (input["detect_hands"] === undefined) input["detect_hands"] = "enable"
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MediaPipe-HandPosePreprocessor", node, input)
    return node
}

export const SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SemSegPreprocessor", node, input)
    return node
}

export const UniFormer_SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UniFormer-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_COCO_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OneFormer-COCO-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_ADE20K_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OneFormer-ADE20K-SemSegPreprocessor", node, input)
    return node
}

export const MediaPipe_FaceMeshPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["max_faces"]?: number | NodeLink
    ["min_confidence"]?: number | NodeLink
}) => {
    if (input["max_faces"] === undefined) input["max_faces"] = 10
    if (input["min_confidence"] === undefined) input["min_confidence"] = 0.5
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MediaPipe-FaceMeshPreprocessor", node, input)
    return node
}

export const ColorPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ColorPreprocessor", node, input)
    return node
}

export const TilePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["pyrUp_iters"]?: number | NodeLink
}) => {
    if (input["pyrUp_iters"] === undefined) input["pyrUp_iters"] = 3
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TilePreprocessor", node, input)
    return node
}

export const InpaintPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("InpaintPreprocessor", node, input)
    return node
}

export const KRestartSamplerSimple = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]?: number | NodeLink
    ["segments"]?: string | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["segments"] === undefined) input["segments"] = "[3,2,0.06,0.30],[3,1,0.30,0.59]"
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KRestartSamplerSimple", node, input)
    return node
}

export const KRestartSampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]?: number | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]?: number | NodeLink
    ["segments"]?: string | NodeLink
    ["restart_scheduler"]:
        | "normal"
        | "karras"
        | "exponential"
        | "simple"
        | "ddim_uniform"
        | "simple_test"
        | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    if (input["segments"] === undefined) input["segments"] = "[3,2,0.06,0.30],[3,1,0.30,0.59]"
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KRestartSampler", node, input)
    return node
}

export const BNK_CLIPTextEncodeAdvanced = (input: {
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["token_normalization"]: "none" | "mean" | "length" | "length+mean" | NodeLink
    ["weight_interpretation"]: "comfy" | "A1111" | "compel" | "comfy++" | "down_weight" | NodeLink
}) => {
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CLIPTextEncodeAdvanced", node, input)
    return node
}

export const BNK_CLIPTextEncodeSDXLAdvanced = (input: {
    ["text_l"]: string | NodeLink
    ["text_g"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["token_normalization"]: "none" | "mean" | "length" | "length+mean" | NodeLink
    ["weight_interpretation"]: "comfy" | "A1111" | "compel" | "comfy++" | "down_weight" | NodeLink
    ["balance"]?: number | NodeLink
}) => {
    if (input["balance"] === undefined) input["balance"] = 0.5
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CLIPTextEncodeSDXLAdvanced", node, input)
    return node
}

export const BNK_AddCLIPSDXLParams = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["crop_w"]?: number | NodeLink
    ["crop_h"]?: number | NodeLink
    ["target_width"]?: number | NodeLink
    ["target_height"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 1024
    if (input["height"] === undefined) input["height"] = 1024
    if (input["crop_w"] === undefined) input["crop_w"] = 0
    if (input["crop_h"] === undefined) input["crop_h"] = 0
    if (input["target_width"] === undefined) input["target_width"] = 1024
    if (input["target_height"] === undefined) input["target_height"] = 1024
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_AddCLIPSDXLParams", node, input)
    return node
}

export const BNK_AddCLIPSDXLRParams = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["width"]?: number | NodeLink
    ["height"]?: number | NodeLink
    ["ascore"]?: number | NodeLink
}) => {
    if (input["width"] === undefined) input["width"] = 1024
    if (input["height"] === undefined) input["height"] = 1024
    if (input["ascore"] === undefined) input["ascore"] = 6
    const node = {
        ["CONDITIONING0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_AddCLIPSDXLRParams", node, input)
    return node
}

export const FaceSwapNode = (input: {
    ["face"]: "IMAGE" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["source_face_index"]?: number | NodeLink
    ["target_face_indices"]: string | NodeLink
    ["blend"]?: number | NodeLink
    ["expression_multiplier"]?: number | NodeLink
    ["expression_pow"]?: number | NodeLink
}) => {
    if (input["source_face_index"] === undefined) input["source_face_index"] = 0
    if (input["blend"] === undefined) input["blend"] = 1
    if (input["expression_multiplier"] === undefined) input["expression_multiplier"] = 0
    if (input["expression_pow"] === undefined) input["expression_pow"] = 1
    const node = {
        ["IMAGE0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FaceSwapNode", node, input)
    return node
}

export const BNK_TiledKSamplerAdvanced = (input: {
    ["model"]: "MODEL" | NodeLink
    ["add_noise"]: "enable" | "disable" | NodeLink
    ["noise_seed"]?: number | NodeLink
    ["tile_width"]?: number | NodeLink
    ["tile_height"]?: number | NodeLink
    ["tiling_strategy"]: "random" | "random strict" | "padded" | "simple" | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["start_at_step"]?: number | NodeLink
    ["end_at_step"]?: number | NodeLink
    ["return_with_leftover_noise"]: "disable" | "enable" | NodeLink
    ["preview"]: "disable" | "enable" | NodeLink
}) => {
    if (input["noise_seed"] === undefined) input["noise_seed"] = 0
    if (input["tile_width"] === undefined) input["tile_width"] = 512
    if (input["tile_height"] === undefined) input["tile_height"] = 512
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["start_at_step"] === undefined) input["start_at_step"] = 0
    if (input["end_at_step"] === undefined) input["end_at_step"] = 10000
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_TiledKSamplerAdvanced", node, input)
    return node
}

export const BNK_TiledKSampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]?: number | NodeLink
    ["tile_width"]?: number | NodeLink
    ["tile_height"]?: number | NodeLink
    ["tiling_strategy"]: "random" | "random strict" | "padded" | "simple" | NodeLink
    ["steps"]?: number | NodeLink
    ["cfg"]?: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]?: number | NodeLink
}) => {
    if (input["seed"] === undefined) input["seed"] = 0
    if (input["tile_width"] === undefined) input["tile_width"] = 512
    if (input["tile_height"] === undefined) input["tile_height"] = 512
    if (input["steps"] === undefined) input["steps"] = 20
    if (input["cfg"] === undefined) input["cfg"] = 8
    if (input["denoise"] === undefined) input["denoise"] = 1
    const node = {
        ["LATENT0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_TiledKSampler", node, input)
    return node
}

export const ModelMergeBlockNumber = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["time_embed."]?: number | NodeLink
    ["label_emb."]?: number | NodeLink
    ["input_blocks.0."]?: number | NodeLink
    ["input_blocks.1."]?: number | NodeLink
    ["input_blocks.2."]?: number | NodeLink
    ["input_blocks.3."]?: number | NodeLink
    ["input_blocks.4."]?: number | NodeLink
    ["input_blocks.5."]?: number | NodeLink
    ["input_blocks.6."]?: number | NodeLink
    ["input_blocks.7."]?: number | NodeLink
    ["input_blocks.8."]?: number | NodeLink
    ["input_blocks.9."]?: number | NodeLink
    ["input_blocks.10."]?: number | NodeLink
    ["input_blocks.11."]?: number | NodeLink
    ["middle_block.0."]?: number | NodeLink
    ["middle_block.1."]?: number | NodeLink
    ["middle_block.2."]?: number | NodeLink
    ["output_blocks.0."]?: number | NodeLink
    ["output_blocks.1."]?: number | NodeLink
    ["output_blocks.2."]?: number | NodeLink
    ["output_blocks.3."]?: number | NodeLink
    ["output_blocks.4."]?: number | NodeLink
    ["output_blocks.5."]?: number | NodeLink
    ["output_blocks.6."]?: number | NodeLink
    ["output_blocks.7."]?: number | NodeLink
    ["output_blocks.8."]?: number | NodeLink
    ["output_blocks.9."]?: number | NodeLink
    ["output_blocks.10."]?: number | NodeLink
    ["output_blocks.11."]?: number | NodeLink
    ["out."]?: number | NodeLink
}) => {
    if (input["time_embed."] === undefined) input["time_embed."] = 1
    if (input["label_emb."] === undefined) input["label_emb."] = 1
    if (input["input_blocks.0."] === undefined) input["input_blocks.0."] = 1
    if (input["input_blocks.1."] === undefined) input["input_blocks.1."] = 1
    if (input["input_blocks.2."] === undefined) input["input_blocks.2."] = 1
    if (input["input_blocks.3."] === undefined) input["input_blocks.3."] = 1
    if (input["input_blocks.4."] === undefined) input["input_blocks.4."] = 1
    if (input["input_blocks.5."] === undefined) input["input_blocks.5."] = 1
    if (input["input_blocks.6."] === undefined) input["input_blocks.6."] = 1
    if (input["input_blocks.7."] === undefined) input["input_blocks.7."] = 1
    if (input["input_blocks.8."] === undefined) input["input_blocks.8."] = 1
    if (input["input_blocks.9."] === undefined) input["input_blocks.9."] = 1
    if (input["input_blocks.10."] === undefined) input["input_blocks.10."] = 1
    if (input["input_blocks.11."] === undefined) input["input_blocks.11."] = 1
    if (input["middle_block.0."] === undefined) input["middle_block.0."] = 1
    if (input["middle_block.1."] === undefined) input["middle_block.1."] = 1
    if (input["middle_block.2."] === undefined) input["middle_block.2."] = 1
    if (input["output_blocks.0."] === undefined) input["output_blocks.0."] = 1
    if (input["output_blocks.1."] === undefined) input["output_blocks.1."] = 1
    if (input["output_blocks.2."] === undefined) input["output_blocks.2."] = 1
    if (input["output_blocks.3."] === undefined) input["output_blocks.3."] = 1
    if (input["output_blocks.4."] === undefined) input["output_blocks.4."] = 1
    if (input["output_blocks.5."] === undefined) input["output_blocks.5."] = 1
    if (input["output_blocks.6."] === undefined) input["output_blocks.6."] = 1
    if (input["output_blocks.7."] === undefined) input["output_blocks.7."] = 1
    if (input["output_blocks.8."] === undefined) input["output_blocks.8."] = 1
    if (input["output_blocks.9."] === undefined) input["output_blocks.9."] = 1
    if (input["output_blocks.10."] === undefined) input["output_blocks.10."] = 1
    if (input["output_blocks.11."] === undefined) input["output_blocks.11."] = 1
    if (input["out."] === undefined) input["out."] = 1
    const node = {
        ["MODEL0"]: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeBlockNumber", node, input)
    return node
}
