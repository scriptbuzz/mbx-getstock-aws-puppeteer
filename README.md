# mbx-getstock-aws-puppeteer
A serverless solution to gather stock info from the web using Puppeteer on AWS


**Background**

Data analytics, and other data processing solutions, rely on a rich set of data sources to hydrate data lakes and data warehouses. Sometimes this data is readly available in the form of structed databases and semi-structured datasets. Other times it has to be collected from remote sources via streaming solutions or API calls. 

When it comes to web-based data sources, typicall data can be collected via APIs such as those published by social media providers. But not every data source exposes APIs or has APIs that are developer-friendly. In those cases, web scraping can be a practicle solution. Many tools exist to support web scraping. One of the more popular tools is Puppeteer, which is commonly used to automate testing of web pages, but has been repurposed for web data capture. By leveraing the AWS cloud, data collected via Puppeteer can benefit from sclabality, high availablity, and cost effective compute and storage infrastrcuture. 

**Overview of Solution**

This solution guide demonstrates two key features of Puppteer: 

* Capture a web page into an image as PNG and JPG file.
* Capture textual content from a webpage.  

two seperate function. captures a screen image from a website URL provided by the user. The captured webpage image is saved into an S3 bucket in the user's AWS account.  The solution is invoked by a RESTful API managed by the Amazon API Gateway service. The processing is handled by a Lambda function which invokes the Puppeteer library. The solution can be modified easily to capture textual content instead of bitmap images. NOTE: This is a proof of concept guide. For production workloads, please follow established security best preactices for architectinbg solutions in the AWS cloud. 

**Architectural Diagram**

![serverless puppeteer](./mbx-aws-lambda-puppeteer.jpg)

**Solution Components**

* Puppeteer: Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. Puppeteer runs headless by default, but can be configured to run full (non-headless) Chrome or Chromium. https://pptr.dev/

* Amazon API Gateway: AWS service for creating, publishing, maintaining, monitoring, and securing REST, HTTP, and WebSocket APIs. In this solution, it will expose an endpoint that when invoked, it will trigger a Lambda function that will process the request to capture a webpage, save the captured image to an S3 bucket. 

* AWS Lambda: Serverless compute service that executes the NodeJS logic to process the webpage capture request and S3 storage. 

* Amazon S3: Highly durable storage to host screen captures. 

**Solution Outline**

* Log-in to your AWS Account
* Create an API and expose an endpoint in the API Gateway
* Create a Lambda Layer to host Puppeteer
* Create an S3 bucket to host captured images
* Assign needed permissions/roles to services
* Invoke the API Gateway endpoint with the requested webpage URLs

**Step By Step Instructions**

This solution guide assumes some familiarty with the various components and packages involved. 

**Create S3 Bucket**
* Create an S3 bucket to host captured images. 
* When web site image is captured, it will be saved using the name format [timestmp-capture].jpg
* Create a Lambda Layer

**Create Lambda Function**
* Select NodeJs v12 as the language
* Select Layer 
* Set RAM to 1600 and Duration to 3 minute. You can decide which values work best for you. 

**Create API Gateway***
* Create a new RESTFUL API
* create Resource "url"
* Create Method

**Test Web Capture**
* From your browser, enter your API endpoint. The format should look similar to the following url but wiht your specific account and region info: https://111111111.execute-api.us-east-1.amazonaws.com/dev/stock/AMZN

**References**
* Puppeteer

