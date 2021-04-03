# csvuploader

Upload a CSV to an in-memory database.

## Scenario

> You work on a product that receives potentially large files in CSV format, process them and import their data into our database. However, providers do not all use the same layout of columns. The order may differ between providers, they may only send a subset of the columns, or they may include additional columns we do not wish to capture.

The "potentially large" modifier indicates that the implementation should avoid loading the entire CSV file into memory for processing. Instead, the code streams the upload to into the database insertion process.

## Task
> Build an API with a single endpoint that accepts a file upload in the CSV format and the provider name that sent the file, looks up a configuration defining the column layout and parses the CSV into an in-memory database (e.g. SQLite, mongodb-memory-server). The columns we care about are defined below in the “Columns” section.

The requirements are somewhat confusing. CSV files usually have a first row that contains the column headers. In that case, the confuration file would be unnecessary, so we make the assumption that the CSV files will contain no column headers. Then the configuration file is needed to identify the columns for each provider.

### Framework / Libraries / Architecture

The server is implemented in nodejs using the express framework. Additional packages yaml, connect-busboy (uploading CSV file with streaming), csv-parser (CSV parsing with streaming), and sqlite3 provide the needed functionality to meet the requirements.

### Configuration File

The configuration file is named `settings.yaml` uses YAML format. (YAML is simple and easy to maintain.) The configuration file format is obvious, so no additional description is provided here.

The configuration file contanis a provider named `default` which serves two purposes:

1. specifies the columns (and their ordering) that are required, and
2. will be used when the supplied provider field does not exist in the configuration file.

### In-Memory Database

The data is stored in sqlite3, chosen because it supports the ability to store a database either in-memory and persistent in the filesystem. For testing, the latter is used to store the database to the filesystem, so it can be viewed using the sqlite3 command line. The code automatically switches from in-memory to persistent when run in debug mode.

### API

The API is a single endpoint with a single method: /api/v1/upload. A POST request should contain MIME-encoded data with two fields named `provider` and `file` (although the name of the file field is not used. The API request returns a JSON object containing the provider, provider name (from the configuration file), the column names, and the number of rows processed.

See the root document (index.html) for a web interface that exercises this method.

For debugging, an addtional API method provides a dump of the rows for a given provider: /api/v1/dump. See dump.html for sample usage.

The code is running at https://csvuploader.timkay.com/

To dump the uploaded data: https://csvuploader.timkay.com/dump.html

### To Do

A lot of work needs to be done to productize the code, such as checking that the specified provider exists. Of course, a more likely scenario is that a user would sign in, and the provider string would be pulled from the user profile, so the error handling would be via a different mechanism.

### Testing

Two files, sample1.csv and sample2.csv have been provided. sample1.csv contains column headers. Because the first row isn't treated as headers, that row ends up as a first row of data. It's useful to show that the configuration file works. If you upload as anything but provider=timkay, the columns align. The provider=timkay configuration swaps the first two columns.

Haven't tested the streaming. To do that, one would could create a large CSV file. Then set a vlimit memory limit for the server process that is smaller than the file. If the upload works, must be streaming successfully.
