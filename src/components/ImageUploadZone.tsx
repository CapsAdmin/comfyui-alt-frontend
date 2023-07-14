import { Box, Typography } from "@mui/material"
import { useCallback, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { ComfyFile, api } from "../Api/Api"

export const ImageUploadZone = (props: {
    value?: ComfyFile
    overlayImage?: ComfyFile
    onChange: (image: ComfyFile) => void
}) => {
    const imageRef = useRef<HTMLImageElement>(null)
    const overlayImageRef = useRef<HTMLImageElement>(null)
    const onImageUpload = props.onChange

    const onDrop = useCallback(
        async (files: Array<File>) => {
            onImageUpload(await api.uploadFile(files[0]))
        },
        [onImageUpload]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
    const size = 256

    useEffect(() => {
        ;(async () => {
            const img = imageRef.current
            if (!img) return

            if (props.value) {
                img.src = URL.createObjectURL(
                    await api.view({
                        filename: props.value.name,
                        type: props.value.type,
                    })
                )
            } else {
                img.src = ""
            }
        })()
    }, [props.value])

    useEffect(() => {
        ;(async () => {
            const img = overlayImageRef.current
            if (!img) return

            if (props.overlayImage) {
                img.src = URL.createObjectURL(
                    await api.view({
                        filename: props.overlayImage.name,
                        type: props.overlayImage.type,
                    })
                )
            } else {
                img.src = ""
            }
        })()
    }, [props.overlayImage])

    return (
        <Box>
            <div
                style={{ width: size, height: size, position: "relative", backgroundColor: "gray" }}
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <Typography>Drop the files here ...</Typography>
                ) : (
                    <Typography>Drag 'n' drop some files here, or click to select files</Typography>
                )}
                <img
                    ref={imageRef}
                    style={{
                        position: "absolute",
                        width: size,
                        height: size,
                        top: 0,
                        left: 0,
                        objectFit: "contain",
                    }}
                ></img>
                <img
                    ref={overlayImageRef}
                    onMouseOver={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.opacity = "0"
                    }}
                    onMouseOut={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.opacity = "1"
                    }}
                    style={{
                        position: "absolute",
                        width: size,
                        height: size,
                        top: 0,
                        left: 0,
                        opacity: 1,
                        objectFit: "contain",
                    }}
                ></img>
            </div>
        </Box>
    )
}
