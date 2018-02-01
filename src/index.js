import { PaperSize, Orientation } from 'penplot';
import { polylinesToSVG } from 'penplot/util/svg';
import { clipPolylinesToBox } from 'penplot/util/geom';
import convexHull from 'convex-hull';

export const orientation = Orientation.LANDSCAPE;
export const dimensions = PaperSize.LETTER;

export default function createPlot (context, dimensions) {
  const [ width, height ] = dimensions;

  console.log(width, height)
  let lines = [];

  // Draw some circles expanding outward
  const steps = 400;
  const spacingConstant = 0.02;
  const randomSpacing = spacingConstant*0;
  const constantSpacing = spacingConstant*0.1;
  const randomRadialSpacing = spacingConstant*2;
  const constantRadialSpacing = spacingConstant*5;
  const lastDistanceInfluence = 0.3;
  const radius = 0.1;
  const rings = 40;

  let circle = [];
  for (let i = 0; i < steps; i++) {
    const angle = Math.PI * 2 * i / steps;
    circle.push([
      width / 2 + Math.cos(angle) * radius,
      height / 2 + Math.sin(angle) * radius
    ]);
  }
  circle.push(circle[0]);
  lines.push(circle);
  let lastCircle = circle;

  const realIndex = (i) => {
    return (i + circle.length) % circle.length
  }

  for (let _ = 0; _ < rings; _++) {
    let nextCircle = [] 

    for (let i = 0; i < steps; i++) {
      const angle = Math.PI * 2 * i / steps;

      const prevNeighbor = circle[realIndex(i+1)]
      const nextNeighbor = circle[realIndex(i-1)]
      const parallelVector = [nextNeighbor[0] - prevNeighbor[0], nextNeighbor[1] - prevNeighbor[1]]
      const outwardVector = [
        parallelVector[0]*Math.cos(Math.PI/2) - parallelVector[1]*Math.sin(Math.PI/2),
        parallelVector[0]*Math.sin(Math.PI/2) + parallelVector[1]*Math.cos(Math.PI/2)
      ]
      const outwardMagnitude = Math.pow(Math.pow(outwardVector[0], 2) + Math.pow(outwardVector[1], 2), 0.5)
      const outwardDirection = [
        outwardVector[0] / outwardMagnitude,
        outwardVector[1] / outwardMagnitude
      ]

      let lastDistance = Math.pow(Math.pow(circle[i][0] - lastCircle[i][0], 2) + Math.pow(circle[i][1] - lastCircle[i][1], 2), 0.5)
      if (isNaN(lastDistance)) {
        console.log(lastDistance)
        lastDistance = 0
      }

      const randInput = Math.random() * randomSpacing + constantSpacing
      const growth = outwardDirection.map((x) => x*randInput)
      const rand2 = Math.random() * randomRadialSpacing + constantRadialSpacing

      nextCircle.push([
        circle[i][0] + growth[0] + (rand2 + lastDistance*lastDistanceInfluence) * Math.cos(angle),
        circle[i][1] + growth[1] + (rand2 + lastDistance*lastDistanceInfluence) * Math.sin(angle)
      ]);
    }
    nextCircle.push(nextCircle[0])
    lines.push(nextCircle)
    lastCircle = circle
    circle = nextCircle
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
