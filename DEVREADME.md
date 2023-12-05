# OkAPI

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.10.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


# NOTES

- we should be able to use `yarn watch` to get live updates while we develop. This will watch the updates and rebuild specific files which in turn updates the dist directory which contains the files that chrome looks at to run our extension.
- To communicate with the content script you must do the following in the popup:
  - using chrome api get the current tabID
  - use chrome.tabs.sendMessage() to send a message with the correct message body (i.e. from, action, and message)

_NOTE: The "content-script" is injected into the browser page and we instantiate listeners on chrome runtime. When we invoke sendMessage() from the extension the listener recieves it and processes it._
_NOTE: This one-time messaging strategy works the same from the service_worker/background script and the popup itself._
  - content script runs from context of webpage and can access the DOM.
  - background script/service worker is a longer lived script that will run regardless of if the extension is open (as long as it is receiving events).
  - the extension will only run when open/active.