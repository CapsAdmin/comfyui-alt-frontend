import { Input, Select, Stack, TextField } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";

import { useRef, useState } from "react";
import { api, useComfyAPI } from "./api";
import { Generate } from "./components/Generate";
import LabeledSlider from "./components/GradioSlider";
import { Txt2Img } from "./workflows/txt2img";

export function Txt2ImgTab() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [availableData, progress, maxProgress] = useComfyAPI(imgRef);

  const [checkpoint, setCheckpoint] = useState(
    "anime/Anything-V3.0-pruned-fp32.ckpt"
  );
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

  return (
    <Stack>
      <Stack direction={"row"}>
        <Stack flex={1}>
          <Select
            style={{ flex: 1 }}
            value={checkpoint}
            onChange={(e) => setCheckpoint(e.target.value)}
          >
            {availableData.checkpoints.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
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
            await api.queuePrompt(
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
                availableData,
              })
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
                {availableData.samplingMethods.map((v) => (
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
                {availableData.samplingSchedulers.map((v) => (
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
            <Stack flex={0.5} direction={"column"}>
              <LabeledSlider
                value={batchSize}
                onChange={(v) => setBatchSize(v)}
                min={1}
                max={8}
                step={1}
                label="Batch Size"
              />

              <LabeledSlider
                value={batchCount}
                onChange={(v) => setBatchCount(v)}
                min={1}
                max={8}
                step={1}
                label="Batch Count"
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
