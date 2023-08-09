export type NodeLink = [string, number]

let id = 0
let workflow = { version: 0.4, nodes: [], output: {} }

const StartNodeContext = () => {
    id = 0
    workflow = { version: 0.4, nodes: [], output: {} }
}

const EndNodeContext = () => {
    return workflow
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

export const BuildWorkflow = (fn: () => void) => {
    StartNodeContext()
    fn()
    return EndNodeContext()
}

export const KSampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]: number | NodeLink
    ["steps"]: number | NodeLink
    ["cfg"]: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSampler", node, input)
    return node
}

export const CheckpointLoaderSimple = (input: { ["ckpt_name"]: string | NodeLink }) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        CLIP1: [id.toString(), 1] as NodeLink,
        VAE2: [id.toString(), 2] as NodeLink,
    } as const
    addNode("CheckpointLoaderSimple", node, input)
    return node
}

export const CLIPTextEncode = (input: {
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncode", node, input)
    return node
}

export const CLIPSetLastLayer = (input: {
    ["clip"]: "CLIP" | NodeLink
    ["stop_at_clip_layer"]: number | NodeLink
}) => {
    const node = {
        CLIP0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPSetLastLayer", node, input)
    return node
}

export const VAEDecode = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEDecode", node, input)
    return node
}

export const VAEEncode = (input: { ["pixels"]: "IMAGE" | NodeLink; ["vae"]: "VAE" | NodeLink }) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncode", node, input)
    return node
}

export const VAEEncodeForInpaint = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["grow_mask_by"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncodeForInpaint", node, input)
    return node
}

export const VAELoader = (input: { ["vae_name"]: string | NodeLink }) => {
    const node = {
        VAE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAELoader", node, input)
    return node
}

export const EmptyLatentImage = (input: {
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["batch_size"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("EmptyLatentImage", node, input)
    return node
}

export const LatentUpscale = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["crop"]: "disabled" | "center" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentUpscale", node, input)
    return node
}

export const LatentUpscaleBy = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | NodeLink
    ["scale_by"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentUpscaleBy", node, input)
    return node
}

export const LatentFromBatch = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["batch_index"]: number | NodeLink
    ["length"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentFromBatch", node, input)
    return node
}

export const RepeatLatentBatch = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["amount"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RepeatLatentBatch", node, input)
    return node
}

export const SaveImage = (input: {
    ["images"]: "IMAGE" | NodeLink
    ["filename_prefix"]: string | NodeLink
}) => {
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
        IMAGE0: [id.toString(), 0] as NodeLink,
        MASK1: [id.toString(), 1] as NodeLink,
    } as const
    addNode("LoadImage", node, input)
    return node
}

export const LoadImageMask = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["channel"]: "alpha" | "red" | "green" | "blue" | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LoadImageMask", node, input)
    return node
}

export const ImageScale = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["crop"]: "disabled" | "center" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageScale", node, input)
    return node
}

export const ImageScaleBy = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | NodeLink
    ["scale_by"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageScaleBy", node, input)
    return node
}

export const ImageInvert = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageInvert", node, input)
    return node
}

export const ImagePadForOutpaint = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["left"]: number | NodeLink
    ["top"]: number | NodeLink
    ["right"]: number | NodeLink
    ["bottom"]: number | NodeLink
    ["feathering"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
        MASK1: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ImagePadForOutpaint", node, input)
    return node
}

export const ConditioningAverage_ = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
    ["conditioning_to_strength"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningAverage ", node, input)
    return node
}

export const ConditioningCombine = (input: {
    ["conditioning_1"]: "CONDITIONING" | NodeLink
    ["conditioning_2"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningCombine", node, input)
    return node
}

export const ConditioningConcat = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningConcat", node, input)
    return node
}

export const ConditioningSetArea = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
    ["strength"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetArea", node, input)
    return node
}

export const ConditioningSetMask = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["strength"]: number | NodeLink
    ["set_cond_area"]: "default" | "mask bounds" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetMask", node, input)
    return node
}

