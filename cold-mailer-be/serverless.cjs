const serverlessConfig = {
  service: "jobping",
  useDotenv: true,
  provider: {
    name: "aws",
    runtime: "nodejs20.x",
    region: "ap-south-1",
    stage: "prod",
    environment: {
      NODE_ENV: "production",
      MONGODB_URI: "${env:MONGODB_URI, ''}",
      GOOGLE_CLIENT_ID: "${env:GOOGLE_CLIENT_ID, ''}",
      GOOGLE_CLIENT_SECRET: "${env:GOOGLE_CLIENT_SECRET, ''}",
      SESSION_SECRET: "${env:SESSION_SECRET, 'default_session_secret'}",
      JWT_SECRET_KEY: "${env:JWT_SECRET_KEY, 'default_jwt_secret'}",
      CLIENT_URL: "${env:CLIENT_URL, 'http://localhost:3000'}",
      FRONTEND_URL: "${env:FRONTEND_URL, 'http://localhost:5173'}",
      GOOGLE_CALLBACK_URL:
        "${env:GOOGLE_CALLBACK_URL, 'http://localhost:5100/auth/google/callback'}",
    },
  },
  functions: {
    api: {
      name: "jobping",
      handler: "index.handler",
      timeout: 29,
      events: [
        {
          http: {
            path: "/",
            method: "any",
            cors: true,
          },
        },
        {
          http: {
            path: "/{proxy+}",
            method: "any",
            cors: true,
          },
        },
      ],
    },
  },
  plugins: ["serverless-dotenv-plugin"],
  package: {
    patterns: ["!test/**", "!.git/**", "!node_modules/.bin/**"],
  },
};

// Only load serverless-offline when running locally (not in GitHub Actions)
if (!process.env.GITHUB_ACTIONS) {
  serverlessConfig.plugins.push("serverless-offline");
  serverlessConfig.custom = {
    "serverless-offline": {
      noPrependStageInUrl: true,
    },
  };
}

module.exports = serverlessConfig;
