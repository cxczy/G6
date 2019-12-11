import Group from '@antv/g-canvas/lib/group';
import { mat3, vec3 } from '@antv/matrix-util'
import { transform } from '@antv/matrix-util'
import { GraphData, ICircle, IEllipse, IMatrix, IPoint, IRect } from '@g6/types'

/**
 * 是否在区间内
 * @param   {number}       value  值
 * @param   {number}       min    最小值
 * @param   {number}       max    最大值
 * @return  {boolean}      bool   布尔
 */
const isBetween = (value: number, min: number, max: number) => value >= min && value <= max

/**
 * 获取两条线段的交点
 * @param  {IPoint}  p0 第一条线段起点
 * @param  {IPoint}  p1 第一条线段终点
 * @param  {IPoint}  p2 第二条线段起点
 * @param  {IPoint}  p3 第二条线段终点
 * @return {IPoint}  交点
 */
const getLineIntersect = (p0: IPoint, p1: IPoint, p2: IPoint, p3: IPoint): IPoint => {
  const tolerance = 0.001;

  const E: IPoint = {
    x: p2.x - p0.x,
    y: p2.y - p0.y
  };
  const D0: IPoint = {
    x: p1.x - p0.x,
    y: p1.y - p0.y
  };
  const D1: IPoint = {
    x: p3.x - p2.x,
    y: p3.y - p2.y
  };
  const kross: number = D0.x * D1.y - D0.y * D1.x;
  const sqrKross: number = kross * kross;
  const sqrLen0: number = D0.x * D0.x + D0.y * D0.y;
  const sqrLen1: number = D1.x * D1.x + D1.y * D1.y;
  let point: IPoint;
  if (sqrKross > tolerance * sqrLen0 * sqrLen1) {
    const s = (E.x * D1.y - E.y * D1.x) / kross;
    const t = (E.x * D0.y - E.y * D0.x) / kross;
    if (isBetween(s, 0, 1) && isBetween(t, 0, 1)) {
      point = {
        x: p0.x + s * D0.x,
        y: p0.y + s * D0.y
      };
    }
  }
  return point;
}

/**
 * point and rectangular intersection point
 * @param  {IRect} rect  rect
 * @param  {IPoint} point point
 * @return {IPointIPoint} rst;
 */
export const getRectIntersectByPoint = (rect: IRect, point: IPoint): IPoint => {
  const { x, y, width, height } = rect;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const points: IPoint[] = [];
  const center: IPoint = {
    x: cx,
    y: cy
  };
  points.push({
    x,
    y
  });
  points.push({
    x: x + width,
    y
  });
  points.push({
    x: x + width,
    y: y + height
  });
  points.push({
    x,
    y: y + height
  });
  points.push({
    x,
    y
  });
  let rst: IPoint;
  for (let i = 1; i < points.length; i++) {
    rst = getLineIntersect(points[i - 1], points[i], center, point);
    if (rst) {
      break;
    }
  }
  return rst;
}

/**
 * get point and circle inIntersect
 * @param {ICircle} circle 圆点，x,y,r
 * @param {IPoint} point 点 x,y
 * @return {IPoint} applied point
 */
export const getCircleIntersectByPoint = (circle: ICircle, point: IPoint): IPoint => {
  const cx = circle.x;
  const cy = circle.y;
  const r = circle.r;
  const { x, y } = point;
  const d = Math.sqrt(Math.pow((x - cx), 2) + Math.pow((y - cy), 2));
  if (d < r) {
    return null;
  }
  const dx = (x - cx);
  const dy = (y - cy);
  const signX = Math.sign(dx);
  const signY = Math.sign(dy);
  const angle = Math.atan(dy / dx);
  return {
    x: cx + Math.abs(r * Math.cos(angle)) * signX,
    y: cy + Math.abs(r * Math.sin(angle)) * signY
  };
}

/**
 * get point and ellipse inIntersect
 * @param {Object} ellipse 椭圆 x,y,rx,ry
 * @param {Object} point 点 x,y
 * @return {object} applied point
 */
export const getEllispeIntersectByPoint = (ellipse: IEllipse, point: IPoint): IPoint => {
  const a = ellipse.rx;
  const b = ellipse.ry;
  const cx = ellipse.x;
  const cy = ellipse.y;
  
  const dx = (point.x - cx);
  const dy = (point.y - cy);
  // 直接通过 x,y 求夹角，求出来的范围是 -PI, PI
  let angle = Math.atan2(dy / b, dx / a);

  if (angle < 0) {
    angle += 2 * Math.PI; // 转换到 0，2PI
  }
  
  return {
    x: cx + a * Math.cos(angle),
    y: cy + b * Math.sin(angle)
  };
}

