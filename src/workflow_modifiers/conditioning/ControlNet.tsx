import {
    CannyEdgePreprocessor,
    LineArtPreprocessor,
    Zoe_DepthMapPreprocessor,
} from "../../Api/Nodes"
import { ControlNetPreprocessorBase, ImagePreprocessor } from "./ControlNetBase"

export class ControlNetCannyEdge extends ControlNetPreprocessorBase {
    title = "Canny Edge"
    checkPoint = "t2iadapter_canny_sd15v2.pth"
    PreProcessor = CannyEdgePreprocessor as ImagePreprocessor
    propConfig = {
        low_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 100 },
        high_threshold: { type: "number" as const, min: 0, max: 255, step: 1, value: 200 },
        l2gradient: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}

export class ControlNetDepth extends ControlNetPreprocessorBase {
    title = "Depth"
    checkPoint = "t2iadapter_depth_sd15v2.pth"
    PreProcessor = Zoe_DepthMapPreprocessor as ImagePreprocessor
    propConfig = undefined
}

export class ControlNetLineArt extends ControlNetPreprocessorBase {
    title = "Line Art"
    checkPoint = "control_v11p_sd15_lineart.pth"
    PreProcessor = LineArtPreprocessor as ImagePreprocessor
    propConfig = {
        coarse: {
            type: "boolean" as const,
            _true: "enable",
            _false: "disable",
            value: "disable" as "enable" | "disable",
        },
    }
}
