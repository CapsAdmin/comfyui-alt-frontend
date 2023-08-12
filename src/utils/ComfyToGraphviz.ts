import { instance } from "@viz-js/viz"

function jsonToGraphviz(json) {
    let dotString = "digraph G {\n"

    // Process nodes to create labels
    json.nodes.forEach((node) => {
        const id = node.id.toString()
        const label = node.type
        dotString += `  ${id} [label="${label} "];\n`
    })

    // Process outputs to create connections
    for (const key in json.output) {
        const inputs = json.output[key].inputs
        for (const inputKey in inputs) {
            if (Array.isArray(inputs[inputKey])) {
                const [from, index] = inputs[inputKey]

                // Find the corresponding node based on the 'from' id
                const correspondingNode = json.nodes.find((n) => n.id.toString() === from)
                if (correspondingNode) {
                    const fromPort = Object.keys(correspondingNode).find(
                        (k) =>
                            Array.isArray(correspondingNode[k]) && correspondingNode[k][0] === from
                    )
                    const toPort = inputKey
                    dotString += `  ${from}:${fromPort} -> ${key}:${toPort} [label="${inputKey}", fontsize=10];\n`
                }
            } else {
                // For non-array inputs (leaf edges), use them as direct edge labels and adjust the style
                const hash = inputs[inputKey] + inputKey
                dotString += `"${hash}" -> ${key} [color="grey", style=dotted, arrowhead="none"];\n`
                dotString += `"${hash}" [label="${inputKey}\n${inputs[inputKey]}", margin="0,0", color="grey", fontsize=8, shape="none"];\n`
            }
        }
    }

    dotString += "}"
    return dotString
}
const graphviz = await instance()

export function comfyToGraphvizSVG(graph: any) {
    return graphviz.renderSVGElement(jsonToGraphviz(graph))
}
