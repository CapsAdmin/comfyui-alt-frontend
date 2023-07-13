import Konva from "konva"
import { Box } from "konva/lib/shapes/Transformer"
import { IRect } from "konva/lib/types"
import { ReactNode, useEffect, useRef } from "react"
import { Group, Transformer } from "react-konva"

function getCorner(pivotX: number, pivotY: number, diffX: number, diffY: number, angle: number) {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY)

    /// find angle from pivot to corner
    angle += Math.atan2(diffY, diffX)

    /// get new x and y and round it off to integer
    const x = pivotX + distance * Math.cos(angle)
    const y = pivotY + distance * Math.sin(angle)

    return { x: x, y: y }
}

function getClientRect(rotatedBox: Box) {
    const { x, y, width, height } = rotatedBox
    const rad = rotatedBox.rotation

    const p1 = getCorner(x, y, 0, 0, rad)
    const p2 = getCorner(x, y, width, 0, rad)
    const p3 = getCorner(x, y, width, height, rad)
    const p4 = getCorner(x, y, 0, height, rad)

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x)
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y)
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x)
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y)

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    }
}

function getTotalBox(boxes: IRect[]) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    boxes.forEach((box) => {
        minX = Math.min(minX, box.x)
        minY = Math.min(minY, box.y)
        maxX = Math.max(maxX, box.x + box.width)
        maxY = Math.max(maxY, box.y + box.height)
    })
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    }
}

export const Gizmo = (props: {
    children: ReactNode
    onTransform?: (e: Konva.KonvaEventObject<Event>) => void
}) => {
    const trRef = useRef<Konva.Transformer>(null)

    const getChildren = () => {
        const tr = trRef.current
        if (!tr) return []

        const shapes = [...tr.getParent()!.getChildren()!]
        shapes.splice(shapes.indexOf(tr), 1)
        return shapes
    }

    useEffect(() => {
        const tr = trRef.current
        if (!tr) return

        tr.nodes(getChildren())
    }, [])

    return (
        <Group
            onDblClick={(e) => {
                const group = e.currentTarget as Konva.Group
                const tr = group.findOne<Konva.Transformer>("Transformer")!
                const stage = tr.getStage()!

                for (const child of getChildren()) {
                    child.position({
                        x: 0,
                        y: 0,
                    })
                    child.width(stage.width())
                    child.height(stage.height())
                }
                // TODO: figure out how to update image so it crops properly
            }}
        >
            {props.children}
            <Transformer
                onDragMove={(e) => {
                    {
                        return
                    }
                }}
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                    {
                        return newBox
                    }
                }}
            />
        </Group>
    )
}
