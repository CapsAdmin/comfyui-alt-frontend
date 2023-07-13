type Link = [string, number]

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
    ["model"]: "MODEL" | Link
    ["seed"]: number | Link
    ["steps"]: number | Link
    ["cfg"]: number | Link
    ["sampler_name"]: string | Link
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | Link
    ["positive"]: "CONDITIONING" | Link
    ["negative"]: "CONDITIONING" | Link
    ["latent_image"]: "LATENT" | Link
    ["denoise"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("KSampler", node, input)
    return node
}

export const CheckpointLoaderSimple = (input: { ["ckpt_name"]: string | Link }) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
        CLIP1: [id.toString(), 1] as Link,
        VAE2: [id.toString(), 2] as Link,
    } as const
    addNode("CheckpointLoaderSimple", node, input)
    return node
}

export const CLIPTextEncode = (input: { ["text"]: string | Link; ["clip"]: "CLIP" | Link }) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPTextEncode", node, input)
    return node
}

export const CLIPSetLastLayer = (input: {
    ["clip"]: "CLIP" | Link
    ["stop_at_clip_layer"]: number | Link
}) => {
    const node = {
        CLIP0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPSetLastLayer", node, input)
    return node
}

export const VAEDecode = (input: { ["samples"]: "LATENT" | Link; ["vae"]: "VAE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("VAEDecode", node, input)
    return node
}

export const VAEEncode = (input: { ["pixels"]: "IMAGE" | Link; ["vae"]: "VAE" | Link }) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("VAEEncode", node, input)
    return node
}

export const VAEEncodeForInpaint = (input: {
    ["pixels"]: "IMAGE" | Link
    ["vae"]: "VAE" | Link
    ["mask"]: "MASK" | Link
    ["grow_mask_by"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("VAEEncodeForInpaint", node, input)
    return node
}

export const VAELoader = (input: { ["vae_name"]: string | Link }) => {
    const node = {
        VAE0: [id.toString(), 0] as Link,
    } as const
    addNode("VAELoader", node, input)
    return node
}

export const EmptyLatentImage = (input: {
    ["width"]: number | Link
    ["height"]: number | Link
    ["batch_size"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("EmptyLatentImage", node, input)
    return node
}

export const LatentUpscale = (input: {
    ["samples"]: "LATENT" | Link
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["crop"]: "disabled" | "center" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentUpscale", node, input)
    return node
}

export const LatentUpscaleBy = (input: {
    ["samples"]: "LATENT" | Link
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | "bislerp" | Link
    ["scale_by"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentUpscaleBy", node, input)
    return node
}

export const LatentFromBatch = (input: {
    ["samples"]: "LATENT" | Link
    ["batch_index"]: number | Link
    ["length"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentFromBatch", node, input)
    return node
}

export const RepeatLatentBatch = (input: {
    ["samples"]: "LATENT" | Link
    ["amount"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("RepeatLatentBatch", node, input)
    return node
}

export const SaveImage = (input: {
    ["images"]: "IMAGE" | Link
    ["filename_prefix"]: string | Link
}) => {
    const node = {} as const
    addNode("SaveImage", node, input)
    return node
}

export const PreviewImage = (input: { ["images"]: "IMAGE" | Link }) => {
    const node = {} as const
    addNode("PreviewImage", node, input)
    return node
}

export const LoadImage = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
        MASK1: [id.toString(), 1] as Link,
    } as const
    addNode("LoadImage", node, input)
    return node
}

export const LoadImageMask = (input: {
    ["image"]: string | "IMAGE" | Link
    ["channel"]: "alpha" | "red" | "green" | "blue" | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("LoadImageMask", node, input)
    return node
}

export const ImageScale = (input: {
    ["image"]: string | "IMAGE" | Link
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["crop"]: "disabled" | "center" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageScale", node, input)
    return node
}

export const ImageScaleBy = (input: {
    ["image"]: string | "IMAGE" | Link
    ["upscale_method"]: "nearest-exact" | "bilinear" | "area" | "bicubic" | Link
    ["scale_by"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageScaleBy", node, input)
    return node
}

export const ImageInvert = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageInvert", node, input)
    return node
}

export const ImagePadForOutpaint = (input: {
    ["image"]: string | "IMAGE" | Link
    ["left"]: number | Link
    ["top"]: number | Link
    ["right"]: number | Link
    ["bottom"]: number | Link
    ["feathering"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
        MASK1: [id.toString(), 1] as Link,
    } as const
    addNode("ImagePadForOutpaint", node, input)
    return node
}

export const ConditioningAverage_ = (input: {
    ["conditioning_to"]: "CONDITIONING" | Link
    ["conditioning_from"]: "CONDITIONING" | Link
    ["conditioning_to_strength"]: number | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningAverage ", node, input)
    return node
}

export const ConditioningCombine = (input: {
    ["conditioning_1"]: "CONDITIONING" | Link
    ["conditioning_2"]: "CONDITIONING" | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningCombine", node, input)
    return node
}

export const ConditioningSetArea = (input: {
    ["conditioning"]: "CONDITIONING" | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["x"]: number | Link
    ["y"]: number | Link
    ["strength"]: number | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningSetArea", node, input)
    return node
}

export const ConditioningSetMask = (input: {
    ["conditioning"]: "CONDITIONING" | Link
    ["mask"]: "MASK" | Link
    ["strength"]: number | Link
    ["set_cond_area"]: "default" | "mask bounds" | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningSetMask", node, input)
    return node
}

export const KSamplerAdvanced = (input: {
    ["model"]: "MODEL" | Link
    ["add_noise"]: "enable" | "disable" | Link
    ["noise_seed"]: number | Link
    ["steps"]: number | Link
    ["cfg"]: number | Link
    ["sampler_name"]: string | Link
    ["scheduler"]: "normal" | "karras" | "exponential" | "simple" | "ddim_uniform" | Link
    ["positive"]: "CONDITIONING" | Link
    ["negative"]: "CONDITIONING" | Link
    ["latent_image"]: "LATENT" | Link
    ["start_at_step"]: number | Link
    ["end_at_step"]: number | Link
    ["return_with_leftover_noise"]: "disable" | "enable" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("KSamplerAdvanced", node, input)
    return node
}

export const SetLatentNoiseMask = (input: {
    ["samples"]: "LATENT" | Link
    ["mask"]: "MASK" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("SetLatentNoiseMask", node, input)
    return node
}

export const LatentComposite = (input: {
    ["samples_to"]: "LATENT" | Link
    ["samples_from"]: "LATENT" | Link
    ["x"]: number | Link
    ["y"]: number | Link
    ["feather"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentComposite", node, input)
    return node
}

export const LatentRotate = (input: {
    ["samples"]: "LATENT" | Link
    ["rotation"]: "none" | "90 degrees" | "180 degrees" | "270 degrees" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentRotate", node, input)
    return node
}

export const LatentFlip = (input: {
    ["samples"]: "LATENT" | Link
    ["flip_method"]: "x-axis: vertically" | "y-axis: horizontally" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentFlip", node, input)
    return node
}

export const LatentCrop = (input: {
    ["samples"]: "LATENT" | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["x"]: number | Link
    ["y"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentCrop", node, input)
    return node
}

export const LoraLoader = (input: {
    ["model"]: "MODEL" | Link
    ["clip"]: "CLIP" | Link
    ["lora_name"]: string | Link
    ["strength_model"]: number | Link
    ["strength_clip"]: number | Link
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
        CLIP1: [id.toString(), 1] as Link,
    } as const
    addNode("LoraLoader", node, input)
    return node
}

export const CLIPLoader = (input: { ["clip_name"]: string | Link }) => {
    const node = {
        CLIP0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPLoader", node, input)
    return node
}

export const UNETLoader = (input: { ["unet_name"]: string | Link }) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("UNETLoader", node, input)
    return node
}

export const DualCLIPLoader = (input: {
    ["clip_name1"]: any | Link
    ["clip_name2"]: any | Link
}) => {
    const node = {
        CLIP0: [id.toString(), 0] as Link,
    } as const
    addNode("DualCLIPLoader", node, input)
    return node
}

export const CLIPVisionEncode = (input: {
    ["clip_vision"]: "CLIP_VISION" | Link
    ["image"]: string | "IMAGE" | Link
}) => {
    const node = {
        CLIP_VISION_OUTPUT0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPVisionEncode", node, input)
    return node
}

export const StyleModelApply = (input: {
    ["conditioning"]: "CONDITIONING" | Link
    ["style_model"]: "STYLE_MODEL" | Link
    ["clip_vision_output"]: "CLIP_VISION_OUTPUT" | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("StyleModelApply", node, input)
    return node
}

export const unCLIPConditioning = (input: {
    ["conditioning"]: "CONDITIONING" | Link
    ["clip_vision_output"]: "CLIP_VISION_OUTPUT" | Link
    ["strength"]: number | Link
    ["noise_augmentation"]: number | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("unCLIPConditioning", node, input)
    return node
}

export const ControlNetApply = (input: {
    ["conditioning"]: "CONDITIONING" | Link
    ["control_net"]: "CONTROL_NET" | Link
    ["image"]: string | "IMAGE" | Link
    ["strength"]: number | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ControlNetApply", node, input)
    return node
}

export const ControlNetLoader = (input: { ["control_net_name"]: string | Link }) => {
    const node = {
        CONTROL_NET0: [id.toString(), 0] as Link,
    } as const
    addNode("ControlNetLoader", node, input)
    return node
}

export const DiffControlNetLoader = (input: {
    ["model"]: "MODEL" | Link
    ["control_net_name"]: string | Link
}) => {
    const node = {
        CONTROL_NET0: [id.toString(), 0] as Link,
    } as const
    addNode("DiffControlNetLoader", node, input)
    return node
}

export const StyleModelLoader = (input: { ["style_model_name"]: string | Link }) => {
    const node = {
        STYLE_MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("StyleModelLoader", node, input)
    return node
}

export const CLIPVisionLoader = (input: { ["clip_name"]: string | Link }) => {
    const node = {
        CLIP_VISION0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPVisionLoader", node, input)
    return node
}

export const VAEDecodeTiled = (input: { ["samples"]: "LATENT" | Link; ["vae"]: "VAE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("VAEDecodeTiled", node, input)
    return node
}

export const VAEEncodeTiled = (input: { ["pixels"]: "IMAGE" | Link; ["vae"]: "VAE" | Link }) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("VAEEncodeTiled", node, input)
    return node
}

export const unCLIPCheckpointLoader = (input: { ["ckpt_name"]: string | Link }) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
        CLIP1: [id.toString(), 1] as Link,
        VAE2: [id.toString(), 2] as Link,
        CLIP_VISION3: [id.toString(), 3] as Link,
    } as const
    addNode("unCLIPCheckpointLoader", node, input)
    return node
}

export const GLIGENLoader = (input: { ["gligen_name"]: string | Link }) => {
    const node = {
        GLIGEN0: [id.toString(), 0] as Link,
    } as const
    addNode("GLIGENLoader", node, input)
    return node
}

export const GLIGENTextBoxApply = (input: {
    ["conditioning_to"]: "CONDITIONING" | Link
    ["clip"]: "CLIP" | Link
    ["gligen_textbox_model"]: "GLIGEN" | Link
    ["text"]: string | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["x"]: number | Link
    ["y"]: number | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("GLIGENTextBoxApply", node, input)
    return node
}

export const CheckpointLoader = (input: {
    ["config_name"]: string | Link
    ["ckpt_name"]: string | Link
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
        CLIP1: [id.toString(), 1] as Link,
        VAE2: [id.toString(), 2] as Link,
    } as const
    addNode("CheckpointLoader", node, input)
    return node
}

export const DiffusersLoader = (input: { ["model_path"]: any | Link }) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
        CLIP1: [id.toString(), 1] as Link,
        VAE2: [id.toString(), 2] as Link,
    } as const
    addNode("DiffusersLoader", node, input)
    return node
}

export const LoadLatent = (input: { ["latent"]: any | Link }) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LoadLatent", node, input)
    return node
}

export const SaveLatent = (input: {
    ["samples"]: "LATENT" | Link
    ["filename_prefix"]: string | Link
}) => {
    const node = {} as const
    addNode("SaveLatent", node, input)
    return node
}

export const ConditioningZeroOut = (input: { ["conditioning"]: "CONDITIONING" | Link }) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningZeroOut", node, input)
    return node
}

export const ConditioningConcat = (input: {
    ["conditioning_to"]: "CONDITIONING" | Link
    ["conditioning_from"]: "CONDITIONING" | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("ConditioningConcat", node, input)
    return node
}

export const HypernetworkLoader = (input: {
    ["model"]: "MODEL" | Link
    ["hypernetwork_name"]: string | Link
    ["strength"]: number | Link
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("HypernetworkLoader", node, input)
    return node
}

export const UpscaleModelLoader = (input: { ["model_name"]: string | Link }) => {
    const node = {
        UPSCALE_MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("UpscaleModelLoader", node, input)
    return node
}

export const ImageUpscaleWithModel = (input: {
    ["upscale_model"]: "UPSCALE_MODEL" | Link
    ["image"]: string | "IMAGE" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageUpscaleWithModel", node, input)
    return node
}

export const ImageBlend = (input: {
    ["image1"]: "IMAGE" | Link
    ["image2"]: "IMAGE" | Link
    ["blend_factor"]: number | Link
    ["blend_mode"]: "normal" | "multiply" | "screen" | "overlay" | "soft_light" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageBlend", node, input)
    return node
}

export const ImageBlur = (input: {
    ["image"]: string | "IMAGE" | Link
    ["blur_radius"]: number | Link
    ["sigma"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageBlur", node, input)
    return node
}

export const ImageQuantize = (input: {
    ["image"]: string | "IMAGE" | Link
    ["colors"]: number | Link
    ["dither"]: "none" | "floyd-steinberg" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageQuantize", node, input)
    return node
}

export const ImageSharpen = (input: {
    ["image"]: string | "IMAGE" | Link
    ["sharpen_radius"]: number | Link
    ["sigma"]: number | Link
    ["alpha"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageSharpen", node, input)
    return node
}

export const LatentCompositeMasked = (input: {
    ["destination"]: "LATENT" | Link
    ["source"]: "LATENT" | Link
    ["x"]: number | Link
    ["y"]: number | Link
    ["mask"]?: "MASK" | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("LatentCompositeMasked", node, input)
    return node
}

export const MaskToImage = (input: { ["mask"]: "MASK" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("MaskToImage", node, input)
    return node
}

export const ImageToMask = (input: {
    ["image"]: string | "IMAGE" | Link
    ["channel"]: "red" | "green" | "blue" | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("ImageToMask", node, input)
    return node
}

export const SolidMask = (input: {
    ["value"]: number | Link
    ["width"]: number | Link
    ["height"]: number | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("SolidMask", node, input)
    return node
}

export const InvertMask = (input: { ["mask"]: "MASK" | Link }) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("InvertMask", node, input)
    return node
}

export const CropMask = (input: {
    ["mask"]: "MASK" | Link
    ["x"]: number | Link
    ["y"]: number | Link
    ["width"]: number | Link
    ["height"]: number | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("CropMask", node, input)
    return node
}

export const MaskComposite = (input: {
    ["destination"]: "MASK" | Link
    ["source"]: "MASK" | Link
    ["x"]: number | Link
    ["y"]: number | Link
    ["operation"]: "multiply" | "add" | "subtract" | "and" | "or" | "xor" | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("MaskComposite", node, input)
    return node
}

export const FeatherMask = (input: {
    ["mask"]: "MASK" | Link
    ["left"]: number | Link
    ["top"]: number | Link
    ["right"]: number | Link
    ["bottom"]: number | Link
}) => {
    const node = {
        MASK0: [id.toString(), 0] as Link,
    } as const
    addNode("FeatherMask", node, input)
    return node
}

export const RebatchLatents = (input: {
    ["latents"]: "LATENT" | Link
    ["batch_size"]: number | Link
}) => {
    const node = {
        LATENT0: [id.toString(), 0] as Link,
    } as const
    addNode("RebatchLatents", node, input)
    return node
}

export const ModelMergeSimple = (input: {
    ["model1"]: "MODEL" | Link
    ["model2"]: "MODEL" | Link
    ["ratio"]: number | Link
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("ModelMergeSimple", node, input)
    return node
}

export const ModelMergeBlocks = (input: {
    ["model1"]: "MODEL" | Link
    ["model2"]: "MODEL" | Link
    ["input"]: number | Link
    ["middle"]: number | Link
    ["out"]: number | Link
}) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("ModelMergeBlocks", node, input)
    return node
}

export const CheckpointSave = (input: {
    ["model"]: "MODEL" | Link
    ["clip"]: "CLIP" | Link
    ["vae"]: "VAE" | Link
    ["filename_prefix"]: string | Link
}) => {
    const node = {} as const
    addNode("CheckpointSave", node, input)
    return node
}

export const TomePatchModel = (input: { ["model"]: "MODEL" | Link; ["ratio"]: number | Link }) => {
    const node = {
        MODEL0: [id.toString(), 0] as Link,
    } as const
    addNode("TomePatchModel", node, input)
    return node
}

export const CLIPTextEncodeSDXLRefiner = (input: {
    ["ascore"]: number | Link
    ["width"]: number | Link
    ["height"]: number | Link
    ["text"]: string | Link
    ["clip"]: "CLIP" | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPTextEncodeSDXLRefiner", node, input)
    return node
}

export const CLIPTextEncodeSDXL = (input: {
    ["width"]: number | Link
    ["height"]: number | Link
    ["crop_w"]: number | Link
    ["crop_h"]: number | Link
    ["target_width"]: number | Link
    ["target_height"]: number | Link
    ["text_g"]: string | Link
    ["clip"]: "CLIP" | Link
    ["text_l"]: string | Link
}) => {
    const node = {
        CONDITIONING0: [id.toString(), 0] as Link,
    } as const
    addNode("CLIPTextEncodeSDXL", node, input)
    return node
}

export const CannyEdgePreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["low_threshold"]: number | Link
    ["high_threshold"]: number | Link
    ["l2gradient"]: "disable" | "enable" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("CannyEdgePreprocessor", node, input)
    return node
}

export const M_LSDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["score_threshold"]: number | Link
    ["dist_threshold"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("M-LSDPreprocessor", node, input)
    return node
}

export const HEDPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["version"]: "v1" | "v1.1" | Link
    ["safe"]: "enable" | "disable" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("HEDPreprocessor", node, input)
    return node
}

export const ScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ScribblePreprocessor", node, input)
    return node
}

export const FakeScribblePreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("FakeScribblePreprocessor", node, input)
    return node
}

export const BinaryPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["threshold"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("BinaryPreprocessor", node, input)
    return node
}

export const PiDiNetPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["safe"]: "enable" | "disable" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("PiDiNetPreprocessor", node, input)
    return node
}

export const LineArtPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["coarse"]: "disable" | "enable" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("LineArtPreprocessor", node, input)
    return node
}

export const AnimeLineArtPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("AnimeLineArtPreprocessor", node, input)
    return node
}

export const Manga2Anime_LineArtPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("Manga2Anime-LineArtPreprocessor", node, input)
    return node
}

export const MiDaS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["a"]: number | Link
    ["bg_threshold"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("MiDaS-DepthMapPreprocessor", node, input)
    return node
}

export const MiDaS_NormalMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["a"]: number | Link
    ["bg_threshold"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("MiDaS-NormalMapPreprocessor", node, input)
    return node
}

export const LeReS_DepthMapPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["rm_nearest"]: number | Link
    ["rm_background"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("LeReS-DepthMapPreprocessor", node, input)
    return node
}

export const Zoe_DepthMapPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("Zoe-DepthMapPreprocessor", node, input)
    return node
}

export const BAE_NormalMapPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("BAE-NormalMapPreprocessor", node, input)
    return node
}

export const OpenposePreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["detect_hand"]: "enable" | "disable" | Link
    ["detect_body"]: "enable" | "disable" | Link
    ["detect_face"]: "enable" | "disable" | Link
    ["version"]: "v1" | "v1.1" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("OpenposePreprocessor", node, input)
    return node
}

export const MediaPipe_HandPosePreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["detect_pose"]: "enable" | "disable" | Link
    ["detect_hands"]: "enable" | "disable" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("MediaPipe-HandPosePreprocessor", node, input)
    return node
}

export const SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("SemSegPreprocessor", node, input)
    return node
}

export const UniFormer_SemSegPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("UniFormer-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_COCO_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("OneFormer-COCO-SemSegPreprocessor", node, input)
    return node
}

export const OneFormer_ADE20K_SemSegPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("OneFormer-ADE20K-SemSegPreprocessor", node, input)
    return node
}

export const MediaPipe_FaceMeshPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["max_faces"]: number | Link
    ["min_confidence"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("MediaPipe-FaceMeshPreprocessor", node, input)
    return node
}

export const ColorPreprocessor = (input: { ["image"]: string | "IMAGE" | Link }) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("ColorPreprocessor", node, input)
    return node
}

export const TilePreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["pyrUp_iters"]: number | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("TilePreprocessor", node, input)
    return node
}

export const InpaintPreprocessor = (input: {
    ["image"]: string | "IMAGE" | Link
    ["mask"]: "MASK" | Link
}) => {
    const node = {
        IMAGE0: [id.toString(), 0] as Link,
    } as const
    addNode("InpaintPreprocessor", node, input)
    return node
}
