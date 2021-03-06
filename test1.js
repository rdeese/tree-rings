import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import { Noise } from 'noisejs';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  let lines = [];

  // Draw some circles expanding outward
  const stepsPerCm = 20;
  const count = 40;
  const spacingConstant = 0.15;
  const radius = 0.1;

  const radiusNoiseMagnitude = 0.4;
  const radiusNoise = new Noise(Math.random())
  const radiusNoiseScale = 20;

  const pointNoises = [
    {
      magnitude: 0.5,
      scale: 20,
      noise: new Noise(Math.random())
    },
    {
      magnitude: 0.3,
      scale: 7,
      noise: new Noise(Math.random())
    },
    {
      magnitude: 0.08,
      scale: 2,
      noise: new Noise(Math.random())
    }
  ]

  const spacing = (ringNumber) => {
    if (ringNumber > 20) {
      return spacingConstant;
    } else {
      return (-1*Math.pow(ringNumber/20, 2)/2+1.5)*spacingConstant
    }
  }

  const radii = [radius]

  for (let j = 0; j < count; j++) {
    radii.push(radii[j]+spacing(j))
    const r = radii[j] + (radiusNoise.simplex2(0, j/radiusNoiseScale))*radiusNoiseMagnitude;
    const circle = [];
    const steps = 2 * Math.PI * r * stepsPerCm;
    const phase = 2*Math.PI*Math.random()
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angle = Math.PI * 2 * t;
      const position = [
        width / 2 + Math.cos(angle) * r,
        height / 2 + Math.sin(angle) * r
      ]
      let localNoise = 0;
      for (let i in pointNoises) {
        const noise = pointNoises[i];
        localNoise += noise.magnitude*noise.noise.simplex2(position[0]/noise.scale, position[1]/noise.scale);
      }
        
      circle.push([
        position[0] + Math.cos(angle) * localNoise,
        position[1] + Math.sin(angle) * localNoise
      ]);
    }
    circle.push(circle[0])
    lines.push(circle);
  }

  // Clip all the lines to a margin
  const margin = 1.5;
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  return {
    draw,
    print,
    background: 'white',
    animate: false,
    clear: true
  };

  function draw () {
    lines.forEach(points => {
      context.beginPath();
      points.forEach(p => context.lineTo(p[0], p[1]));
      context.stroke();
    });
  }

  function print () {
    return polylinesToSVG(lines, {
      dimensions
    });
  }
}
