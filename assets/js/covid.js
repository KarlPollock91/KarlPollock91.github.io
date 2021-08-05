const graphWidth = 550;
const graphHeight = 400;
var numDays = 30;
var query = `https://data.nsw.gov.au/data/api/3/action/datastore_search_sql?sql=SELECT * from "21304414-1ff1-4243-a5d2-f52778048b29" ORDER BY notification_date DESC`

fetch(query).then((response) => {
    return response.json();
}).then((json) => {
    var dailyNewCasesDict = {};

    //Count each case by date

    for (let i = 0; i < json.result.records.length; i++) {
        if (dailyNewCasesDict.hasOwnProperty(json.result.records[i]["notification_date"])) {
            dailyNewCasesDict[json.result.records[i]["notification_date"]] += 1;
        } else {
            dailyNewCasesDict[json.result.records[i]["notification_date"]] = 1;
        }
    }
    
    //Place data into orderable structure
    var dailyNewCases = [];

    for (let key in dailyNewCasesDict) {
        dailyNewCases.push([key, dailyNewCasesDict[key]])
    }
    dailyNewCases.sort((a, b) => {
        return a[0] - b[0];
    }).reverse();

    var dailyNewCasesSDA = calculateSevenDayAverage(dailyNewCases);
    var firstRateOfChange = calculateDailyRateOfChange(dailyNewCases);
    var firstRateOfChangeSDA = calculateSevenDayAverage(firstRateOfChange);
    var secondRateOfChange = calculateDailyRateOfChange(firstRateOfChange);
    var secondRateOfChangeSDA = calculateSevenDayAverage(secondRateOfChange);
    

    google.charts.load('current', {'packages':['corechart']});
    // Set a callback to run when the Google Visualization API is loaded.
    google.charts.setOnLoadCallback(readyToDraw);

    function readyToDraw() {
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