/**
 * coordinate matrix transformation
 * @param  {number} point   coordinate
 * @param  {IMatrix} matrix  matrix
 * @param  {number} tag     could be 0 or 1
 * @return {IPoint} transformed point
 */
export const applyMatrix = (point: IPoint, matrix: IMatrix, tag: 0 | 1 = 1): IPoint => {
  const vector = [ point.x, point.y, tag ]
  vec3.transformMat3(vector, vector, matrix)

  return {
    x: vector[0],
    y: vector[1]
  }
}

/**
 * coordinate matrix invert transformation
 * @param  {number} point   coordinate
 * @param  {number} matrix  matrix
 * @param  {number} tag     could be 0 or 1
 * @return {object} transformed point
 */
export const invertMatrix = (point: IPoint, matrix: IMatrix, tag: 0 | 1 = 1): IPoint => {
  const inversedMatrix = mat3.invert([], matrix)
  const vector = [ point.x, point.y, tag ]
  vec3.transformMat3(vector, vector, inversedMatrix)

  return {
    x: vector[0],
    y: vector[1]
  }
}

/**
 * 
 * @param p1 First coordinate
 * @param p2 second coordinate
 * @param p3 three coordinate
 */
export const getCircleCenterByPoints = (p1: IPoint, p2: IPoint, p3: IPoint): IPoint => {
  const a = p1.x - p2.x;
  const b = p1.y - p2.y;
  const c = p1.x - p3.x;
  const d = p1.y - p3.y;
  const e = (p1.x * p1.x - p2.x * p2.x - p2.y * p2.y + p1.y * p1.y) / 2;
  const f = (p1.x * p1.x - p3.x * p3.x - p3.y * p3.y + p1.y * p1.y) / 2;
  const denominator = b * c - a * d;
  return {
    x: -(d * e - b * f) / denominator,
    y: -(a * f - c * e) / denominator
  };
}

/**
 * get distance by two points
 * @param p1 first point
 * @param p2 second point
 */
export const distance = (p1: IPoint, p2: IPoint): number => {
  const vx = p1.x - p2.x;
  const vy = p1.y - p2.y;
  return Math.sqrt(vx * vx + vy * vy);
}

/**
 * scale matrix
 * @param matrix [ [], [], [] ]
 * @param scale 
 */
export const scaleMatrix = (matrix: IMatrix[], scale: number) => {
  const result: IMatrix[] = []
  matrix.forEach(row => {
    const newRow = []
    row.forEach(v => {
      newRow.push(v * scale)
    })
    result.push(newRow)
  })
  return result
}

/**
 * Floyd Warshall algorithm for shortest path distances matrix
 * @param  {array} adjMatrix   adjacency matrix
 * @return {array} distances   shortest path distances matrix
 */
export const floydWarshall = (adjMatrix: IMatrix[]): IMatrix[] => {
  // initialize
  const dist: IMatrix[] = [];
  const size = adjMatrix.length;
  for (let i = 0; i < size; i += 1) {
    dist[i] = [];
    for (let j = 0; j < size; j += 1) {
      if (i === j) {
        dist[i][j] = 0;
      } else if (adjMatrix[i][j] === 0 || !adjMatrix[i][j]) {
        dist[i][j] = Infinity;
      } else {
        dist[i][j] = adjMatrix[i][j];
      }
    }
  }
  // floyd
  for (let k = 0; k < size; k += 1) {
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
}

/**
 * get adjacency matrix
 * @param data graph data
 * @param directed whether it's a directed graph
 */
export const getAdjMatrix = (data: GraphData, directed: boolean): IMatrix[] => {
  const nodes = data.nodes;
  const edges = data.edges;
  const matrix: IMatrix[] = [];
  // map node with index in data.nodes
  const nodeMap = new Map();
  nodes.forEach((node, i) => {
    nodeMap.set(node.id, i);
    const row = [];
    matrix.push(row);
  });

  edges.forEach(e => {
    const source = e.source;
    const target = e.target;
    const sIndex = nodeMap.get(source);
    const tIndex = nodeMap.get(target);
    matrix[sIndex][tIndex] = 1;
    if (!directed) {
      matrix[tIndex][sIndex] = 1;
    }
  });
  return matrix;
}

/**
 * 平移group
 * @param group Group 实例
 * @param point 坐标
 */
export const translate = (group: Group, point: IPoint) => {
  const matrix: IMatrix = group.getMatrix()
  transform(matrix, [
    [ 't',  point.x, point.y ]
  ])
}