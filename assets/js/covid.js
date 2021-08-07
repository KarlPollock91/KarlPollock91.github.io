const graphWidth = 550;
const graphHeight = 400;
var numDays = 30;
const query = `https://data.nsw.gov.au/data/api/3/action/datastore_search_sql?sql=SELECT%20notification_date,%20COUNT(*)%20FROM%20%2221304414-1ff1-4243-a5d2-f52778048b29%22%20GROUP%20BY%20notification_date%20ORDER%20BY%20notification_date%20asc`
var mapsReady = false;

var dailyNewCases = [];
var dailyNewCasesSDA = [];
var firstRateOfChange = [];
var firstRateOfChangeSDA = [];
var secondRateOfChange = [];
var secondRateOfChangeSDA = [];


fetch(query).then((response) => {
    return response.json();
}).then((json) => {

    for (let i = 0; i < json.result.records.length; i++) {
        dailyNewCases.push([json.result.records[i].notification_date, json.result.records[i].count])
    }

    dailyNewCasesSDA = calculateSevenDayAverage(dailyNewCases);
    firstRateOfChange = calculateDailyRateOfChange(dailyNewCases);
    firstRateOfChangeSDA = calculateSevenDayAverage(firstRateOfChange);
    secondRateOfChange = calculateDailyRateOfChange(firstRateOfChange);
    secondRateOfChangeSDA = calculateSevenDayAverage(secondRateOfChange);
    

    google.charts.load('current', {'packages':['corechart']});
    // Set a callback to run when the Google Visualization API is loaded.
    google.charts.setOnLoadCallback(readyToDraw);

    function calculateSevenDayAverage(data) {
        sevenDayAverage = [];
        for (let i = 6; i < data.length; i++){
            var sum = 0;
            for (let j = 0; j < 7; j ++) {
                sum += data[i - j][1];
            }
            sevenDayAverage.push([data[i][0], sum / 7]);
        }
        return sevenDayAverage;
    }

    function calculateDailyRateOfChange(data){
        rateOfChange = [];
        for (let i = 1; i < data.length; i++){
            rateOfChange.push([data[i][0], data[i][1] / data[i-1][1]]);
        }
        return rateOfChange;
    }

    
}).catch((err) => {
    console.log(err);
});

function readyToDraw() {
    mapsReady = true;
    drawChart(dailyNewCases, 'Daily New Cases of Covid-19 in NSW', 'Daily new cases', 'row1graph1');
    drawChart(dailyNewCasesSDA, 'Daily New Cases of Covid-19 in NSW (Seven Day Average)', 'Daily new cases', 'row1graph2');
    drawChart(firstRateOfChange, 'Rate of Change of Daily New Cases of Covid-19 in NSW', 'Rate of Change', 'row2graph1');
    drawChart(firstRateOfChangeSDA, 'Rate of Change of Daily New Cases of Covid-19 in NSW (Seven Day Average)', 'Rate of Change', 'row2graph2');
    drawChart(secondRateOfChange, 'Second Rate of Change of Daily New Cases of Covid-19 in NSW', 'Rate of Change', 'row3graph1');
    drawChart(secondRateOfChangeSDA, 'Second Rate of Change of Daily New Cases of Covid-19 in NSW (Seven Day Average)', 'Rate of Change', 'row3graph2');
}

function drawChart(data, title, yAxis, div) {
    //Row1Chart1 Unsmoothed daily new cases 
    var graphData = new google.visualization.DataTable();
    graphData.addColumn('string', 'Date');
    graphData.addColumn('number', yAxis);
    graphData.addRows(data.slice(data.length - numDays));
       
    var options = {'title' : title,
        hAxis: {
            title: 'Month'
        },
        vAxis: {
            title: yAxis
        },   
        'width':graphWidth,
        'height':graphHeight	  
    };

    var chart = new google.visualization.LineChart(document.getElementById(div));
    chart.draw(graphData, options);
}

function inputSubmit() {
    if (mapsReady) {
        numDays = Math.min(parseInt(document.getElementById("num-days-input").value), secondRateOfChangeSDA.length);
        readyToDraw();
    }
}