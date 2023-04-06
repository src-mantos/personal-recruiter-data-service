# Personal Recruiter Data Service

Personal Recruiter Data Service is primarily a web scraping tool that provides access to this data through an express api. 

## Usage
This service requires the database backend as a run time dependency, see the main Personal Recruiter Suite readme.
- `yarn serve` - Build and start web server - [swagger docs](http://localhost:3000/v1/docs/)
- `yarn docs` - Generates more robust Developer API Documentation


## Maintenance Notes
### [Playwright](https://playwright.dev/)
This library was chosen for this project primarily due to the robust interface for quickly being able to [generate code](https://playwright.dev/docs/cli#generate-code).

`npx playwright codegen`

this will open a chromium browser and playwright script generator.
