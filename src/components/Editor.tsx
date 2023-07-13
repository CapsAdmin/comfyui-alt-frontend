import Konva from "konva"
import { Image, Layer, Stage } from "react-konva"
import { Gizmo } from "./Gizmo"

type CropMode =
    | "left-top"
    | "left-middle"
    | "left-bottom"
    | "center-top"
    | "center-middle"
    | "center-bottom"
    | "right-top"
    | "right-middle"
    | "right-bottom"
    | "scale"

// function to calculate crop values from source image, its visible size and a crop strategy
function getCrop(
    image: { width: number; height: number },
    size: { width: number; height: number },
    clipPosition: CropMode = "center-middle"
) {
    const width = size.width
    const height = size.height
    const aspectRatio = width / height

    let newWidth
    let newHeight

    const imageRatio = image.width / image.height

    if (aspectRatio >= imageRatio) {
        newWidth = image.width
        newHeight = image.width / aspectRatio
    } else {
        newWidth = image.height * aspectRatio
        newHeight = image.height
    }

    let x = 0
    let y = 0
    if (clipPosition === "left-top") {
        x = 0
        y = 0
    } else if (clipPosition === "left-middle") {
        x = 0
        y = (image.height - newHeight) / 2
    } else if (clipPosition === "left-bottom") {
        x = 0
        y = image.height - newHeight
    } else if (clipPosition === "center-top") {
        x = (image.width - newWidth) / 2
        y = 0
    } else if (clipPosition === "center-middle") {
        x = (image.width - newWidth) / 2
        y = (image.height - newHeight) / 2
    } else if (clipPosition === "center-bottom") {
        x = (image.width - newWidth) / 2
        y = image.height - newHeight
    } else if (clipPosition === "right-top") {
        x = image.width - newWidth
        y = 0
    } else if (clipPosition === "right-middle") {
        x = image.width - newWidth
        y = (image.height - newHeight) / 2
    } else if (clipPosition === "right-bottom") {
        x = image.width - newWidth
        y = image.height - newHeight
    } else if (clipPosition === "scale") {
        x = 0
        y = 0
        newWidth = width
        newHeight = height
    } else {
        console.error(new Error("Unknown clip position property - " + clipPosition))
    }

    return {
        cropX: x,
        cropY: y,
        cropWidth: newWidth,
        cropHeight: newHeight,
    }
}

// function to apply crop
function applyCrop(img: Konva.Image, pos: CropMode) {
    const crop = getCrop(
        img.image()! as HTMLImageElement,
        { width: img.width(), height: img.height() },
        pos
    )
    img.setAttrs(crop)
}

const CroppedImage = (props: { url: string; cropMode: CropMode }) => {
    return (
        <Image
            image={undefined}
            draggable
            ref={(node) => {
                if (!node) return
                const domimg = new window.Image()
                domimg.src = props.url
                node?.image(domimg)

                node.on("scale", (e) => {
                    console.log("SCALE")
                })
            }}
            onTransform={(e) => {
                const img = e.currentTarget as Konva.Image
                console.log("TRANSFORM")
                // reset scale on transform
                img.setAttrs({
                    scaleX: 1,
                    scaleY: 1,
                    width: img.width() * img.scaleX(),
                    height: img.height() * img.scaleY(),
                })
                applyCrop(img, props.cropMode)
            }}
            x={0}
            y={0}
            width={256}
            height={256}
        />
    )
}

export const Editor = () => {
    return (
        <Stage width={512} height={512}>
            <Layer>
                <Gizmo>
                    <CroppedImage
                        url="https://konvajs.org/assets/yoda.jpg"
                        cropMode="center-middle"
                    />
                </Gizmo>

                <Gizmo>
                    <CroppedImage
                        url="https://konvajs.org/assets/yoda.jpg"
                        cropMode="center-middle"
                    />
                </Gizmo>
            </Layer>
        </Stage>
    )
}
