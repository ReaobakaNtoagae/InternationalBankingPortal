# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:5000](http://localhost:5000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

Input Whitelisting with Regular Expressions:
I made sure that every input field in the registration flow is strictly validated using server-side regular expressions. This means that before any data reaches the database, it’s checked against a pattern that defines exactly what is allowed.

For example, I restricted the full name field to only allow letters, spaces, hyphens, and apostrophes — no numbers or symbols. The ID number must be exactly 13 digits, and the account number must be exactly 12 digits. I also applied a secure pattern to the password field, allowing only specific characters and enforcing a length between 8 and 32 characters.

This validation happens on the backend, not just the frontend, so even if someone tries to bypass the browser, the server will reject anything that doesn’t match the expected format. If the input is invalid, the server responds with a clear error message in JSON format. This protects the system from malformed data, injection attempts, and accidental misuse.

SSL Enforcement for Secure Traffic:
To protect user data during transmission, I enforced SSL (HTTPS) in production. This means that if someone tries to access the site using an insecure HTTP connection, they are automatically redirected to the secure HTTPS version.

I implemented this by checking the protocol of incoming requests. If the request is not using HTTPS and the app is running in production mode, the server redirects the user to the secure version of the same URL. This ensures that all sensitive information — like passwords and personal details — is encrypted while traveling between the client and server.

SSL enforcement is especially important when deploying to cloud platforms or reverse proxies, where users might unknowingly access the site over HTTP. By redirecting them automatically, I make sure the system always uses secure channels.
