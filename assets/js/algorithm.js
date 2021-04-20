var depthFirstArray = [];

onmessage = (e) => {
    var numbersDataLists = e.data.numbersDataLists;
    var gridSize = e.data.gridSize;

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

    postMessage(completeSolutions);
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