//TODO: BUG: Try adding and removing items a few times. You get ERROR_1
const ROW = "row";
const COL = "col";

//O: Filled space.
//X: Unfilled space.
const O = "o";
const X = "x";
const UNKNOWN = "?";

const SUCCESS = "success";
const SUCCESS_AND_PROGRESS = "successAndProgress";
const FAILURE = "failure";


const ERROR_1 = "The number you entered is too large to fit in that row/column."
const ERROR_2 = "That row/column has already reached the maximum number of blocks it can fit."
const ERROR_3 = "You've entered an incorrectly configured puzzle. It is not solveable."
const ERROR_4 = "You did not enter a valid number."
const ERROR_5 = "You have inserted an invalid file. Try checking the formating."
const ERROR_6 = "There is an unequal number of rows and columns in the file you inserted."

var prevGridSize = 0;
var gridSize;
var itemSize = 20;
var grid;

var mainLayout;

var colParentContainer;
var colNumbersListContainer;
var colButtonsContainer;

var rowParentContainer;
var rowNumbersListContainer;
var rowButtonsContainer;

var messagePopupContainer;
var messagePopupMessage;
var messagePopupClose;

var userInputContainer;
var userInputBeginButton;
var userInputAddFile;
var spinner;

var toggleAlternateSolutionsButton;

var itemStyle;


var numbersDataLists = 
{
    row: [],
    col: []
}

function onLoad(){
    //Element definition.

    mainLayout = document.getElementById("main-layout");
    grid = document.getElementById("grid-container");

    rowParentContainer = document.getElementById("row-container");
    rowNumbersListContainer = document.getElementById("row-numbers");
    rowButtonsContainer = document.getElementById("row-buttons");

    colParentContainer = document.getElementById("column-container");
    colNumbersListContainer = document.getElementById("column-numbers");
    colButtonsContainer = document.getElementById("column-buttons");

    messagePopupContainer = document.getElementById("message-popup");
    messagePopupMessage = document.getElementById("message-popup-message");
    messagePopupClose = document.getElementById("message-popup-close");

    userInputBeginButton = document.getElementById("user-input-begin-button");
    userInputGridSizeInput = document.getElementById("user-input-grid-size-input")
    userInputGridSizeButton = document.getElementById("user-input-grid-size-button");
    userInputAddFile = document.getElementById("user-input-add-file-button");

    spinner = document.getElementById("spinner");

    toggleAlternateSolutionsButton = document.getElementById("toggle-alternate-solutions");
    var viewingSolution = 0;

    itemStyle = document.createElement('style'); 
    itemStyle.innerHTML = "";
    document.body.appendChild(itemStyle);

    //User input construction.

    userInputGridSizeInput.value = 10;

    userInputGridSizeInput.addEventListener("keypress", (event) => {
        if (!isNumber(event.key))
        {
            event.preventDefault();
        }
    });

    userInputAddFile.addEventListener("change", (event) => {
        try {
            var file = event.target.files[0];
            //console.log(file);
            var reader = new FileReader();
            reader.addEventListener('load', (event) => {
                var text = event.target.result;
               
                try {
                    var data = text.match(/[^\r\n]+/g);
                    console.log(data);
                    if ((data.length % 2) != 0) {
                        displayMessagePopup(ERROR_5);
                    } else {
                        var newGridSize = data.length / 2;
                        prevGridSize = gridSize;
                        initGrid(newGridSize);
                        //Clear existing numbers
                        for (let i = 0; i < newGridSize; i++) {
                            for (let j = 0; j < numbersDataLists[COL][i].count; j++){
                                removeNumber(COL, i, j);
                            }
                            for (let j = 0; j < numbersDataLists[ROW][i].count; j++){
                                removeNumber(ROW, i, j);
                            }
                        }

                        for (let i = 0; i < data.length; i++){
                            var numbers = data[i].split(',');
                            for (let j = 0; j < numbers.length; j++){
                                if (numbers[i] == "0") {
                                    break;
                                }
                                if (i >= newGridSize){
                                    addNumber(ROW, i - newGridSize, numbers[j]);
                                } else {
                                    addNumber(COL, i, numbers[j]);
                                }
                            }
                        }
                    }
                } catch(err) {
                    console.log("error 2");
                }
            });
          
            reader.readAsText(file, "UTF-8");
        } catch (err) {
            console.log("error");
            console.log(err);
            displayMessagePopup(ERROR_5);
        }
    })

    userInputGridSizeInput.addEventListener("keyup", (event) => {
        if (event.code === 'Enter') {
            toggleAlternateSolutionsButton.style.visibility = "hidden";
            var input = event.target.value;
            if (!isNumber(input)){
                displayMessagePopup(ERROR_4);
            } else if (input != ""){
                prevGridSize = gridSize;
                initGrid(parseInt(input));
            }
        }
    });

    userInputGridSizeButton.addEventListener("click", () => {
        toggleAlternateSolutionsButton.style.visibility = "hidden";
        var input = userInputGridSizeInput.value;
        if (!isNumber(input)){
            displayMessagePopup(ERROR_4);
        } else if (input != ""){
            prevGridSize = gridSize;
            initGrid(parseInt(input));
        }
    })

    userInputBeginButton.addEventListener('click', () => {
        userInputBeginButton.style.visibility = "hidden";
        spinner.style.visibility = "visible";
        toggleAlternateSolutionsButton.style.visibility = "hidden";
        setTimeout(beginAlgorithm, 1000);
        
    })

    messagePopupClose.addEventListener('click', () => {
        messagePopupContainer.style.visibility = "hidden";
    });

    toggleAlternateSolutionsButton.addEventListener('click', () => {
        viewingSolution = (viewingSolution + 1) % completeSolutions.length;
        updateGridDOM(completeSolutions[viewingSolution].gridData);
    })
 
    initGrid(10);
}

