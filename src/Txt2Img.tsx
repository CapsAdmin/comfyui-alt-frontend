import { Input, Select, Stack, TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";

import { useRef, useState } from "react";
import { api, useComfyAPI } from "./api";
import { Generate } from "./components/Generate";
import LabeledSlider from "./components/GradioSlider";
import {
    CannyEdgePreprocessor,
    ControlNetApply,
    ControlNetLoader,
    LoadImage,
    Zoe_DepthMapPreprocessor,
} from "./nodes";
import { Txt2Img } from "./workflows/txt2img";
import {
    ControlNetCannyEdge,
    ControlNetConditioner,
    ControlNetDepth,
    ImageUploadZone,
} from "./components/ControlNetConditioner";

export function Txt2ImgTab() {
    const imgRef = useRef<HTMLImageElement>(null);
    const resources = useComfyAPI();

    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(0);

    const [checkpoint, setCheckpoint] = useState("anime/Anything-V3.0-pruned-fp32.ckpt");
    const [positive, setPositive] = useState("");
    const [negative, setNegative] = useState("");

    const [samplingMethod, setSamplingMethod] = useState("euler");
    const [samplingScheduler, setSamplingScheduler] = useState("normal");
    const [samplingSteps, setSamplingSteps] = useState(20);

    const [width, setWidth] = useState(512);
    const [height, setHeight] = useState(512);

    const [batchSize, setBatchSize] = useState(1);
    const [batchCount, setBatchCount] = useState(1);

    const [cfgScale, setCfgScale] = useState(7.5);
    const [seed, setSeed] = useState(0);
    const [conditioners, setConditioners] = useState<Array<ControlNetConditioner>>([]);

    const addConditioner = (conditioner: ControlNetConditioner) => {
        conditioners[conditioner.id] = conditioner;
        setConditioners([...conditioners]);
    };

    return (
        <Stack>
             <Select
                        style={{ flex: 1 }}
                        value={checkpoint}
                        onChange={(e) => setCheckpoint(e.target.value)}
                    >
                        {resources.checkpoints.map((v) => (
                            <MenuItem key={v} value={v}>
                                {v}
                            </MenuItem>
                        ))}
                    </Select>
            <Stack direction="row">
                <ControlNetDepth id={0} onChange={addConditioner} />
                <ControlNetCannyEdge id={1} onChange={addConditioner} />
            </Stack>
            <Stack direction={"row"}>
                <Stack flex={1}>
                   
                    <TextField
                        label="positive"
                        value={positive}
                        onChange={(e) => setPositive(e.target.value)}
                        multiline
                        minRows={3}
                    />
                    <TextField
                        label="negative"
                        value={negative}
                        onChange={(e) => setNegative(e.target.value)}
                        multiline
                        minRows={3}
                    />
                </Stack>
                <Generate
                    progress={progress}
                    maxProgress={maxProgress}
                    onClick={async () => {
                        const res = await api.executePrompt(
                            0,
                            Txt2Img({
                                checkpoint,
                                positive,
                                negative,
                                samplingMethod,
                                samplingScheduler: samplingScheduler as any,
                                samplingSteps,
                                width,
                                height,
                                batchSize,
                                batchCount,
                                cfgScale,
                                seed,
                                resources,
                                conditioners,
                            }),
                            (image) => {
                                imgRef.current.src = image;
                            },
                            (prog, max) => {
                                setProgress(prog);
                                setMaxProgress(max);
                            }
                        );

                        imgRef.current.src = URL.createObjectURL(
                            await api.view(res.output.images[0])
                        );
                    }}
                />
            </Stack>

            <Stack direction={"row"}>
                <Stack flex={1} direction={"column"}>
                    <Stack direction={"row"}>
                        <Stack flex={1} direction={"row"}>
                            <Select
                                style={{ flex: 1 }}
                                value={samplingMethod}
                                onChange={(e) => setSamplingMethod(e.target.value)}
                            >
                                {resources.samplingMethods.map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
                            </Select>

                            <Select
                                style={{ flex: 1 }}
                                value={samplingScheduler}
                                onChange={(e) => setSamplingScheduler(e.target.value)}
                            >
                                {resources.samplingSchedulers.map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Stack>

                        <LabeledSlider
                            value={samplingSteps}
                            onChange={(v) => setSamplingSteps(v)}
                            min={0}
                            max={150}
                            step={1}
                            label="Sampling Steps"
                        ></LabeledSlider>
                    </Stack>

                    <Stack direction={"row"}>
                        <Stack flex={1} direction={"column"}>
                            <LabeledSlider
                                value={width}
                                onChange={(v) => setWidth(v)}
                                min={0}
                                max={2048}
                                step={64}
                                label="Width"
                            />

                            <LabeledSlider
                                value={height}
                                onChange={(v) => setHeight(v)}
                                min={0}
                                max={2048}
                                step={64}
                                label="Height"
                            />
                        </Stack>
                  
                    </Stack>

                    <Stack direction={"column"}>
                        <LabeledSlider
                            value={cfgScale}
                            onChange={(v) => setCfgScale(v)}
                            min={1}
                            max={30}
                            step={0.5}
                            label="CFG Scale"
                        />
                        <Input
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value))}
                            type="number"
                            inputProps={{
                                min: -1,
                                max: 10000000000000,
                            }}
                        />
                    </Stack>
                </Stack>
                <img style={{ flex: 1 }} ref={imgRef}></img>
            </Stack>
        </Stack>
    );
}
