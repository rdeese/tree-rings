import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import { Noise } from 'noisejs';

export const orientation = Orientation.PORTRAIT;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;
  let lines = [];

  // Draw some circles expanding outward
  const stepsPerCm = 40;
  const count = 20;
  const spacingConstant = 0.12;
  const radius = 0.1;

  const radiusNoiseMagnitude = 1;
  const radiusNoise = new Noise(Math.random())
  const radiusNoiseScale = 10;

  const ringGapProb = 0.005;
  const ringContinueProb = 0.02;

  const heightScale = 0.9;
  const yNoiseScale = 15;
  const radiusYNoiseScale = 100;

  const positionNoise = {
    magnitude: 1,
    scale: 50,
    noise: new Noise(Math.random())
  }

  const pointNoises = [
    {
      magnitude: 1,
      scale: 50,
      noise: new Noise(Math.random())
    },
    {
      magnitude: 2,
      scale: 8,
      noise: new Noise(Math.random())
    },
    {
      magnitude: 0.3,
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
  }

  const drawRingsAtY = (lines, y) => {
    const xOffset = positionNoise.magnitude*positionNoise.noise.simplex2(0, y/positionNoise.scale)
    for (let j = 0; j < count; j++) {
      const r = radii[j] + (radiusNoise.simplex3(0, j/radiusNoiseScale, (y/radiusNoiseScale)/radiusYNoiseScale))*radiusNoiseMagnitude;
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
            width/2 + Math.cos(angle) * r,
            height/2 + Math.sin(angle) * r
          ]
          let localNoise = 0;
          for (let i in pointNoises) {
            const noise = pointNoises[i];
            localNoise += noise.magnitude*noise.noise.simplex3(position[0]/noise.scale, position[1]/noise.scale, (y/noise.scale)/yNoiseScale);
          }

          circle.push([
            position[0] + Math.cos(angle) * localNoise + xOffset,
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
          segment.map((p) => p[1] = p[1]*0.5 + 0.25*height)
          const verticalOffset = y - height/2
          segment.map((p) => p[1] += verticalOffset)
          lines.push(segment)
          segment = []
        }
      }
      if (segment.length > 0) {
        segment.map((p) => p[1] = p[1]*0.5 + 0.25*height)
        const verticalOffset = y - height/2
        segment.map((p) => p[1] += verticalOffset)
        lines.push(segment);
      }
    }
  }

  const splitImages = (circle) => {
    const numImages = 4;
    let segment = []
    for (let i in circle) {
      const point = circle[i]
      if (point) {
        segment.push(point)
      } else if (segment.length > 0) {
        segment.map((p) => p[1] = p[1]*0.25 + 0.375*height)
        const verticalOffset = (Math.round(numImages*Math.random())-0.5*numImages)*0.7*height/numImages;
        segment.map((p) => p[1] += verticalOffset)
        lines.push(segment)
        segment = []
      }
    }
    if (segment.length > 0) {
      segment.map((p) => p[1] = p[1]*0.25 + 0.375*height)
      const verticalOffset = (Math.floor(numImages*Math.random())-0.5*numImages)*0.7*height/numImages;
      segment.map((p) => p[1] += verticalOffset)
      lines.push(segment);
    }
  }

  const drawVerticalLine = (ringNumber, angle, startHeight, endHeight) => {
    console.log(startHeight, endHeight)
    const vertLine = [];
    for (let y = startHeight; y < endHeight; y += 1/stepsPerCm) {
      const xOffset = positionNoise.magnitude*positionNoise.noise.simplex2(0, y/positionNoise.scale)
      const r = radii[ringNumber] + (radiusNoise.simplex3(0, ringNumber/radiusNoiseScale, (y/radiusNoiseScale)/radiusYNoiseScale))*radiusNoiseMagnitude;

      const position = [
        width/2 + Math.cos(angle) * r,
        height/2 + Math.sin(angle) * r
      ]
      let localNoise = 0;
      for (let i in pointNoises) {
        const noise = pointNoises[i];
        localNoise += noise.magnitude*noise.noise.simplex3(position[0]/noise.scale, position[1]/noise.scale, (y/noise.scale)/yNoiseScale);
      }

      vertLine.push([
        position[0] + Math.cos(angle) * localNoise + xOffset,
        y + Math.sin(angle) * localNoise
      ]);
    }
    return vertLine;
  }

  const drawRandomVerticalLine = () => {
    const start = Math.random()*height*3/4 + height/4
    const end = (height*3/4-start)*Math.random() + start
    console.log(start, end)
    return drawVerticalLine(Math.floor(Math.random()*count), Math.PI * 2 * Math.random(), start, end)
  }

  const centerY = height/2
  drawRingsAtY(lines, centerY - 10);
  drawRingsAtY(lines, centerY - 5);
  drawRingsAtY(lines, centerY);
  drawRingsAtY(lines, centerY + 5);
  drawRingsAtY(lines, centerY + 10);
  // for (let i = 0; i < 50; i++) {
  //   lines.push(drawRandomVerticalLine())
  // }
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