export const KSamplerAdvanced = (input: {
    ["model"]: "MODEL" | NodeLink
    ["add_noise"]: "enable" | "disable" | NodeLink
    ["noise_seed"]: number | NodeLink
    ["steps"]: number | NodeLink
    ["cfg"]: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["start_at_step"]: number | NodeLink
    ["end_at_step"]: number | NodeLink
    ["return_with_leftover_noise"]: "disable" | "enable" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KSamplerAdvanced", node, input)
    return node
}

export const SetLatentNoiseMask = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SetLatentNoiseMask", node, input)
    return node
}

export const LatentComposite = (input: {
    ["samples_to"]: "LATENT" | NodeLink
    ["samples_from"]: "LATENT" | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
    ["feather"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentComposite", node, input)
    return node
}

export const LatentBlend = (input: {
    ["samples1"]: "LATENT" | NodeLink
    ["samples2"]: "LATENT" | NodeLink
    ["blend_factor"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentBlend", node, input)
    return node
}

export const LatentRotate = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["rotation"]: "none" | "90 degrees" | "180 degrees" | "270 degrees" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentRotate", node, input)
    return node
}

export const LatentFlip = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["flip_method"]: "x-axis: vertically" | "y-axis: horizontally" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentFlip", node, input)
    return node
}

export const LatentCrop = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentCrop", node, input)
    return node
}

export const LoraLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["lora_name"]: string | NodeLink
    ["strength_model"]: number | NodeLink
    ["strength_clip"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        CLIP1: [id.toString(), 1] as NodeLink,
    } as const
    addNode("LoraLoader", node, input)
    return node
}

export const CLIPLoader = (input: { ["clip_name"]: string | NodeLink }) => {
    const node = {
        CLIP0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPLoader", node, input)
    return node
}

export const UNETLoader = (input: { ["unet_name"]: string | NodeLink }) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UNETLoader", node, input)
    return node
}

export const DualCLIPLoader = (input: {
    ["clip_name1"]: any | NodeLink
    ["clip_name2"]: any | NodeLink
}) => {
    const node = {
        CLIP0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DualCLIPLoader", node, input)
    return node
}

export const CLIPVisionEncode = (input: {
    ["clip_vision"]: "CLIP_VISION" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        CLIP_VISION_OUTPUT0: [id.toString(), 0] as NodeLink,
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
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("StyleModelApply", node, input)
    return node
}

export const unCLIPConditioning = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["clip_vision_output"]: "CLIP_VISION_OUTPUT" | NodeLink
    ["strength"]: number | NodeLink
    ["noise_augmentation"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("unCLIPConditioning", node, input)
    return node
}

export const ControlNetApply = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["control_net"]: "CONTROL_NET" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["strength"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ControlNetApply", node, input)
    return node
}

export const ControlNetApplyAdvanced = (input: {
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["control_net"]: "CONTROL_NET" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
    ["strength"]: number | NodeLink
    ["start_percent"]: number | NodeLink
    ["end_percent"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
        CONDITIONING1: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ControlNetApplyAdvanced", node, input)
    return node
}

export const ControlNetLoader = (input: { ["control_net_name"]: string | NodeLink }) => {
    const node = {
        CONTROL_NET0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ControlNetLoader", node, input)
    return node
}

export const DiffControlNetLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["control_net_name"]: string | NodeLink
}) => {
    const node = {
        CONTROL_NET0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("DiffControlNetLoader", node, input)
    return node
}

export const StyleModelLoader = (input: { ["style_model_name"]: string | NodeLink }) => {
    const node = {
        STYLE_MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("StyleModelLoader", node, input)
    return node
}

export const CLIPVisionLoader = (input: { ["clip_name"]: string | NodeLink }) => {
    const node = {
        CLIP_VISION0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPVisionLoader", node, input)
    return node
}

export const VAEDecodeTiled = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEDecodeTiled", node, input)
    return node
}

export const VAEEncodeTiled = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("VAEEncodeTiled", node, input)
    return node
}

export const unCLIPCheckpointLoader = (input: { ["ckpt_name"]: string | NodeLink }) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        CLIP1: [id.toString(), 1] as NodeLink,
        VAE2: [id.toString(), 2] as NodeLink,
        CLIP_VISION3: [id.toString(), 3] as NodeLink,
    } as const
    addNode("unCLIPCheckpointLoader", node, input)
    return node
}

export const GLIGENLoader = (input: { ["gligen_name"]: string | NodeLink }) => {
    const node = {
        GLIGEN0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("GLIGENLoader", node, input)
    return node
}

export const GLIGENTextBoxApply = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["gligen_textbox_model"]: "GLIGEN" | NodeLink
    ["text"]: string | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("GLIGENTextBoxApply", node, input)
    return node
}

export const CheckpointLoader = (input: {
    ["config_name"]: string | NodeLink
    ["ckpt_name"]: string | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        CLIP1: [id.toString(), 1] as NodeLink,
        VAE2: [id.toString(), 2] as NodeLink,
    } as const
    addNode("CheckpointLoader", node, input)
    return node
}

export const DiffusersLoader = (input: { ["model_path"]: any | NodeLink }) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        CLIP1: [id.toString(), 1] as NodeLink,
        VAE2: [id.toString(), 2] as NodeLink,
    } as const
    addNode("DiffusersLoader", node, input)
    return node
}

