import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import MuiInput from '@mui/material/Input';

const Input = styled(MuiInput)`
  width: 42px;
`;

export default function GradioSlider(props: {
  value: number,
  onChange: (v: number) => void,
  min: number,
  max: number,
  step?: number,
  label: string,
}) {
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    props.onChange(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let val = event.target.value === '' ? 0 : Number(event.target.value)
    
    if (val < props.min) {
      val = props.min;
    }
    if (val > props.max) {
      val = props.max;
    }
    props.onChange(val);
  };

  return (
    <Box flex={1}>
      <Typography id="input-slider" gutterBottom>
        {props.label}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            value={props.value}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            step={props.step}
            min={props.min}
            max={props.max}
          />
        </Grid>
        <Grid item>
          <Input
            value={props.value}
            size="small"
            onChange={handleInputChange}
            inputProps={{
              step: props.step,
              min: props.min,
              max: props.max,
              type: 'number',
              'aria-labelledby': 'input-slider',
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}