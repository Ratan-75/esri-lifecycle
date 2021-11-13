const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const objectsToCsv = require("objects-to-csv");

async function sleep(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function createCsvFile(data) {
    let csv = new objectsToCsv(data);
    await csv.toDisk("./esriproductdata.csv");
}

async function scrapeProductList(page) {
    await page.goto("https://support.esri.com/en/other-resources/product-life-cycle");
    const html = await page.content();
    const $ = cheerio.load(html);
    const results = $("div.category-subheading-links > a").map((index, element) => {
        const productName = $(element).text();
        const productUrl = $(element).attr("href");
        return {productName, productUrl};
    }).get();
    return results;
}
/*
async function scrapeProductTables(results, page) {
    function captureUndefined(input){
        if(input === undefined){
            return "";
        }else{
            return input;
        }
    }
    const tableData = [];
    for(var i=0; i < results.length; i++) {
        const cosntUrl = "https://support.esri.com/";
        await page.goto(cosntUrl + results[i].productUrl);
        const html = await page.content();
        const $ = cheerio.load(html);
        const tableElement = $("div.comparison-chart-table > table > thead > tr");
        const columnLength = $(tableElement).find("th").length;
        const column1 = captureUndefined($(tableElement).find("th:nth-child(1)").text());
        const column2 = captureUndefined($(tableElement).find("th:nth-child(2)").text());
        const column3 = captureUndefined($(tableElement).find("th:nth-child(3)").text());
        const column4 = captureUndefined($(tableElement).find("th:nth-child(4)").text());
        const column5 = captureUndefined($(tableElement).find("th:nth-child(5)").text());
        const column6 = captureUndefined($(tableElement).find("th:nth-child(6)").text());
        const column7 = captureUndefined($(tableElement).find("th:nth-child(7)").text());
        const column8 = captureUndefined($(tableElement).find("th:nth-child(8)").text());
        tableData.push({columnLength, column1, column2, column3, column4, column5, column6, column7, column8});
        await sleep(7000);
    }
    return tableData;
}
*/
async function main() {
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();
    const results = await scrapeProductList(page);
    // const productTableData = await scrapeProductTables(results, page);
    await createCsvFile(results);
}

main();