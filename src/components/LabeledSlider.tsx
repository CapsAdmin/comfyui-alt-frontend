import { Stack } from "@mui/material"
import MuiInput from "@mui/material/Input"
import Slider from "@mui/material/Slider"
import Typography from "@mui/material/Typography"
import { styled } from "@mui/material/styles"
import * as React from "react"

const Input = styled(MuiInput)`
    width: 42px;
`

export function LabeledSlider(props: {
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step?: number
    label: string
}) {
    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        props.onChange(newValue as number)
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let val = event.target.value === "" ? 0 : Number(event.target.value)

        if (val < props.min) {
            val = props.min
        }
        if (val > props.max) {
            val = props.max
        }
        props.onChange(val)
    }

    return (
        <Stack flex={1}>
            <Stack direction="row" justifyContent={"space-between"}>
                <Typography id="input-slider" gutterBottom style={{ flex: 1 }}>
                    {props.label}
                </Typography>
                <Input
                    value={props.value}
                    size="small"
                    onChange={handleInputChange}
                    inputProps={{
                        step: props.step,
                        min: props.min,
                        max: props.max,
                        type: "tel ",
                    }}
                    disableUnderline
                />
            </Stack>
            <Slider
                value={props.value}
                onChange={handleSliderChange}
                aria-labelledby="input-slider"
                step={props.step}
                min={props.min}
                max={props.max}
            />
        </Stack>
    )
}
