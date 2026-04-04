/*
Updated: 10/25/2020 by Mike Bitar

Description: This Lambda function is part of a serverless solution that leverages the AWS cloud to perform web data collection in text and image formats using Puppeteer to get a stock value as well as return a captured image of the stock page from Yahoo Finance webpage. The Lambda function is invoked from an API Gateway endpoint with a path /stock/STOCK_LABEL, replace stock label with AMZN, NVDA, TXN, etc. 

Note: Replace AWS resouce names and other environmental constants with the appropriate values.  
*/

console.log('Loading webget function');

const chromium = require('chrome-aws-lambda'); // Ensure this is available in a Lambda Layer

const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ddb = new AWS.DynamoDB.DocumentClient();

const target_url = 'https://finance.yahoo.com/quote/' ;
const api_gateway_path = '/stock/'; // expected API Gateway path prefix
const dbname = 'mbx-getstock'; // dynamoDB table name
const save_path = '/tmp/'; // Lambda's tmp folder where captured images are saved before uploaded to S3
const dstBucket = 'mbx-getstock'; // Replace with your S3 bucket name. S3 bucket name where screen snapshots are saved
const image_format = '.jpg';
const dstKey = 'capture'+image_format; // default screen capture file name. Will be prefixed with a timestamp

exports.handler = async(event, context, callback) => {
  let result = null;
  let browser = null;
  let price = null;

  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('event.path: ', event.path);

  var event_path = JSON.stringify(event.path);
  
  console.log('event_path full: ', event_path);

  const STOCK = event.pathParameters.symbol;
  console.log('STOCK:  ' + STOCK);

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();
    const url = target_url + STOCK;

    console.log('URL:  ' + url);

    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#quote-market-notice');
    
    // get stock price
    price = await page.evaluate(() => document.querySelector("#quote-header-info > div.Pos\\(r\\) > div > div > span").textContent);
    console.log("STOCK PRICE:", price);
    await page.screenshot({ path: save_path + dstKey }); // save captured image in tmp

    result = await page.title();

  }
  catch (error) {
    return callback(error);
  }
  finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  
  // create date/timestamp
  let now = new Date();
  let nowIOS = now.toISOString();

// S3 storage

  // upload captured image from tmp to S3 bucket
  try {
    const data = fs.readFileSync(save_path + dstKey);
    const base64data = Buffer.from(data, 'binary');

    await s3.putObject({
      Bucket: dstBucket,
      Key: nowIOS + '-' + STOCK + image_format, 
      Body: base64data
    }).promise();
    console.log('S3 upload complete');
  } catch (err) {
    console.log('Error uploading to S3: ', err.message);
  }

// DynamoDB storage

  // Build parameters
  var params = {
    TableName: dbname,
    Item: {
      'timestamp': nowIOS,
      'stock_label': STOCK,
      'stock_value': price,
      's3_link' : 'https://'+dstBucket+'.s3.amazonaws.com/'+nowIOS+'-'+STOCK+image_format
    }
  };

  // save parameters in dynamodb
  try {
    await ddb.put(params).promise();
  }
  catch (e) {
    console.log(e.message);
  }

  // return response to calling api
  const response = {
    statusCode: 200,
    body: JSON.stringify(price),
  };
  console.log('response:  ', response);

  return callback(null, response);

};
