/**
 * Uniform grid for broad-phase queries. The result buffer is reused: callers
 * must consume it before issuing another query.
 */
export class SpatialGrid {
  private readonly columns: number;
  private readonly rows: number;
  private readonly cells: number[][];
  private readonly queryBuffer: number[] = [];

  public constructor(
    width: number,
    height: number,
    private readonly cellSize = 96
  ) {
    this.columns = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
    this.cells = Array.from({ length: this.columns * this.rows }, () => []);
  }

  public clear(): void {
    for (const cell of this.cells) cell.length = 0;
    this.queryBuffer.length = 0;
  }

  public insert(index: number, x: number, y: number): void {
    this.cells[this.cellIndex(x, y)].push(index);
  }

  public queryCircle(x: number, y: number, radius: number): readonly number[] {
    this.queryBuffer.length = 0;
    const minColumn = this.clampColumn(Math.floor((x - radius) / this.cellSize));
    const maxColumn = this.clampColumn(Math.floor((x + radius) / this.cellSize));
    const minRow = this.clampRow(Math.floor((y - radius) / this.cellSize));
    const maxRow = this.clampRow(Math.floor((y + radius) / this.cellSize));

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        const cell = this.cells[row * this.columns + column];
        for (const index of cell) this.queryBuffer.push(index);
      }
    }
    return this.queryBuffer;
  }

  private cellIndex(x: number, y: number): number {
    return this.clampRow(Math.floor(y / this.cellSize)) * this.columns
      + this.clampColumn(Math.floor(x / this.cellSize));
  }

  private clampColumn(column: number): number {
    return Math.min(Math.max(column, 0), this.columns - 1);
  }

  private clampRow(row: number): number {
    return Math.min(Math.max(row, 0), this.rows - 1);
  }
}
