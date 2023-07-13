import { Box, Typography } from "@mui/material"

import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { ComfyFile, api } from "../Api/Api"

export const ImageUploadZone = (props: {
    onChange: (image: ComfyFile) => void
    getOverlayImage?: (image: ComfyFile) => Promise<string>
    refreshOverlay?: MutableRefObject<() => void>
}) => {
    const imageRef = useRef<HTMLImageElement>(null)
    const overlayImageRef = useRef<HTMLImageElement>(null)
    const [imageFile, setImageFile] = useState<ComfyFile | undefined>(undefined)

    if (props.refreshOverlay) {
        props.refreshOverlay.current = async () => {
            if (props.getOverlayImage && imageFile && overlayImageRef.current) {
                overlayImageRef.current.src = await props.getOverlayImage(imageFile)
                overlayImageRef.current.style.opacity = "1"
            }
        }
    }

    const onDrop = useCallback(async (files: Array<File>) => {
        const uploadedResult = await api.uploadFile(files[0])
        setImageFile(uploadedResult)
        const reader = new FileReader()
        reader.onload = function (e) {
            if (imageRef.current) {
                imageRef.current.src = e.target?.result as string
            }
        }
        reader.readAsDataURL(files[0])

        if (props.getOverlayImage) {
            if (props.getOverlayImage && overlayImageRef.current) {
                overlayImageRef.current.src = await props.getOverlayImage(uploadedResult)
                overlayImageRef.current.style.opacity = "1"
            }
        }
    }, [])

    const onChange = props.onChange

    useEffect(() => {
        if (imageFile === undefined) {
            return
        }
        onChange(imageFile)
    }, [onChange, imageFile])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
    const size = 256
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
                    style={{
                        position: "absolute",
                        width: size,
                        height: size,
                        top: 0,
                        left: 0,
                        objectFit: "contain",
                    }}
                    ref={imageRef}
                ></img>
                <img
                    onMouseOver={() => {
                        if (overlayImageRef && overlayImageRef.current) {
                            overlayImageRef.current.style.opacity = "0"
                        }
                    }}
                    onMouseOut={() => {
                        if (overlayImageRef && overlayImageRef.current) {
                            overlayImageRef.current.style.opacity = "1"
                        }
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
                    ref={overlayImageRef}
                ></img>
            </div>
        </Box>
    )
}
