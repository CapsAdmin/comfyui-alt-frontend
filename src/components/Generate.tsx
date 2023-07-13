import { Box, Button, LinearProgress } from "@mui/material"

export const Generate = (props: { progress: number; maxProgress: number; onClick: () => void }) => {
    return (
        <Box>
            <Button variant="contained" onClick={props.onClick}>
                generate
            </Button>
            <LinearProgress
                variant="determinate"
                value={(props.progress / props.maxProgress) * 100}
            />
        </Box>
    )
}