export const LoadLatent = (input: { ["latent"]: any | NodeLink }) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LoadLatent", node, input)
    return node
}

export const SaveLatent = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["filename_prefix"]: string | NodeLink
}) => {
    const node = {} as const
    addNode("SaveLatent", node, input)
    return node
}

export const ConditioningZeroOut = (input: { ["conditioning"]: "CONDITIONING" | NodeLink }) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningZeroOut", node, input)
    return node
}

export const ConditioningSetTimestepRange = (input: {
    ["conditioning"]: "CONDITIONING" | NodeLink
    ["start"]: number | NodeLink
    ["end"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConditioningSetTimestepRange", node, input)
    return node
}

export const HypernetworkLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["hypernetwork_name"]: string | NodeLink
    ["strength"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("HypernetworkLoader", node, input)
    return node
}

export const UpscaleModelLoader = (input: { ["model_name"]: string | NodeLink }) => {
    const node = {
        UPSCALE_MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UpscaleModelLoader", node, input)
    return node
}

export const ImageUpscaleWithModel = (input: {
    ["upscale_model"]: "UPSCALE_MODEL" | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageUpscaleWithModel", node, input)
    return node
}

export const ImageBlend = (input: {
    ["image1"]: "IMAGE" | NodeLink
    ["image2"]: "IMAGE" | NodeLink
    ["blend_factor"]: number | NodeLink
    ["blend_mode"]: "normal" | "multiply" | "screen" | "overlay" | "soft_light" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageBlend", node, input)
    return node
}

export const ImageBlur = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["blur_radius"]: number | NodeLink
    ["sigma"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageBlur", node, input)
    return node
}

export const ImageQuantize = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["colors"]: number | NodeLink
    ["dither"]: "none" | "floyd-steinberg" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageQuantize", node, input)
    return node
}

export const ImageSharpen = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["sharpen_radius"]: number | NodeLink
    ["sigma"]: number | NodeLink
    ["alpha"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageSharpen", node, input)
    return node
}

export const LatentCompositeMasked = (input: {
    ["destination"]: "LATENT" | NodeLink
    ["source"]: "LATENT" | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
    ["mask"]?: "MASK" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LatentCompositeMasked", node, input)
    return node
}

export const MaskToImage = (input: { ["mask"]: "MASK" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MaskToImage", node, input)
    return node
}

export const ImageToMask = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["channel"]: "red" | "green" | "blue" | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ImageToMask", node, input)
    return node
}

export const SolidMask = (input: {
    ["value"]: number | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SolidMask", node, input)
    return node
}

export const InvertMask = (input: { ["mask"]: "MASK" | NodeLink }) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("InvertMask", node, input)
    return node
}

export const CropMask = (input: {
    ["mask"]: "MASK" | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CropMask", node, input)
    return node
}

export const MaskComposite = (input: {
    ["destination"]: "MASK" | NodeLink
    ["source"]: "MASK" | NodeLink
    ["x"]: number | NodeLink
    ["y"]: number | NodeLink
    ["operation"]: "multiply" | "add" | "subtract" | "and" | "or" | "xor" | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MaskComposite", node, input)
    return node
}

export const FeatherMask = (input: {
    ["mask"]: "MASK" | NodeLink
    ["left"]: number | NodeLink
    ["top"]: number | NodeLink
    ["right"]: number | NodeLink
    ["bottom"]: number | NodeLink
}) => {
    const node = {
        MASK0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FeatherMask", node, input)
    return node
}

export const RebatchLatents = (input: {
    ["latents"]: "LATENT" | NodeLink
    ["batch_size"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RebatchLatents", node, input)
    return node
}

export const ModelMergeSimple = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["ratio"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeSimple", node, input)
    return node
}

export const ModelMergeBlocks = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["input"]: number | NodeLink
    ["middle"]: number | NodeLink
    ["out"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeBlocks", node, input)
    return node
}

export const CheckpointSave = (input: {
    ["model"]: "MODEL" | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["filename_prefix"]: string | NodeLink
}) => {
    const node = {} as const
    addNode("CheckpointSave", node, input)
    return node
}

export const CLIPMergeSimple = (input: {
    ["clip1"]: "CLIP" | NodeLink
    ["clip2"]: "CLIP" | NodeLink
    ["ratio"]: number | NodeLink
}) => {
    const node = {
        CLIP0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPMergeSimple", node, input)
    return node
}

export const TomePatchModel = (input: {
    ["model"]: "MODEL" | NodeLink
    ["ratio"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TomePatchModel", node, input)
    return node
}

export const CLIPTextEncodeSDXLRefiner = (input: {
    ["ascore"]: number | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncodeSDXLRefiner", node, input)
    return node
}

export const CLIPTextEncodeSDXL = (input: {
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["crop_w"]: number | NodeLink
    ["crop_h"]: number | NodeLink
    ["target_width"]: number | NodeLink
    ["target_height"]: number | NodeLink
    ["text_g"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
    ["text_l"]: string | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CLIPTextEncodeSDXL", node, input)
    return node
}

export const Canny = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["low_threshold"]: number | NodeLink
    ["high_threshold"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Canny", node, input)
    return node
}

export const ReferenceOnlySimple = (input: {
    ["model"]: "MODEL" | NodeLink
    ["reference"]: "LATENT" | NodeLink
    ["batch_size"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
        LATENT1: [id.toString(), 1] as NodeLink,
    } as const
    addNode("ReferenceOnlySimple", node, input)
    return node
}

export const RescaleClassifierFreeGuidanceTest = (input: {
    ["model"]: "MODEL" | NodeLink
    ["multiplier"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("RescaleClassifierFreeGuidanceTest", node, input)
    return node
}

export const RecommendedResCalc = (input: {
    ["desiredXSIZE"]: number | NodeLink
    ["desiredYSIZE"]: number | NodeLink
}) => {
    const node = {
        INT0: [id.toString(), 0] as NodeLink,
        INT1: [id.toString(), 1] as NodeLink,
        FLOAT2: [id.toString(), 2] as NodeLink,
        FLOAT3: [id.toString(), 3] as NodeLink,
    } as const
    addNode("RecommendedResCalc", node, input)
    return node
}

export const ModelSamplerTonemapNoiseTest = (input: {
    ["model"]: "MODEL" | NodeLink
    ["multiplier"]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelSamplerTonemapNoiseTest", node, input)
    return node
}

export const SEECoderImageEncode = (input: {
    ["seecoder_name"]: string | NodeLink
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SEECoderImageEncode", node, input)
    return node
}

export const ConcatConditioning = (input: {
    ["conditioning_to"]: "CONDITIONING" | NodeLink
    ["conditioning_from"]: "CONDITIONING" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ConcatConditioning", node, input)
    return node
}

export const CannyEdgePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["low_threshold"]: number | NodeLink
    ["high_threshold"]: number | NodeLink
    ["l2gradient"]: "disable" | "enable" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("CannyEdgePreprocessor", node, input)
    return node
}

export const M_LSDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["score_threshold"]: number | NodeLink
    ["dist_threshold"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("M-LSDPreprocessor", node, input)
    return node
}

export const HEDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["version"]: "v1" | "v1.1" | NodeLink
    ["safe"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("HEDPreprocessor", node, input)
    return node
}

export const ScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ScribblePreprocessor", node, input)
    return node
}

export const FakeScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("FakeScribblePreprocessor", node, input)
    return node
}

export const BinaryPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["threshold"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BinaryPreprocessor", node, input)
    return node
}

export const PiDiNetPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["safe"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("PiDiNetPreprocessor", node, input)
    return node
}

export const LineArtPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["coarse"]: "disable" | "enable" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LineArtPreprocessor", node, input)
    return node
}

export const AnimeLineArtPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AnimeLineArtPreprocessor", node, input)
    return node
}

export const Manga2Anime_LineArtPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Manga2Anime-LineArtPreprocessor", node, input)
    return node
}

export const MiDaS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["a"]: number | NodeLink
    ["bg_threshold"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MiDaS-DepthMapPreprocessor", node, input)
    return node
}

export const MiDaS_NormalMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["a"]: number | NodeLink
    ["bg_threshold"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MiDaS-NormalMapPreprocessor", node, input)
    return node
}

export const LeReS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["rm_nearest"]: number | NodeLink
    ["rm_background"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("LeReS-DepthMapPreprocessor", node, input)
    return node
}

export const Zoe_DepthMapPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("Zoe-DepthMapPreprocessor", node, input)
    return node
}

export const BAE_NormalMapPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BAE-NormalMapPreprocessor", node, input)
    return node
}

export const OpenposePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["detect_hand"]: "enable" | "disable" | NodeLink
    ["detect_body"]: "enable" | "disable" | NodeLink
    ["detect_face"]: "enable" | "disable" | NodeLink
    ["version"]: "v1" | "v1.1" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OpenposePreprocessor", node, input)
    return node
}

export const MediaPipe_HandPosePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["detect_pose"]: "enable" | "disable" | NodeLink
    ["detect_hands"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MediaPipe-HandPosePreprocessor", node, input)
    return node
}

export const SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("SemSegPreprocessor", node, input)
    return node
}

export const UniFormer_SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("UniFormer-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_COCO_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OneFormer-COCO-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_ADE20K_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("OneFormer-ADE20K-SemSegPreprocessor", node, input)
    return node
}

export const MediaPipe_FaceMeshPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["max_faces"]: number | NodeLink
    ["min_confidence"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("MediaPipe-FaceMeshPreprocessor", node, input)
    return node
}

export const ColorPreprocessor = (input: { ["image"]: string | "IMAGE" | NodeLink }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ColorPreprocessor", node, input)
    return node
}

export const TilePreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["pyrUp_iters"]: number | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("TilePreprocessor", node, input)
    return node
}

export const InpaintPreprocessor = (input: {
    ["image"]: string | "IMAGE" | NodeLink
    ["mask"]: "MASK" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("InpaintPreprocessor", node, input)
    return node
}

export const BNK_CutoffBasePrompt = (input: {
    ["text"]: string | NodeLink
    ["clip"]: "CLIP" | NodeLink
}) => {
    const node = {
        CLIPREGION0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CutoffBasePrompt", node, input)
    return node
}

export const BNK_CutoffSetRegions = (input: {
    ["clip_regions"]: "CLIPREGION" | NodeLink
    ["region_text"]: string | NodeLink
    ["target_text"]: string | NodeLink
    ["weight"]: number | NodeLink
}) => {
    const node = {
        CLIPREGION0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CutoffSetRegions", node, input)
    return node
}

export const BNK_CutoffRegionsToConditioning = (input: {
    ["clip_regions"]: "CLIPREGION" | NodeLink
    ["mask_token"]: string | NodeLink
    ["strict_mask"]: number | NodeLink
    ["start_from_masked"]: number | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CutoffRegionsToConditioning", node, input)
    return node
}

export const BNK_CutoffRegionsToConditioning_ADV = (input: {
    ["clip_regions"]: "CLIPREGION" | NodeLink
    ["mask_token"]: string | NodeLink
    ["strict_mask"]: number | NodeLink
    ["start_from_masked"]: number | NodeLink
    ["token_normalization"]: "none" | "mean" | "length" | "length+mean" | NodeLink
    ["weight_interpretation"]: "comfy" | "A1111" | "compel" | "comfy++" | NodeLink
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("BNK_CutoffRegionsToConditioning_ADV", node, input)
    return node
}

export const KRestartSamplerSimple = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]: number | NodeLink
    ["steps"]: number | NodeLink
    ["cfg"]: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]: number | NodeLink
    ["segments"]: string | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KRestartSamplerSimple", node, input)
    return node
}

export const KRestartSampler = (input: {
    ["model"]: "MODEL" | NodeLink
    ["seed"]: number | NodeLink
    ["steps"]: number | NodeLink
    ["cfg"]: number | NodeLink
    ["sampler_name"]: string | NodeLink
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | NodeLink
    ["positive"]: "CONDITIONING" | NodeLink
    ["negative"]: "CONDITIONING" | NodeLink
    ["latent_image"]: "LATENT" | NodeLink
    ["denoise"]: number | NodeLink
    ["segments"]: string | NodeLink
    ["restart_scheduler"]:
        | "normal"
        | "karras"
        | "exponential"
        | "simple"
        | "ddim_uniform"
        | "simple_test"
        | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("KRestartSampler", node, input)
    return node
}

export const AITemplateLoader = (input: {
    ["model"]: "MODEL" | NodeLink
    ["keep_loaded"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateLoader", node, input)
    return node
}

export const AITemplateControlNetLoader = (input: {
    ["control_net"]: "CONTROL_NET" | NodeLink
    ["keep_loaded"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        CONTROL_NET0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateControlNetLoader", node, input)
    return node
}

export const AITemplateVAEDecode = (input: {
    ["vae"]: "VAE" | NodeLink
    ["keep_loaded"]: "enable" | "disable" | NodeLink
    ["samples"]: "LATENT" | NodeLink
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateVAEDecode", node, input)
    return node
}

export const AITemplateVAEEncode = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["keep_loaded"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateVAEEncode", node, input)
    return node
}

export const AITemplateVAEEncodeForInpaint = (input: {
    ["pixels"]: "IMAGE" | NodeLink
    ["vae"]: "VAE" | NodeLink
    ["mask"]: "MASK" | NodeLink
    ["grow_mask_by"]: number | NodeLink
    ["keep_loaded"]: "enable" | "disable" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateVAEEncodeForInpaint", node, input)
    return node
}

export const AITemplateEmptyLatentImage = (input: {
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["batch_size"]: number | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateEmptyLatentImage", node, input)
    return node
}

export const AITemplateLatentUpscale = (input: {
    ["samples"]: "LATENT" | NodeLink
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | NodeLink
    ["width"]: number | NodeLink
    ["height"]: number | NodeLink
    ["crop"]: "disabled" | "center" | NodeLink
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("AITemplateLatentUpscale", node, input)
    return node
}

export const ModelMergeBlockNumber = (input: {
    ["model1"]: "MODEL" | NodeLink
    ["model2"]: "MODEL" | NodeLink
    ["time_embed."]: number | NodeLink
    ["label_emb."]: number | NodeLink
    ["input_blocks.0."]: number | NodeLink
    ["input_blocks.1."]: number | NodeLink
    ["input_blocks.2."]: number | NodeLink
    ["input_blocks.3."]: number | NodeLink
    ["input_blocks.4."]: number | NodeLink
    ["input_blocks.5."]: number | NodeLink
    ["input_blocks.6."]: number | NodeLink
    ["input_blocks.7."]: number | NodeLink
    ["input_blocks.8."]: number | NodeLink
    ["input_blocks.9."]: number | NodeLink
    ["input_blocks.10."]: number | NodeLink
    ["input_blocks.11."]: number | NodeLink
    ["middle_block.0."]: number | NodeLink
    ["middle_block.1."]: number | NodeLink
    ["middle_block.2."]: number | NodeLink
    ["output_blocks.0."]: number | NodeLink
    ["output_blocks.1."]: number | NodeLink
    ["output_blocks.2."]: number | NodeLink
    ["output_blocks.3."]: number | NodeLink
    ["output_blocks.4."]: number | NodeLink
    ["output_blocks.5."]: number | NodeLink
    ["output_blocks.6."]: number | NodeLink
    ["output_blocks.7."]: number | NodeLink
    ["output_blocks.8."]: number | NodeLink
    ["output_blocks.9."]: number | NodeLink
    ["output_blocks.10."]: number | NodeLink
    ["output_blocks.11."]: number | NodeLink
    ["out."]: number | NodeLink
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as NodeLink,
    } as const
    addNode("ModelMergeBlockNumber", node, input)
    return node
}
