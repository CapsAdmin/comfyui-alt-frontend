import { Button, LinearProgress, Stack } from "@mui/material";
import { api } from "./api";
import { useEffect, useRef, useState } from "react";
import {
  CLIPTextEncode,
  CheckpointLoaderSimple,
  EmptyLatentImage,
  EndNodeContext,
  KSamplerAdvanced,
  PreviewImage,
  StartNodeContext,
  Text,
  VAEDecode,
} from "./nodes";

const simpleWorkflow = () => {
  StartNodeContext();

  const checkpoint = CheckpointLoaderSimple({
    ckpt_name: "anime/Anything-V3.0-pruned-fp32.ckpt",
  });
  const previewImage = PreviewImage({
    images: VAEDecode({
      samples: KSamplerAdvanced({
        add_noise: "enable",
        noise_seed: 1,
        steps: 20,
        cfg: 8,
        sampler_name: "euler",
        scheduler: "normal",
        start_at_step: 0,
        end_at_step: 10000,
        return_with_leftover_noise: "disable",
        model: checkpoint.MODEL0,
        positive: CLIPTextEncode({
          text: Text({ Text: "1boy" }).STRING0,
          clip: checkpoint.CLIP1,
        }).CONDITIONING0,
        negative: CLIPTextEncode({ text: "", clip: checkpoint.CLIP1 })
          .CONDITIONING0,
        latent_image: EmptyLatentImage({
          width: 512,
          height: 512,
          batch_size: 1,
        }).LATENT0,
      }).LATENT0,
      vae: checkpoint.VAE2,
    }).IMAGE0,
  });

  return EndNodeContext();
};

function App() {
  const imgRef = useRef<HTMLImageElement>(null);
  const [progress, setProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0);

  useEffect(() => {
    api.protocol = "http";
    api.host = "127.0.0.1:8188";

    /*

    api.addEventListener("status", (data) => {
      console.log("status", data.detail);
    });

    api.addEventListener("reconnecting", () => {
      console.log("reconnecting");
    });

    api.addEventListener("reconnected", () => {
      console.log("reconnected");
    });

    api.addEventListener("executing", (data) => {
      console.log("executing", data);
    });

    api.addEventListener("execution_start", (data) => {
      console.log("execution_start", data);
    });

    api.addEventListener("execution_error", (data) => {
      console.log("execution_error", data);
    });

*/
    const progress = (data) => {
      const progress = data.detail.value as number;
      const max = data.detail.max as number;

      setProgress(progress);
      setMaxProgress(max);
    };
    const executed = async (data) => {
      let img = data.detail.output.images[0];
      const blob = await api.view(img);
      imgRef.current.src = URL.createObjectURL(blob);
    };

    const b_preview = (data: any) => {
      let blob = data.detail as Blob;

      imgRef.current.src = URL.createObjectURL(blob);
    };

    api.addEventListener("progress", progress);
    api.addEventListener("executed", executed);
    api.addEventListener("b_preview", b_preview);

    api.init();

    (async () => {
      console.log(await api.getNodes());
    })();

    return () => {
      api.removeEventListener("progress", progress);
      api.removeEventListener("executed", executed);
      api.removeEventListener("b_preview", b_preview);
    };
  }, []);

  return (
    <Stack>
      <LinearProgress
        variant="determinate"
        value={(progress / maxProgress) * 100}
      />
      <Button
        onClick={async () => {
          await api.queuePrompt(0, simpleWorkflow());
        }}
      >
        generate
      </Button>
      <img ref={imgRef}></img>
    </Stack>
  );
}

export default App;
