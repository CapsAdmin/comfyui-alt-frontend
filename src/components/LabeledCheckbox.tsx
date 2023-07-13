import { Checkbox, Stack } from "@mui/material"
import Typography from "@mui/material/Typography"

export function LabeledCheckbox(props: {
    value: boolean
    onChange: (v: boolean) => void
    label: string
}) {
    return (
        <Stack direction={"row"} alignItems={"center"} flex={1}>
            <Typography id="input-slider" gutterBottom>
                {props.label}
            </Typography>
            <Checkbox checked={props.value} onChange={(e) => props.onChange(e.target.checked)} />
        </Stack>
    )
}
