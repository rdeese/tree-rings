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
  const stepsPerCm = 40;
  const count = 40;
  const spacingConstant = 0.15;
  const radius = 0.1;

  const radiusNoiseMagnitude = 0.4;
  const radiusNoise = new Noise(Math.random())
  const radiusNoiseScale = 20;

  const ringGapProb = 0.01;
  const ringContinueProb = 0.08;

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
      magnitude: 0.04,
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
    const steps = 2 * Math.PI * r * stepsPerCm;
    const phase = 2*Math.PI*Math.random()
    const circle = []
    let inRing = Math.random() > ringGapProb;
    for (let i = 0; i < steps; i++) {
      if (
        (inRing && Math.random() > ringGapProb) ||
        (!inRing && Math.random() < ringContinueProb)
      ) {
        inRing = true
        const t = i / steps;
        const angle = Math.PI * 2 * t + phase;
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
      } else {
        inRing = false;
        circle.push(null);
      }
    }
    // circle.push(circle[0])

    let segment = []
    for (let i in circle) {
      const point = circle[i]
      if (point) {
        segment.push(point)
      } else if (segment.length > 0) {
        if (Math.random() > 0.5) {
          segment.map((p) => p[0] -=4)
        } else {
          segment.map((p) => p[0] +=4)
        }
        lines.push(segment)
        segment = []
      }
    }
    if (segment.length > 0) {
      if (Math.random() > 0.5) {
        segment.map((p) => p[0] -=4)
      } else {
        segment.map((p) => p[0] +=4)
      }
      lines.push(segment);
    }
  }
  console.log(lines)

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
