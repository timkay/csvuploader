# csvuploader

Upload a CSV to an in-memory database.

## Scenario

> You work on a product that receives potentially large files in CSV format, process them and import their data into our database. However, providers do not all use the same layout of columns. The order may differ between providers, they may only send a subset of the columns, or they may include additional columns we do not wish to capture.

The "potentially large" modifier indicates that the implementation should avoid loading the entire CSV file into memory for processing. Instead, the code streams the upload throught the database insertion process.

## Task
> Build an API with a single endpoint that accepts a file upload in the CSV format and the provider name that sent the file, looks up a configuration defining the column layout and parses the CSV into an in-memory database (e.g. SQLite, mongodb-memory-server). The columns we care about are defined below in the “Columns” section.

The requirements are somewhat confusing. CSV files usually have a first row that contains the column headers. In that case, the confuration file would be unnecessary. Therefore, we make the assumption that the CSV files will contain no column headers.

### Framework / Libraries / Architecture

The server is implemented in nodejs using the express framework. Additional packages yaml, connect-busboy (facilitates streaming of the uploaded CSV file), csv-parser (provides CSV parsing with streaming), and sqlite3 provide the needed functionality to meet the requirements.

### Configuration File

The configuration file uses YAML format because it is simple and easy to maintain. The format is obvious, so no additional description is provided.

A default configuration is included, which will be used in case the user specifies a provider that does not exist.

### In-Memory Database

The data is stored in sqlite3, chosen because it supports both in-memory and persistent capabilities. For testing, the data is written to the filesystem and can be viewed using the sqlite3 command line.

### API

The API is a single endpoint with a single method: /api/v1/upload. A POST request should contain MIME-encoded data with two fields: The `provider` and `file` (although the name of the field for the uploaded file is not used. The API request returns a JSON object containing the provider, provider name (from the configuration file), the column names, and the number of rows processed.

For debugging, an addtional API method provides a dump of the rows for a given provider: /api/v1/dump. See public/dump.html for a usage example.

The code is running at https://csvuploader.timkay.com/

To dump the uploaded data: https://csvuploader.timkay.com/dump.html

### To Do

A lot of work needs to be done to productize the code, such as checking that the specified provider exists. Of course, a more likely scenario is that a user would sign in, and their provider would automatically be specified, so the error handling would be different.


