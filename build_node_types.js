import fs from "fs"

const res = await fetch("http://127.0.0.1:8188/object_info")
const nodes = await res.json()
delete nodes.EmptySegs
let out = `
export type NodeLink = [string, number]

let id = 0
let workflow = {version: 0.4, nodes: [], output: {}}

const StartNodeContext = () => {
	id = 0
	workflow = {version: 0.4, nodes: [], output: {}}
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

`

const emitProp = (name, prop) => {
    if (name.endsWith("_name") || name.includes("_name_")) {
        return "string"
    }

    if (name == "image") {
        return 'string | "IMAGE"'
    }

    const type = prop[0]
    if (type == "INT" || type == "FLOAT") {
        return "number"
    } else if (type == "STRING") {
        return "string"
    } else if (typeof type == "string" && type.toUpperCase() == type) {
        return '"' + type.toUpperCase() + '"'
    } else if (typeof type == "boolean") {
        return "boolean"
    } else if (Array.isArray(prop)) {
        let strings = []
        for (let string of prop) {
            if (typeof string == "string") {
                strings.push('"' + string + '"')
            } else if (Array.isArray(string)) {
                strings.push(emitProp(name, string))
            }
        }

        if (strings.length == 0) {
            return "any"
        }

        return strings.join(" | ")
    } else {
        return "any"
    }
}

const emitNode = (name, node) => {
    const jsname = name.replace(/^[^a-zA-Z_$]|[^0-9a-zA-Z_$]/g, "_")
    out += `export const ${jsname} = (input: `
    out += `{\n`
    for (const [name, prop] of Object.entries(node.input.required)) {
        out += `        ["${name}"]: ${emitProp(name, prop)} | NodeLink\n`
    }
    if (node.input.optional) {
        for (const [name, prop] of Object.entries(node.input.optional)) {
            out += `        ["${name}"]?: ${emitProp(name, prop)} | NodeLink\n`
        }
    }
    out += `}) => {\n`
    out += `    const node = {\n`
    let i = 0
    for (const prop of node.output) {
        out += `        ${prop}${i}: [id.toString(), ${i}] as NodeLink,\n`
        i++
    }
    out += `    } as const\n`
    out += `    addNode("${name}", node, input)\n`
    out += `    return node\n`
    out += `}\n\n`
}

for (const [name, node] of Object.entries(nodes)) {
    emitNode(name, node)
}

fs.writeFileSync("./src/Api/Nodes.ts", out)
