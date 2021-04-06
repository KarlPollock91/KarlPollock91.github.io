var size = 10;
var grid;

function initGrid(){
    grid = document.getElementById("grid-container");
    gridHTML = "";
    for (let i = 0; i < size; i++){
        for (let j = 0; j < size; j++){
        gridHTML += `<div class="grid-item" id="${i}${j}"></div>` + "\n";
        }
    }
    grid.innerHTML = gridHTML;
}