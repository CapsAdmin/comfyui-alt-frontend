import { Box, Typography } from "@mui/material"
import { useCallback } from "react"
import { FileWithPath, useDropzone } from "react-dropzone"
import { parse } from "yaml"

export type WildcardMap = { [key: string]: string[] }

export const WildCardDropZone = (props: { onDrop: (map: WildcardMap) => void }) => {
    const onFilesDrop = props.onDrop

    const onDrop = useCallback(
        async (files: Array<FileWithPath>) => {
            const wildcardMap: WildcardMap = {}

            await new Promise((resolve, reject) => {
                let count = 0
                for (const file of files) {
                    const path = file.path
                    if (!path) continue

                    const reader = new FileReader()
                    reader.onload = async () => {
                        let text = reader.result as string
                        if (text) {
                            let tree: any
                            if (path.endsWith(".yaml")) {
                                try {
                                    const traverse = (
                                        node: { [key: string]: any | string[] },
                                        path: string
                                    ) => {
                                        for (const [key, val] of Object.entries(node)) {
                                            let isLeaf = false
                                            if (Array.isArray(val)) {
                                                for (const v of val) {
                                                    if (typeof v === "string") {
                                                        isLeaf = true
                                                    }
                                                }
                                            }

                                            if (isLeaf) {
                                                let finalPath = path + "/" + key
                                                if (finalPath.startsWith("/")) {
                                                    finalPath = finalPath.slice(1)
                                                }
                                                wildcardMap[finalPath] = val
                                            } else {
                                                traverse(val, path + "/" + key)
                                            }
                                        }
                                    }

                                    traverse(await parse(text), "")
                                } catch (e) {
                                    console.error(e)
                                }
                            } else {
                                text = text.replace(/\r/gm, "")
                                tree = text.split("\n")

                                const temp = path.split("/")
                                temp.shift()
                                temp.shift()
                                const name = temp.join("/").replace(".txt", "")

                                wildcardMap[name] = tree
                            }
                        }
                        count++

                        if (count === files.length) {
                            resolve(null)
                        }
                    }
                    reader.readAsText(file)
                }
            })

            props.onDrop(wildcardMap)
        },
        [onFilesDrop]
    )

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
            </div>
        </Box>
    )
}