function initGrid(newGridSize){

    gridSize = newGridSize;

    //Math.ceil(gridSize / 2) is the maximum number of numbers a column or row can have. This should be
    //a variable along with gridSize but I can't think of a name for it lol. maxNumOfNumbers?

    //Generate data structures
    if (gridSize > prevGridSize){
        for (let i = 0; i < gridSize; i++){
            if (i >= numbersDataLists.row.length) {
                numbersDataLists.row.push(new NumbersData(gridSize));
                numbersDataLists.col.push(new NumbersData(gridSize));
                numbersDataLists.col[i].numFreeSpaces += prevGridSize;
                numbersDataLists.row[i].numFreeSpaces += prevGridSize;
            }
            for (let j = Math.ceil(prevGridSize / 2); j < Math.ceil(gridSize / 2); j++) {
                numbersDataLists.row[i].numbers.push(0);
                numbersDataLists.col[i].numbers.push(0);
            }
            numbersDataLists.col[i].numFreeSpaces += (gridSize - prevGridSize);
            numbersDataLists.row[i].numFreeSpaces += (gridSize - prevGridSize);
        }
    } else {
        numbersDataLists.row.splice(gridSize, prevGridSize - gridSize)
        numbersDataLists.col.splice(gridSize, prevGridSize - gridSize)
        for (let i = 0; i < gridSize; i++){
            numbersDataLists.row[i].numbers.splice(Math.ceil(gridSize / 2), (Math.ceil(prevGridSize / 2) - Math.ceil(gridSize / 2)));
            numbersDataLists.col[i].numbers.splice(Math.ceil(gridSize / 2), (Math.ceil(prevGridSize / 2) - Math.ceil(gridSize / 2)));

            numbersDataLists.row[i].numFreeSpaces -= (prevGridSize - gridSize);
            numbersDataLists.col[i].numFreeSpaces -= (prevGridSize - gridSize);

            if (numbersDataLists.row[i].numFreeSpaces < -1) {
                for (let j = 0; j < numbersDataLists.row[i].count; j++){
                    removeNumber(ROW, i, j);
                }
            }
            if (numbersDataLists.col[i].numFreeSpaces < -1) {
                for (let j = 0; j < numbersDataLists.col[i].count; j++){
                    removeNumber(COL, i, j);
                }
            }
        }
        
    }

    //Grid construction
    grid.innerHTML = "";
    for (let i = 0; i < gridSize; i++){
        for (let j = 0; j < gridSize; j++){
            var gridItem = document.createElement("div");
            gridItem.className = "grid-item";
            gridItem.id = `grid-${i},${j}`
            grid.appendChild(gridItem);
        }
    }

    grid.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;

    //Row/col input constructor

    mainLayout.style.gridTemplateColumns = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px ${gridSize * itemSize}px`
    mainLayout.style.gridTemplateColumns = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px ${gridSize * itemSize}px`

    rowParentContainer.style.width = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px`;

    rowNumbersListContainer.style.width = `calc(100% - ${itemSize}px)`;
    rowNumbersListContainer.style.gridTemplateRows = `repeat(${gridSize}, ${itemSize}px)`;

    rowButtonsContainer.style.width = `${itemSize}px`;
    rowButtonsContainer.style.gridTemplateRows = `repeat(${gridSize}, ${itemSize}px)`;

    colParentContainer.style.height = `${(Math.ceil(gridSize / 2) + 1)*itemSize}px`;

    colNumbersListContainer.style.height = `calc(100% - ${itemSize}px)`;
    colNumbersListContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;
    
    colButtonsContainer.style.height = `${itemSize}px`;
    colButtonsContainer.style.gridTemplateColumns = `repeat(${gridSize}, ${itemSize}px)`;

    if (gridSize > prevGridSize){
        for (let i = 0; i < prevGridSize; i++) {
            updateExistingChildElements(COL, i);
            updateExistingChildElements(ROW, i);
        }
        for (let i = prevGridSize; i < gridSize; i++){
            var childElements = generateChildElements(ROW, i);
            rowButtonsContainer.appendChild(childElements.buttonElement);
            rowNumbersListContainer.appendChild(childElements.numbersListElement);

            childElements = generateChildElements(COL, i);
            colButtonsContainer.appendChild(childElements.buttonElement);
            colNumbersListContainer.appendChild(childElements.numbersListElement);
        }
    } else {
        removePreviousChildElements();
        
    }

    updateStyleSheet();

    //debugAddStickmanUnsolveable();

}

function updateStyleSheet() {
var gridItems = document.querySelectorAll('.grid-item');
gridItems.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})

var addNumberButtons = document.querySelectorAll('.add-number-button');
addNumberButtons.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})

var colNumberLists = document.querySelectorAll('.col-number-list');
colNumberLists.forEach(element => {
    element.style.gridTemplateRows = `repeat(${Math.ceil(gridSize / 2)}, ${itemSize}px)`
    element.style.width = `${itemSize}px`;
})

var rowNumberLists = document.querySelectorAll('.row-number-list');
rowNumberLists.forEach(element => {
    element.style.gridTemplateColumns = `repeat(${Math.ceil(gridSize / 2)}, ${itemSize}px)`
    element.style.height = `${itemSize}px`;
})

var numbers = document.querySelectorAll('.number');
numbers.forEach(element => {
    element.style.width = `${itemSize}px`;
    element.style.height = `${itemSize}px`;

})
}

//Generates the children elements for the side bar including the add number buttons, the add number list divs and the number div.
//existingElement: boolean that says whether or not the row/col list is being created from scratch, or updated to match new
//size requirements.
function generateChildElements(colOrRow, index) {
    var buttonElement = document.createElement("div");

    buttonElement.className = "add-number-button";
    buttonElement.id = `${colOrRow}-button-${index}`;

    var icon = document.createElement("i");

    icon.className = "fas fa-plus"

    buttonElement.appendChild(icon);

    buttonElement.addEventListener('click', () => {
        openInput(colOrRow, index);
    });

    var numbersListElement = document.createElement("div");
    numbersListElement.className = `${colOrRow}-number-list`;
    numbersListElement.id = `${colOrRow}-number-list-${index}`;

    for (let i = 0; i < Math.ceil(gridSize / 2); i++){
        var numberDiv = document.createElement("div");
        numberDiv.className = "number";
        numberDiv.id = `${colOrRow}-num-${index},${i}`
        numberDiv.addEventListener('click', () => {
            var numZeroes = Math.ceil(gridSize / 2) - numbersDataLists[colOrRow][index].count;
            removeNumber(colOrRow, index, i - numZeroes);
        })
        numbersListElement.appendChild(numberDiv);
    }

    return {
        buttonElement: buttonElement,
        numbersListElement: numbersListElement
    }
}

function updateExistingChildElements(colOrRow, index) {
    numbersListElement = document.getElementById(`${colOrRow}-number-list-${index}`);
    for (let i = Math.ceil(prevGridSize / 2); i < Math.ceil(gridSize / 2); i++){
        var numberDiv = document.createElement("div");
        numberDiv.className = "number";
        numberDiv.id = `${colOrRow}-num-${index},${i}`
        numberDiv.addEventListener('click', () => {
            var numZeroes = Math.ceil(gridSize / 2) - numbersDataLists[colOrRow][index].count;
            removeNumber(colOrRow, index, i - numZeroes);
        })
        numbersListElement.appendChild(numberDiv);
        
    }
}

function removePreviousChildElements() {
    for (let i = gridSize; i < prevGridSize; i++){
        rowButtonsContainer.removeChild(rowButtonsContainer.lastElementChild);
        rowNumbersListContainer.removeChild(rowNumbersListContainer.lastElementChild);
        colButtonsContainer.removeChild(colButtonsContainer.lastElementChild);
        colNumbersListContainer.removeChild(colNumbersListContainer.lastElementChild);
    }

    for (let i = 0; i < gridSize; i++) {
        var colToRemoveFrom = document.getElementById(`col-number-list-${i}`);
        var rowToRemoveFrom = document.getElementById(`row-number-list-${i}`);
        for (let j = Math.ceil(gridSize/2); j < Math.ceil(prevGridSize / 2); j++){
            colToRemoveFrom.removeChild(colToRemoveFrom.lastElementChild);
            rowToRemoveFrom.removeChild(rowToRemoveFrom.lastElementChild);
        }
    }

}

//The + button is clicked and the user is prompted to enter a number
function openInput(colOrRow, index) {
    console.log(numbersDataLists[colOrRow][index]);
    if (isThereRoom(numbersDataLists[colOrRow][index])){
        addNumber(colOrRow, index, "-1");
    } else {
        displayMessagePopup(ERROR_2)
    }
}

//Check to see if the list can support a new object
function isThereRoom(list) {
    
    if (list.count < list.numbers.length){
        return true;
    } else {
        return false;
    }
}

//Add a number to the board.
//colOrRow: "row" or "col"
//index: Which rowNumberList/colNumberList to enter into
//number: Number to add to board.
function addNumber(colOrRow, index, number) {
    var parsedNumber = parseInt(number);
    var list = numbersDataLists[colOrRow][index];

    var updatedFreeSpace = list.numFreeSpaces;
    updatedFreeSpace -= (parsedNumber + 1);
    //Minus one because we add a free space at start of algorithm.
    if (updatedFreeSpace < -1){
        displayMessagePopup(ERROR_1);
    } else {
        if (parsedNumber != -1){
            list.numFreeSpaces = updatedFreeSpace;
        }
        list.numbers[list.count] = parsedNumber;
        list.count += 1;

        updateNumbersDOM(colOrRow);
    }
}

//Remove number from the board.
//index: the element of the list in col/row.
//elementIndex: index of element being clicked
//todo shit so you need to reverse engineer your fucky ui
function removeNumber(colOrRow, index, elementIndex) {
    var list = numbersDataLists[colOrRow][index];
    let number = list.numbers[elementIndex];
    if (number != -1){
        list.numFreeSpaces += (number + 1);
    }
    list.numbers.splice(elementIndex, 1);
    list.numbers.push(0);
    list.count -= 1;
    updateNumbersDOM(colOrRow);
}

//NOTE: This could be more efficient but you're dealing with such small data sets it doesn't matter if you update everything
//every time it needs to change.

function updateNumbersDOM(colOrRow) {
    var element;
    for (let i = 0; i < gridSize; i++){
        var numZeroes = Math.ceil(gridSize / 2) - numbersDataLists[colOrRow][i].count;
        for (let j = 0; j < numbersDataLists[colOrRow][i].count; j++) {
            element = document.getElementById(`${colOrRow}-num-${i},${j + numZeroes}`);
            if (numbersDataLists[colOrRow][i].numbers[j] != 0){
                if (numbersDataLists[colOrRow][i].numbers[j] == "-1") {
                    var inputBox = document.createElement("input");

                    inputBox.type = "text";
                    inputBox.id = "number-input";
                    inputBox.style.padding = "0px";
                    inputBox.style.margin = "0px";
                    inputBox.style.overflow = "hidden";
                    inputBox.style.height = `${itemSize}px`
                    inputBox.style.width = `${itemSize}px`
                    inputBox.style.textAlign = "center";
                    inputBox.addEventListener('blur', (event) =>{
                        event.target.remove();
                        removeNumber(colOrRow, i, j);
                    });
                    inputBox.addEventListener("keypress", (event) => {
                        if (!isNumber(event.key))
                        {
                            event.preventDefault();
                        }
                    });
                    inputBox.addEventListener("keyup", (event) => {
                        if (event.code === 'Enter') {
                            var input = event.target.value;
                            event.target.remove();
                            removeNumber(colOrRow, i, j);
                            if (!isNumber(input)){
                                displayMessagePopup(ERROR_4);
                            } else if (input != ""){
                                addNumber(colOrRow, i, input);
                            }
                        }
                    });

                    element.innerHTML = "";
                    element.appendChild(inputBox);
                    inputBox.focus();
                } else {
                    
                    element.innerHTML = numbersDataLists[colOrRow][i].numbers[j];
                }
            }
        }
        //And clear the zeroes
        for (let j = 0; j < numZeroes; j++){
            element = document.getElementById(`${colOrRow}-num-${i},${j}`);
            element.innerHTML = "";
        }
    }
}

//Checks if the number inputed is a valid number.
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

//Displays a message in a popup window.
function displayMessagePopup(message){
    messagePopupContainer.style.visibility = "visible";
    messagePopupContainer.focus();
    messagePopupMessage.innerHTML = message;
}



const depthFirstArray = [];
const completeSolutions = [];

//The algorithm starts here
function beginAlgorithm() {
    for (let i = 0; i < gridSize; i++){
        numbersDataLists[COL][i].generatePossibilitySpace(gridSize);
        numbersDataLists[ROW][i].generatePossibilitySpace(gridSize);
    }

    var initialGridData = [];
    
    for (let i = 0; i < gridSize; i++) {
        initialGridData.push([]);
        for (let j = 0; j < gridSize; j++) {
            initialGridData[i].push(UNKNOWN);
        }
    }

    var initialSolution = {
        gridData: initialGridData,
        numbersDataLists: numbersDataLists
    };

    depthFirstArray.push(initialSolution);

    while (depthFirstArray.length > 0) {
        var solution = depthFirstArray.pop();
        var result = mainStage(solution);
        if (result == SUCCESS) {
            completeSolutions.push(solution);
        }
    }

    if (completeSolutions.length > 0){
        updateGridDOM(completeSolutions[0].gridData);
    }
    else {
        displayMessagePopup(ERROR_3);
    }

    userInputBeginButton.style.visibility = "visible";
    spinner.style.visibility = "hidden";

    if (completeSolutions.length > 1) {
        toggleAlternateSolutionsButton.style.visibility = "visible";
    }
}


function mainStage(solution) {
    var madeProgress = true;
    while (madeProgress) {
        madeProgress = false;
        for (let i = 0; i < gridSize; i++){
            prunePossibilitySpace(COL, i, solution);
            var resultCol = explorePossibilitySpace(COL, i, solution);

            prunePossibilitySpace(ROW, i, solution);
            var resultRow = explorePossibilitySpace(ROW, i, solution);

            if ((resultCol == SUCCESS_AND_PROGRESS) || (resultRow == SUCCESS_AND_PROGRESS)) {
                madeProgress = true;
            }

            if ((resultCol == FAILURE) || (resultRow == FAILURE)){
                return FAILURE;
            }   
        }
    }
    
    var complete = checkForCompleteSolution(solution.gridData);
    if (complete){
        console.log("Finished");
        return SUCCESS;
    } else {
        //Guessing time
        var bestProbability = {
            colOrRow: null,
            index: null,
            bestLength: Number.POSITIVE_INFINITY
        }; 
        for (let i = 0; i < gridSize; i++){
            if ((solution.numbersDataLists[COL][i].convertedPossibilitySpace.length > 1) &&
                (solution.numbersDataLists[COL][i].convertedPossibilitySpace.length < bestProbability.bestLength)) {
                bestProbability = {
                    colOrRow: COL,
                    index: i,
                    bestLength: solution.numbersDataLists[COL][i].convertedPossibilitySpace.length
                }
            }

            if ((solution.numbersDataLists[ROW][i].convertedPossibilitySpace.length > 1) &&
                (solution.numbersDataLists[ROW][i].convertedPossibilitySpace.length < bestProbability.bestLength)) {
                bestProbability = {
                    colOrRow: ROW,
                    index: i,
                    bestLength: solution.numbersDataLists[ROW][i].convertedPossibilitySpace.length
                }
            }
        }

        for (let i = 0; i < bestProbability.bestLength; i++) {
            depthFirstArray.push(copyAndModifySolution(solution, bestProbability.colOrRow, bestProbability.index, i));
        }
    }
    
}


//Copys the current solution and trims all possibilities in a row/column except the one specifies.
//Returns the copied soluton.
function copyAndModifySolution(solution, colOrRow, listIndex, possibilityIndex){
    var hackyNestedCopy = JSON.parse(JSON.stringify(solution));
    hackyNestedCopy.numbersDataLists[colOrRow][listIndex].convertedPossibilitySpace = [hackyNestedCopy.numbersDataLists[colOrRow][listIndex].convertedPossibilitySpace[possibilityIndex]];
    return hackyNestedCopy;
}

//Checks to see if the solution is complete, if there are any unknown tiles left on the grid.
function checkForCompleteSolution(gridData) {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (gridData[i][j] == UNKNOWN) {
                return false;
            }
        }
    }
    return true;
}

//Check to see if any of the possibility spaces contain inconsitincies with current known information and remove them if so.
function prunePossibilitySpace(colOrRow, index, solution){
    for (let j = 0; j < solution.numbersDataLists[colOrRow][index].convertedPossibilitySpace.length; j++){
        for (let k = 0; k < gridSize; k++){
            var value;
            if (colOrRow == COL){
                value = solution.gridData[k][index];
            } else {
                value = solution.gridData[index][k];
            }
            if (value != UNKNOWN) {
                if (value != solution.numbersDataLists[colOrRow][index].convertedPossibilitySpace[j][k]){
                    solution.numbersDataLists[colOrRow][index].convertedPossibilitySpace.splice(j, 1);
                    j -= 1;
                    break;
                }
            }
        }
    }
}

//Checks if there are any certainties with the current data and applies them to the board. 
//At this stage it can return failure if there are no possible solutions and the user has inputted incorrect data.

function explorePossibilitySpace(colOrRow, index, solution){
    var possibilitySpace = solution.numbersDataLists[colOrRow][index].convertedPossibilitySpace;
    if (possibilitySpace.length == 0){
        return FAILURE;
    } else{
        var madeProgress = false;
        for (let i = 0; i < gridSize; i++){
            var isConsistent = true;
            var tile = possibilitySpace[0][i];
            if (((colOrRow == COL) && (solution.gridData[i][index] == UNKNOWN)) ||
             ((colOrRow == ROW) && (solution.gridData[index][i] == UNKNOWN))) {
                for (let j = 1; j < possibilitySpace.length; j++){
                    if (possibilitySpace[j][i] != tile){
                        isConsistent = false;
                        break;
                    }
                }
                if (isConsistent){
                    madeProgress = true;
                    if (colOrRow == COL) {
                        solution.gridData[i][index] = tile;
                    } else {
                        solution.gridData[index][i] = tile;
                    }
                    
                }
            }
        }
        if (madeProgress) {
            return SUCCESS_AND_PROGRESS;
        } else {
            return SUCCESS;
        }
    }
}

//Update the DOM with the current solution.
function updateGridDOM(gridData){
    for (let i = 0; i < gridSize; i++){
        for (let j = 0; j < gridSize; j++){
            var tile = document.getElementById(`grid-${i},${j}`);
            tile.style.backgroundColor = '#FFFFFF'
            if (tile.hasChildNodes()){
                tile.removeChild(tile.lastElementChild);
            }
            if (gridData[i][j] == O){
                tile.style.backgroundColor = '#696969'
            } else if (gridData[i][j] == X){
                var icon = document.createElement("i");

                icon.className = "fas fa-times"

                tile.appendChild(icon);
            }
        }
    }
}


function debugAddStickmanUnsolveable(){
    addNumber(COL, 1, 1);
    addNumber(COL, 1, 1);

    addNumber(COL, 2, 1);
    addNumber(COL, 2, 1);
    
    addNumber(COL, 3, 2);
    addNumber(COL, 3, 1);
    addNumber(COL, 3, 4);

    addNumber(COL, 4, 1);
    addNumber(COL, 4, 3);
    addNumber(COL, 4, 1);

    addNumber(COL, 5, 2);
    addNumber(COL, 5, 1);
    addNumber(COL, 5, 4);

    addNumber(COL, 6, 1);
    addNumber(COL, 6, 1);

    addNumber(COL, 7, 1);
    addNumber(COL, 7, 2);

    addNumber(COL, 8, 1);
    addNumber(COL, 8, 3);

    addNumber(COL, 9, 2);
    addNumber(COL, 9, 2);

    addNumber(ROW, 0, 1);
    addNumber(ROW, 0, 2);

    addNumber(ROW, 1, 1);
    addNumber(ROW, 1, 1);
    addNumber(ROW, 1, 1);

    addNumber(ROW, 2, 1);
    addNumber(ROW, 2, 1);
    addNumber(ROW, 2, 1);

    addNumber(ROW, 3, 1);
    addNumber(ROW, 3, 1);

    addNumber(ROW, 4, 4);

    addNumber(ROW, 5, 1);
    addNumber(ROW, 5, 1);

    addNumber(ROW, 6, 1);
    addNumber(ROW, 6, 1);

    addNumber(ROW, 7, 1);
    addNumber(ROW, 7, 1);
    addNumber(ROW, 7, 1);

    addNumber(ROW, 8, 1);
    addNumber(ROW, 8, 1);
    addNumber(ROW, 8, 3);

    addNumber(ROW, 9, 9);

}

function debugAddCloudMoon(){
    addNumber(COL, 0, 3);
    addNumber(COL, 0, 4);

    addNumber(COL, 1, 3);
    addNumber(COL, 1, 4);

    addNumber(COL, 2, 5);
    addNumber(COL, 2, 3);

    addNumber(COL, 3, 5);
    addNumber(COL, 3, 2);

    addNumber(COL, 4, 4);
    addNumber(COL, 4, 3);

    addNumber(COL, 5, 2);
    addNumber(COL, 5, 3);

    addNumber(COL, 6, 1);

    addNumber(COL, 7, 1);
    addNumber(COL, 7, 1);

    addNumber(COL, 8, 1);
    addNumber(COL, 8, 1);

    addNumber(COL, 9, 4);

    addNumber(ROW, 0, 3);

    addNumber(ROW, 1, 5);

    addNumber(ROW, 2, 6);

    addNumber(ROW, 3, 6);
    addNumber(ROW, 3, 3);

    addNumber(ROW, 4, 2);
    addNumber(ROW, 4, 1);

    addNumber(ROW, 5, 1);

    addNumber(ROW, 6, 2);
    addNumber(ROW, 6, 3);

    addNumber(ROW, 7, 3);
    addNumber(ROW, 7, 2);

    addNumber(ROW, 8, 7);

    addNumber(ROW, 9, 6);
}