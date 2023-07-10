import fs from "fs";

let str = fs.readFileSync("./nodes.json", "utf8");
let nodes = JSON.parse(str);
delete nodes.EmptySegs;
let out = `
	let id = 1
	let workflow = {version: 0.4, nodes: [], output: {}}

	export const StartNodeContext = () => {
		id = 1
		workflow = {version: 0.4, nodes: [], output: {}}
	}

	export const EndNodeContext = () => {
		return workflow
	}

	const addNode = (node, input) => {
		node.slot = (index: number) => {
			return [node.id.toString(), index]
		  }
		workflow.output[node.id] = {
			class_type: node.type,
			inputs: input,
			}
		workflow.nodes.push(node)
	}
`;

const emitProp = (name, prop) => {
  if (name.endsWith("_name") || name.includes("_name_")) {
	return "string";
  }

  if (name == "image") {
	return '"' + name.toUpperCase() + '"';
  }

  const type = prop[0];
  if (type == "INT" || type == "FLOAT") {
	return "number";
  } else if (type == "STRING") {
		return "string";
  } else if (typeof type == "string" && type.toUpperCase() == type) {
	return '"' + type.toUpperCase() + '"';
  } else if (typeof type == "boolean") {
	return "boolean";
  } else if (Array.isArray(prop)) {
	let strings = [];
	for (let string of prop) {
	  if (typeof string == "string") {
		strings.push('"' + string + '"');
	  } else if (Array.isArray(string)) {
		strings.push(emitProp(name, string));
	  }
	}

	if (strings.length == 0) {
	  return "any";
	}

	return strings.join(" | ");
  } else {
	return "any";
  }
};

const emitNode = (name, node) => {
  name = name.replace(/^[^a-zA-Z_$]|[^0-9a-zA-Z_$]/g, "_");
  out += `export const ${name} = (input: `;
  out += `{\n`;
  for (const [name, prop] of Object.entries(node.input.required)) {
	out += `        ["${name}"]: ${emitProp(name, prop)} | [string, number]\n`;
  }
  if (node.input.optional) {
	for (const [name, prop] of Object.entries(node.input.optional)) {
	  out += `        ["${name}"]?: ${emitProp(name, prop)} | [string, number]\n`;
	}
  }
  out += `}) => {\n`;
  out += `    id++;\n`;
  out += `    const node = {`;
  out += `        id: id,\n`;
  out += `        type: "${name}",\n`;

  let i = 0
  for (const prop of node.output) {
	out += `        ${prop}${i}: [id.toString(), ${i}] as [string, number],\n`;
	i++
}


  out += `    } as const\n`
  out += `    addNode(node, input)\n`;  
  out += `    return node;\n`;
  out += `};\n\n`;
};

for (const [name, node] of Object.entries(nodes)) {
  emitNode(name, node);
}

fs.writeFileSync("./src/nodes.ts", out);
