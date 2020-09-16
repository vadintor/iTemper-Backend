function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}
const DefaultColors = [
    ["#e39900", "#990ae3", "#990000"],
    ["#0a99e3", "#000a99", "#00e31e"],
    ["#00FF00", "#00AA00", "#005500"],
    ["#00FFFF", "#00AAAA", "#005555"],
    ["#0000FF", "#0000AA", "#000055"],
  ];
const MaxRow = DefaultColors.length - 1;
const MaxCol = DefaultColors[0].length - 1;

export function randomColor(): string {
    const row = getRandomInt(MaxRow);
    const col = getRandomInt(MaxCol);
    return DefaultColors[row][col];
}