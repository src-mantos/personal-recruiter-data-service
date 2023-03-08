# Personal Recruiter Data Service

Personal Recruiter Data Service is primarily a web scraping tool that provides access to this data through an express api. 

## Usage
- `yarn serve` - Build and start web server - [swagger docs](http://localhost:3000/v1/docs/)
- `yarn docs` - Generates more robust Developer API Documentation

\*\* other yarn targets are available



## Maintenance Notes
### [Playwright](https://playwright.dev/)
This library was chosen for this project primarily due to the robust interface for quickly being able to [generate code](https://playwright.dev/docs/cli#generate-code).

`npx playwright codegen`

this will open a chromium browser and playwright script generator.
